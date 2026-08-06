/**
 * Regression tests for the Aug 2026 audit adapter findings.
 *
 * Vendor exports reference nodes by id, so `JSON.parse` reproduces cycles
 * happily — every lineage walk must terminate on a hostile or corrupt graph
 * rather than looping until the process runs out of memory or stack.
 */
import { describe, expect, test } from 'bun:test';
import { flattenConversationMapping } from './flatten-mapping.js';
import type { ChatGptMapping } from './types.js';

function textNode(id: string, parent: string | null, children: string[], time: number) {
  return {
    id,
    parent,
    children,
    message: {
      id: `m-${id}`,
      author: { role: 'user', name: null, metadata: {} },
      create_time: time,
      update_time: time,
      content: { content_type: 'text', parts: ['hi'] },
    },
  };
}

function linearMapping(size: number): ChatGptMapping {
  const mapping: Record<string, unknown> = {};
  for (let index = 0; index < size; index += 1) {
    mapping[`n${index}`] = textNode(
      `n${index}`,
      index === 0 ? null : `n${index - 1}`,
      index === size - 1 ? [] : [`n${index + 1}`],
      index,
    );
  }
  return mapping as ChatGptMapping;
}

describe('flattenConversationMapping on hostile graphs', () => {
  test('terminates on a cycle in children', () => {
    const mapping = {
      root: textNode('root', null, ['a'], 1),
      a: textNode('a', 'root', ['b'], 2),
      b: textNode('b', 'a', ['a'], 3), // a -> b -> a
    } as unknown as ChatGptMapping;

    const result = flattenConversationMapping(mapping);
    expect(result.orderedNodeIds.length).toBeGreaterThan(0);
    expect(new Set(result.orderedNodeIds).size).toBe(result.orderedNodeIds.length);
  });

  test('terminates on a self-referencing node', () => {
    const mapping = {
      root: textNode('root', null, ['root'], 1),
    } as unknown as ChatGptMapping;

    expect(flattenConversationMapping(mapping).orderedNodeIds).toEqual(['root']);
  });

  test('handles a chain deeper than the call stack without overflowing', () => {
    const result = flattenConversationMapping(linearMapping(50_000));
    expect(result.orderedNodeIds).toHaveLength(50_000);
  });

  test('scales linearly rather than quadratically', () => {
    // The recursive implementation was ~4x slower per doubling. Linear work
    // should stay far under a generous ceiling even on slow CI hardware.
    const started = performance.now();
    flattenConversationMapping(linearMapping(20_000));
    expect(performance.now() - started).toBeLessThan(2_000);
  });

  test('still follows the latest branch when siblings fork', () => {
    const mapping = {
      root: textNode('root', null, ['old', 'new'], 1),
      old: textNode('old', 'root', [], 2),
      new: textNode('new', 'root', [], 99),
    } as unknown as ChatGptMapping;

    const result = flattenConversationMapping(mapping);
    expect(result.hadFork).toBe(true);
    expect(result.orderedNodeIds).toEqual(['root', 'new']);
  });
});
