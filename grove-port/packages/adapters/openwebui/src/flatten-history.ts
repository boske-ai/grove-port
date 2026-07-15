import type { OpenWebUiHistory, OpenWebUiMessage } from './types.js';

export interface FlattenHistoryResult {
  orderedMessageIds: string[];
  hadFork: boolean;
}

function isImportableMessage(message: OpenWebUiMessage | undefined): message is OpenWebUiMessage {
  if (!message) {
    return false;
  }
  return (
    (message.role === 'user' || message.role === 'assistant') && Boolean(message.content?.trim())
  );
}

function maxTimestampInSubtree(
  messageId: string,
  messages: Record<string, OpenWebUiMessage>,
): number {
  const message = messages[messageId];
  if (!message) {
    return 0;
  }

  let max = message.timestamp ?? 0;
  for (const childId of message.childrenIds ?? []) {
    max = Math.max(max, maxTimestampInSubtree(childId, messages));
  }
  return max;
}

function findRootMessageIds(messages: Record<string, OpenWebUiMessage>): string[] {
  return Object.values(messages)
    .filter((message) => message.parentId === null)
    .map((message) => message.id);
}

/**
 * Walk from history.currentId toward root, then reverse for chronological order.
 * When siblings exist, follow the branch with the latest activity (same rule as ChatGPT adapter).
 */
export function flattenOpenWebUiHistory(history: OpenWebUiHistory): FlattenHistoryResult {
  const { messages, currentId } = history;
  if (!currentId || !messages[currentId]) {
    const roots = findRootMessageIds(messages);
    if (roots.length === 0) {
      return { orderedMessageIds: [], hadFork: false };
    }
  }

  const lineageIds: string[] = [];
  let hadFork = false;
  let cursor: string | null = currentId;

  while (cursor) {
    lineageIds.unshift(cursor);
    const message: OpenWebUiMessage | undefined = messages[cursor];
    if (!message) {
      break;
    }

    const parentId: string | null = message.parentId;
    if (!parentId) {
      break;
    }

    const parent: OpenWebUiMessage | undefined = messages[parentId];
    const siblings: string[] = parent?.childrenIds ?? [];
    if (siblings.length > 1) {
      hadFork = true;
    }

    cursor = parentId;
  }

  if (lineageIds.length === 0) {
    const roots = findRootMessageIds(messages);
    if (roots.length === 0) {
      return { orderedMessageIds: [], hadFork: false };
    }

    let currentRoot = roots[0]!;
    if (roots.length > 1) {
      hadFork = true;
      currentRoot = roots.reduce((bestId, candidateId) => {
        const bestScore = maxTimestampInSubtree(bestId, messages);
        const candidateScore = maxTimestampInSubtree(candidateId, messages);
        return candidateScore > bestScore ? candidateId : bestId;
      }, roots[0]!);
    }

    const orderedMessageIds: string[] = [];
    let walkId: string | null = currentRoot;
    while (walkId) {
      orderedMessageIds.push(walkId);
      const node: OpenWebUiMessage | undefined = messages[walkId];
      const children: string[] = node?.childrenIds ?? [];
      if (children.length === 0) {
        break;
      }
      if (children.length > 1) {
        hadFork = true;
      }
      walkId = children.reduce((bestId: string, childId: string) => {
        const bestScore = maxTimestampInSubtree(bestId, messages);
        const childScore = maxTimestampInSubtree(childId, messages);
        return childScore > bestScore ? childId : bestId;
      }, children[0]!);
    }

    return {
      orderedMessageIds: orderedMessageIds.filter((id) => isImportableMessage(messages[id])),
      hadFork,
    };
  }

  return {
    orderedMessageIds: lineageIds.filter((id) => isImportableMessage(messages[id])),
    hadFork,
  };
}

export function resolveSender(role: string, model: string | undefined): string {
  if (role === 'user') {
    return 'user';
  }
  return model?.trim() || 'assistant';
}

export function resolveModel(models: string[] | undefined, messageModel: string | undefined): string {
  return messageModel?.trim() || models?.[0]?.trim() || 'custom';
}

export function toIsoTimestamp(unixSeconds: number | undefined, fallbackIso: string): string {
  if (unixSeconds === undefined) {
    return fallbackIso;
  }
  return new Date(unixSeconds * 1000).toISOString();
}
