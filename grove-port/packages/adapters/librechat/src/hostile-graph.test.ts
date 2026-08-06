/** Regression: a cyclic `parentMessageId` chain must terminate, not OOM. */
import { describe, expect, test } from 'bun:test';
import { flattenMessagesTree, selectActiveLineage } from './select-lineage.js';
import type { LibreChatMessage, LibreChatMessageTreeNode } from './types.js';

function message(messageId: string, parentMessageId: string | null, index: number): LibreChatMessage {
  return {
    messageId,
    parentMessageId,
    text: `message ${index}`,
    isCreatedByUser: index % 2 === 0,
    createdAt: new Date(2026, 0, 1, 0, 0, index).toISOString(),
  } as LibreChatMessage;
}

describe('selectActiveLineage on hostile graphs', () => {
  test('terminates on a two-node parent cycle', () => {
    const result = selectActiveLineage([message('a', 'b', 0), message('b', 'a', 1)]);

    const ids = result.orderedMessages.map((item) => item.messageId);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('terminates on a self-parenting message', () => {
    const result = selectActiveLineage([message('a', 'a', 0)]);
    expect(result.orderedMessages.map((item) => item.messageId)).toEqual(['a']);
  });

  test('still walks a clean lineage to the root', () => {
    const result = selectActiveLineage([
      message('a', null, 0),
      message('b', 'a', 1),
      message('c', 'b', 2),
    ]);

    expect(result.orderedMessages.map((item) => item.messageId)).toEqual(['a', 'b', 'c']);
  });
});

describe('flattenMessagesTree on deep trees', () => {
  test('counts a tree deeper than the call stack without overflowing', () => {
    let node: LibreChatMessageTreeNode = {
      ...message('leaf', null, 0),
      children: [],
    } as unknown as LibreChatMessageTreeNode;

    for (let depth = 0; depth < 50_000; depth += 1) {
      node = {
        ...message(`n${depth}`, null, depth),
        children: [node],
      } as unknown as LibreChatMessageTreeNode;
    }

    expect(() => flattenMessagesTree([node])).not.toThrow();
  });
});
