import type { DeepSeekFragment, DeepSeekMapping, DeepSeekMappingNode } from './types.js';

export interface FlattenResult {
  orderedNodeIds: string[];
  hadFork: boolean;
}

function buildChildrenIndex(mapping: DeepSeekMapping): Map<string, string[]> {
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
  node: DeepSeekMappingNode,
  childrenIndex: Map<string, string[]>,
): string[] {
  if (Array.isArray(node.children) && node.children.length > 0) {
    return node.children;
  }

  return childrenIndex.get(nodeId) ?? [];
}

function fragmentTime(node: DeepSeekMappingNode): number {
  const fragment = node.fragment;
  if (!fragment) {
    return 0;
  }

  if (typeof fragment.create_time === 'number') {
    return fragment.create_time;
  }

  if (typeof fragment.timestamp === 'number') {
    return fragment.timestamp;
  }

  if (typeof fragment.timestamp === 'string') {
    const parsed = new Date(fragment.timestamp).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

/**
 * Latest activity time within each node's subtree, for every node, in one pass.
 *
 * Iterative on purpose — see the ChatGPT adapter for the same rationale: the
 * recursive version was O(n²) across sibling comparisons and overflowed the
 * stack on long chains or a cyclic fragment graph.
 */
function computeSubtreeMaxTimes(
  mapping: DeepSeekMapping,
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
          if (!settled.has(childId) && !expanding.has(childId)) {
            stack.push(childId);
          }
        }
        continue;
      }

      let max = fragmentTime(node);
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

function findRootNode(mapping: DeepSeekMapping): DeepSeekMappingNode | undefined {
  return Object.values(mapping).find((node) => node.parent === null);
}

export function isImportableFragment(fragment: DeepSeekFragment | undefined): boolean {
  if (!fragment) {
    return false;
  }

  if (fragment.type === 'THINK' || fragment.type === 'SEARCH') {
    return false;
  }

  return Boolean(fragment.content?.trim());
}

export function formatFragmentText(fragment: DeepSeekFragment): string {
  return fragment.content?.trim() ?? '';
}

export function fragmentRole(fragment: DeepSeekFragment): 'user' | 'assistant' {
  return fragment.type === 'REQUEST' ? 'user' : 'assistant';
}

export function toIsoTimestampFromFragment(
  fragment: DeepSeekFragment | undefined,
  fallback: string,
): string {
  if (!fragment) {
    return fallback;
  }

  if (typeof fragment.create_time === 'number') {
    return new Date(fragment.create_time * 1000).toISOString();
  }

  if (typeof fragment.timestamp === 'number') {
    const millis = fragment.timestamp > 1_000_000_000_000 ? fragment.timestamp : fragment.timestamp * 1000;
    return new Date(millis).toISOString();
  }

  if (typeof fragment.timestamp === 'string') {
    const parsed = new Date(fragment.timestamp);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback;
}

export function flattenDeepSeekMapping(mapping: DeepSeekMapping): FlattenResult {
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

    const node: DeepSeekMappingNode | undefined = mapping[currentId];
    if (!node) {
      break;
    }

    if (isImportableFragment(node.fragment)) {
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
