/** Regression: a cyclic DeepSeek fragment graph must terminate, not overflow. */
import { describe, expect, test } from 'bun:test';
import { flattenDeepSeekMapping } from './flatten-mapping.js';
import type { DeepSeekMapping } from './types.js';

function fragmentNode(id: string, parent: string | null, children: string[], time: number) {
  return {
    id,
    parent,
    children,
    fragment: {
      type: time % 2 === 0 ? 'REQUEST' : 'RESPONSE',
      content: `fragment ${time}`,
      create_time: time,
    },
  };
}

describe('flattenDeepSeekMapping on hostile graphs', () => {
  test('terminates on a cycle in children', () => {
    const mapping = {
      root: fragmentNode('root', null, ['a'], 0),
      a: fragmentNode('a', 'root', ['b'], 1),
      b: fragmentNode('b', 'a', ['a'], 2),
    } as unknown as DeepSeekMapping;

    const result = flattenDeepSeekMapping(mapping);
    expect(new Set(result.orderedNodeIds).size).toBe(result.orderedNodeIds.length);
  });

  test('handles a chain deeper than the call stack without overflowing', () => {
    const mapping: Record<string, unknown> = {};
    const size = 50_000;
    for (let index = 0; index < size; index += 1) {
      mapping[`n${index}`] = fragmentNode(
        `n${index}`,
        index === 0 ? null : `n${index - 1}`,
        index === size - 1 ? [] : [`n${index + 1}`],
        index,
      );
    }

    expect(flattenDeepSeekMapping(mapping as DeepSeekMapping).orderedNodeIds).toHaveLength(size);
  });
});
