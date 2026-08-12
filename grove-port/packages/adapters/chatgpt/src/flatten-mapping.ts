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

/**
 * Latest activity time within each node's subtree, for every node, in one pass.
 *
 * Iterative on purpose: the previous recursive version was re-walked once per
 * sibling comparison (O(n²) — ~500ms for a 4k-message thread) and blew the stack
 * on long chains or on a cyclic `parent`/`children` graph, which a crafted or
 * corrupt export can trivially contain. A cycle edge contributes 0 rather than
 * recursing forever.
 */
function computeSubtreeMaxTimes(
  mapping: ChatGptMapping,
  childrenIndex: Map<string, string[]>,
): Map<string, number> {
  const maxima = new Map<string, number>();
  const settled = new Set<string>();
  const expanding = new Set<string>();

  for (const rootId of Object.keys(mapping)) {
    if (settled.has(rootId)) {
      continue;
    }

    const stack: string[] = [rootId];
    while (stack.length > 0) {
      const nodeId = stack[stack.length - 1]!;
      const node = mapping[nodeId];

      if (!node || settled.has(nodeId)) {
        stack.pop();
        expanding.delete(nodeId);
        continue;
      }

      if (!expanding.has(nodeId)) {
        expanding.add(nodeId);
        for (const childId of getNodeChildren(nodeId, node, childrenIndex)) {
          // Skip settled children and back-edges into the current path (cycles).
          if (!settled.has(childId) && !expanding.has(childId)) {
            stack.push(childId);
          }
        }
        continue;
      }

      let max = node.message?.create_time ?? 0;
      for (const childId of getNodeChildren(nodeId, node, childrenIndex)) {
        max = Math.max(max, maxima.get(childId) ?? 0);
      }

      maxima.set(nodeId, max);
      settled.add(nodeId);
      expanding.delete(nodeId);
      stack.pop();
    }
  }

  return maxima;
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
  const subtreeMaxTimes = computeSubtreeMaxTimes(mapping, childrenIndex);
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
      const bestScore = subtreeMaxTimes.get(bestId) ?? 0;
      const childScore = subtreeMaxTimes.get(childId) ?? 0;
      return childScore > bestScore ? childId : bestId;
    }, children[0]!);

    currentId = nextId;
  }

  return { orderedNodeIds, hadFork };
}
