/** Regression: cyclic `parentId` / `childrenIds` must terminate, not OOM. */
import { describe, expect, test } from 'bun:test';
import { flattenOpenWebUiHistory } from './flatten-history.js';
import type { OpenWebUiHistory, OpenWebUiMessage } from './types.js';

function message(
  id: string,
  parentId: string | null,
  childrenIds: string[],
  index: number,
): OpenWebUiMessage {
  return {
    id,
    parentId,
    childrenIds,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `message ${index}`,
    timestamp: index,
  } as OpenWebUiMessage;
}

function history(messages: OpenWebUiMessage[], currentId: string): OpenWebUiHistory {
  const byId: Record<string, OpenWebUiMessage> = {};
  for (const item of messages) {
    byId[item.id] = item;
  }
  return { messages: byId, currentId } as OpenWebUiHistory;
}

describe('flattenOpenWebUiHistory on hostile graphs', () => {
  test('terminates on a two-node parent cycle', () => {
    const result = flattenOpenWebUiHistory(
      history([message('a', 'b', ['b'], 0), message('b', 'a', ['a'], 1)], 'a'),
    );

    expect(new Set(result.orderedMessageIds).size).toBe(result.orderedMessageIds.length);
  });

  test('terminates on a self-parenting message', () => {
    const result = flattenOpenWebUiHistory(history([message('a', 'a', ['a'], 0)], 'a'));
    expect(result.orderedMessageIds).toEqual(['a']);
  });

  test('terminates on a children cycle reached through the root fallback', () => {
    // No usable currentId -> root-walk branch, which follows childrenIds.
    const result = flattenOpenWebUiHistory(
      history(
        [message('root', null, ['a'], 0), message('a', 'root', ['root'], 1)],
        'missing-id',
      ),
    );

    expect(new Set(result.orderedMessageIds).size).toBe(result.orderedMessageIds.length);
  });

  test('still walks a clean lineage to the root', () => {
    const result = flattenOpenWebUiHistory(
      history(
        [
          message('a', null, ['b'], 0),
          message('b', 'a', ['c'], 1),
          message('c', 'b', [], 2),
        ],
        'c',
      ),
    );

    expect(result.orderedMessageIds).toEqual(['a', 'b', 'c']);
  });
});
