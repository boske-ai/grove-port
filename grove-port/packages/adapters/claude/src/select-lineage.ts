import type { ClaudeMessage } from './types.js';

function isImportableMessage(message: ClaudeMessage): boolean {
  if (message.sender !== 'human' && message.sender !== 'assistant') {
    return false;
  }

  if (message.text?.trim()) {
    return true;
  }

  return Boolean(message.content?.some((block) => block.type === 'text' && block.text?.trim()));
}

export interface SelectLineageResult {
  orderedMessages: ClaudeMessage[];
  hadFork: boolean;
}

/**
 * Walk from the active leaf to the root when parent pointers exist.
 * Falls back to chronological order for legacy exports without tree metadata.
 */
export function selectActiveLineage(
  messages: ClaudeMessage[],
  currentLeafUuid?: string | null,
): SelectLineageResult {
  if (messages.length === 0) {
    return { orderedMessages: [], hadFork: false };
  }

  const byUuid = new Map(messages.map((message) => [message.uuid, message]));
  const hasParentPointers = messages.some(
    (message) => message.parent_message_uuid !== undefined && message.parent_message_uuid !== null,
  );

  if (!hasParentPointers) {
    const orderedMessages = [...messages]
      .filter(isImportableMessage)
      .sort(
        (left, right) =>
          new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
      );
    return { orderedMessages, hadFork: false };
  }

  let leafId = currentLeafUuid ?? null;
  if (!leafId || !byUuid.has(leafId)) {
    const importable = messages.filter(isImportableMessage);
    leafId =
      importable.sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      )[0]?.uuid ?? null;
  }

  if (!leafId) {
    return { orderedMessages: [], hadFork: false };
  }

  const lineageIds = new Set<string>();
  const lineage: ClaudeMessage[] = [];
  let current: ClaudeMessage | undefined = byUuid.get(leafId);

  while (current) {
    lineage.unshift(current);
    lineageIds.add(current.uuid);
    const parentId = current.parent_message_uuid;
    current = parentId ? byUuid.get(parentId) : undefined;
  }

  const orderedMessages = lineage.filter(isImportableMessage);
  const hadFork = messages.some(
    (message) => isImportableMessage(message) && !lineageIds.has(message.uuid),
  );

  return { orderedMessages, hadFork };
}
