import type { ChatGptMapping, ChatGptMappingNode } from './types.js';

export interface FlattenResult {
  orderedNodeIds: string[];
  hadFork: boolean;
}

function buildChildrenIndex(mapping: ChatGptMapping): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const [nodeId, node] of Object.entries(mapping)) {
    const parentId = node.parent;
    if (!parentId) {
      continue;
    }

    const siblings = index.get(parentId) ?? [];
    siblings.push(nodeId);
    index.set(parentId, siblings);
  }

  return index;
}

function getNodeChildren(
  nodeId: string,
  node: ChatGptMappingNode,
  childrenIndex: Map<string, string[]>,
): string[] {
  if (Array.isArray(node.children) && node.children.length > 0) {
    return node.children;
  }

  return childrenIndex.get(nodeId) ?? [];
}

function maxTimeInSubtree(
  nodeId: string,
  mapping: ChatGptMapping,
  childrenIndex: Map<string, string[]>,
): number {
  const node = mapping[nodeId];
  if (!node) {
    return 0;
  }

  let max = node.message?.create_time ?? 0;
  for (const childId of getNodeChildren(nodeId, node, childrenIndex)) {
    max = Math.max(max, maxTimeInSubtree(childId, mapping, childrenIndex));
  }
  return max;
}

function findRootNode(mapping: ChatGptMapping): ChatGptMappingNode | undefined {
  return Object.values(mapping).find((node) => node.parent === null);
}

function isImportableNode(node: ChatGptMappingNode): boolean {
  const role = node.message?.author.role;
  return Boolean(
    node.message &&
      role !== 'system' &&
      node.message.content &&
      node.message.content.content_type,
  );
}

/**
 * Walk the ChatGPT DAG from root, following the branch with the latest activity
 * when siblings exist (regeneration / edit forks).
 *
 * Newer ChatGPT exports often omit `children`; we derive siblings from `parent`.
 */
export function flattenConversationMapping(mapping: ChatGptMapping): FlattenResult {
  const root = findRootNode(mapping);
  if (!root) {
    return { orderedNodeIds: [], hadFork: false };
  }

  const childrenIndex = buildChildrenIndex(mapping);
  const orderedNodeIds: string[] = [];
  let hadFork = false;
  let currentId: string | null = root.id;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);

    const node: ChatGptMappingNode | undefined = mapping[currentId];
    if (!node) {
      break;
    }

    if (isImportableNode(node)) {
      orderedNodeIds.push(currentId);
    }

    const children = getNodeChildren(currentId, node, childrenIndex);
    if (children.length === 0) {
      break;
    }

    if (children.length > 1) {
      hadFork = true;
    }

    const nextId: string = children.reduce((bestId: string, childId: string) => {
      const bestScore = maxTimeInSubtree(bestId, mapping, childrenIndex);
      const childScore = maxTimeInSubtree(childId, mapping, childrenIndex);
      return childScore > bestScore ? childId : bestId;
    }, children[0]!);

    currentId = nextId;
  }

  return { orderedNodeIds, hadFork };
}
