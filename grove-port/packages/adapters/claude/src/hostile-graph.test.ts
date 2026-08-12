/** Regression: a cyclic `parent_message_uuid` chain must terminate, not OOM. */
import { describe, expect, test } from 'bun:test';
import { selectActiveLineage } from './select-lineage.js';
import type { ClaudeMessage } from './types.js';

function message(uuid: string, parent: string | null, index: number): ClaudeMessage {
  return {
    uuid,
    parent_message_uuid: parent,
    sender: index % 2 === 0 ? 'human' : 'assistant',
    text: `message ${index}`,
    created_at: new Date(2026, 0, 1, 0, 0, index).toISOString(),
  } as ClaudeMessage;
}

describe('selectActiveLineage on hostile graphs', () => {
  test('terminates on a two-node parent cycle', () => {
    const messages = [message('a', 'b', 0), message('b', 'a', 1)];

    const result = selectActiveLineage(messages, 'a');
    expect(result.orderedMessages.length).toBeGreaterThan(0);
    const uuids = result.orderedMessages.map((item) => item.uuid);
    expect(new Set(uuids).size).toBe(uuids.length);
  });

  test('terminates on a self-parenting message', () => {
    const result = selectActiveLineage([message('a', 'a', 0)], 'a');
    expect(result.orderedMessages.map((item) => item.uuid)).toEqual(['a']);
  });

  test('still walks a clean lineage to the root', () => {
    const messages = [message('a', null, 0), message('b', 'a', 1), message('c', 'b', 2)];

    const result = selectActiveLineage(messages, 'c');
    expect(result.orderedMessages.map((item) => item.uuid)).toEqual(['a', 'b', 'c']);
  });
});
