import { describe, expect, test } from 'bun:test';
import { flattenConversationMapping } from './flatten-mapping.js';

describe('flattenConversationMapping without children arrays', () => {
  test('derives child links from parent and detects forks', () => {
    const mapping = {
      root: { id: 'root', message: null, parent: null },
      a: {
        id: 'a',
        parent: 'root',
        message: {
          id: 'a',
          author: { role: 'user', name: null, metadata: {} },
          create_time: 1,
          update_time: null,
          content: { content_type: 'text', parts: ['hello'] },
        },
      },
      b: {
        id: 'b',
        parent: 'a',
        message: {
          id: 'b',
          author: { role: 'assistant', name: null, metadata: {} },
          create_time: 2,
          update_time: null,
          content: { content_type: 'text', parts: ['branch b'] },
        },
      },
      c: {
        id: 'c',
        parent: 'a',
        message: {
          id: 'c',
          author: { role: 'assistant', name: null, metadata: {} },
          create_time: 3,
          update_time: null,
          content: { content_type: 'text', parts: ['branch c'] },
        },
      },
    };

    const { orderedNodeIds, hadFork } = flattenConversationMapping(mapping);
    expect(hadFork).toBe(true);
    expect(orderedNodeIds).toEqual(['a', 'c']);
  });
});
