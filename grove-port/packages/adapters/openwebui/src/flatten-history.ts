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

/**
 * Latest timestamp within each message's subtree, for every message, in one pass.
 *
 * Iterative and cycle-safe: a crafted or corrupt `childrenIds` graph must not
 * recurse forever, and long threads must not overflow the stack.
 */
function computeSubtreeMaxTimestamps(
  messages: Record<string, OpenWebUiMessage>,
): Map<string, number> {
  const maxima = new Map<string, number>();
  const settled = new Set<string>();
  const expanding = new Set<string>();

  for (const rootId of Object.keys(messages)) {
    if (settled.has(rootId)) {
      continue;
    }

    const stack: string[] = [rootId];
    while (stack.length > 0) {
      const messageId = stack[stack.length - 1]!;
      const message = messages[messageId];

      if (!message || settled.has(messageId)) {
        stack.pop();
        expanding.delete(messageId);
        continue;
      }

      if (!expanding.has(messageId)) {
        expanding.add(messageId);
        for (const childId of message.childrenIds ?? []) {
          if (!settled.has(childId) && !expanding.has(childId)) {
            stack.push(childId);
          }
        }
        continue;
      }

      let max = message.timestamp ?? 0;
      for (const childId of message.childrenIds ?? []) {
        max = Math.max(max, maxima.get(childId) ?? 0);
      }

      maxima.set(messageId, max);
      settled.add(messageId);
      expanding.delete(messageId);
      stack.pop();
    }
  }

  return maxima;
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
  const seen = new Set<string>();
  let hadFork = false;
  let cursor: string | null = currentId;

  while (cursor) {
    // A cyclic `parentId` chain would otherwise loop forever, growing
    // `lineageIds` until the process dies of memory exhaustion.
    if (seen.has(cursor)) {
      break;
    }
    seen.add(cursor);

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

    const subtreeMaxTimestamps = computeSubtreeMaxTimestamps(messages);

    let currentRoot = roots[0]!;
    if (roots.length > 1) {
      hadFork = true;
      currentRoot = roots.reduce((bestId, candidateId) => {
        const bestScore = subtreeMaxTimestamps.get(bestId) ?? 0;
        const candidateScore = subtreeMaxTimestamps.get(candidateId) ?? 0;
        return candidateScore > bestScore ? candidateId : bestId;
      }, roots[0]!);
    }

    const orderedMessageIds: string[] = [];
    const walked = new Set<string>();
    let walkId: string | null = currentRoot;
    while (walkId) {
      // Cyclic `childrenIds` must terminate the walk, not spin forever.
      if (walked.has(walkId)) {
        break;
      }
      walked.add(walkId);

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
        const bestScore = subtreeMaxTimestamps.get(bestId) ?? 0;
        const childScore = subtreeMaxTimestamps.get(childId) ?? 0;
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
