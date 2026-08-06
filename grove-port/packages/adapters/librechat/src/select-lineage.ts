import type { LibreChatMessage, LibreChatMessageTreeNode } from './types.js';
import { isImportableMessage } from './format-message.js';

export interface SelectLineageResult {
  orderedMessages: LibreChatMessage[];
  hadFork: boolean;
}

function isRootParent(parentMessageId: string | null | undefined): boolean {
  return !parentMessageId || parentMessageId === '00000000-0000-0000-0000-000000000000';
}

/**
 * Walk from the newest leaf to the root when parent pointers exist.
 * Falls back to createdAt order when the export has no tree metadata.
 */
export function selectActiveLineage(messages: LibreChatMessage[]): SelectLineageResult {
  if (messages.length === 0) {
    return { orderedMessages: [], hadFork: false };
  }

  const importable = messages.filter(isImportableMessage);
  const byId = new Map(importable.map((message) => [message.messageId, message]));
  const hasParentPointers = importable.some((message) => message.parentMessageId !== undefined);

  if (!hasParentPointers) {
    const orderedMessages = [...importable].sort(
      (left, right) =>
        new Date(left.createdAt ?? 0).getTime() - new Date(right.createdAt ?? 0).getTime(),
    );
    return { orderedMessages, hadFork: false };
  }

  const childIds = new Set<string>();
  for (const message of importable) {
    const parentId = message.parentMessageId;
    if (parentId && !isRootParent(parentId)) {
      childIds.add(parentId);
    }
  }

  const leaves = importable.filter((message) => !childIds.has(message.messageId));
  const leaf =
    leaves.sort(
      (left, right) =>
        new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime(),
    )[0] ?? importable[importable.length - 1];

  const lineageIds = new Set<string>();
  const lineage: LibreChatMessage[] = [];
  let current: LibreChatMessage | undefined = leaf;

  while (current) {
    // A cyclic `parentMessageId` chain would otherwise loop forever, growing
    // `lineage` until the process dies of memory exhaustion.
    if (lineageIds.has(current.messageId)) {
      break;
    }

    lineage.unshift(current);
    lineageIds.add(current.messageId);
    const parentId = current.parentMessageId;
    current =
      parentId && !isRootParent(parentId) ? byId.get(parentId) : undefined;
  }

  const orderedMessages = lineage.filter(isImportableMessage);
  const hadFork = importable.some((message) => !lineageIds.has(message.messageId));

  return { orderedMessages, hadFork };
}

function flattenTreeNode(node: LibreChatMessageTreeNode): LibreChatMessage[] {
  const ordered: LibreChatMessage[] = [node];
  let child = node.children?.[0];

  while (child) {
    ordered.push(child);
    child = child.children?.[0];
  }

  return ordered;
}

export function flattenMessagesTree(
  nodes: LibreChatMessageTreeNode[],
): SelectLineageResult {
  const orderedMessages = nodes.flatMap((node) => flattenTreeNode(node)).filter(isImportableMessage);
  const totalNodes = nodes.reduce((count, node) => count + countTreeNodes(node), 0);

  return {
    orderedMessages,
    hadFork: totalNodes > orderedMessages.length,
  };
}

/** Iterative so a deeply nested `messagesTree` cannot overflow the stack. */
function countTreeNodes(node: LibreChatMessageTreeNode): number {
  let count = 0;
  const stack: LibreChatMessageTreeNode[] = [node];

  while (stack.length > 0) {
    const current = stack.pop()!;
    count += 1;
    for (const child of current.children ?? []) {
      stack.push(child);
    }
  }

  return count;
}

export function resolveOrderedMessages(
  conversation: {
    messages?: LibreChatMessage[];
    messagesTree?: LibreChatMessageTreeNode[];
  },
): SelectLineageResult {
  if (conversation.messagesTree?.length) {
    return flattenMessagesTree(conversation.messagesTree);
  }

  if (conversation.messages?.length) {
    return selectActiveLineage(conversation.messages);
  }

  return { orderedMessages: [], hadFork: false };
}
