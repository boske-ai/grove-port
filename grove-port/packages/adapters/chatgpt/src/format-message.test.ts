import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { formatMessageText, processAssistantMessage } from './format-message.js';
import type { ChatGptMessage } from './types.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('formatMessageText', () => {
  test('formats tether_browsing_display from result field', () => {
    const message: ChatGptMessage = {
      id: 'tool-1',
      author: { role: 'tool', name: 'browser', metadata: {} },
      create_time: 1,
      update_time: null,
      content: {
        content_type: 'tether_browsing_display',
        result: '# Search results\nExample line',
      },
    };

    expect(formatMessageText(message)).toBe('# Search results\nExample line');
  });

  test('processAssistantMessage replaces webpage citations like Boske', async () => {
    const jsonData = JSON.parse(
      await readFile(path.join(fixturesDir, 'chatgpt-citations.json'), 'utf8'),
    ) as Array<{ mapping: Record<string, { message?: ChatGptMessage }> }>;

    // Look the node up by role rather than by a hardcoded id, so regenerating
    // the fixture does not silently break this test.
    const assistantMessage = Object.values(jsonData[0]!.mapping)
      .map((node) => node.message)
      .find((message) => message?.author.role === 'assistant' && message.metadata?.citations)!;
    const messageText = assistantMessage.content.parts?.[0] as string;

    const result = processAssistantMessage(assistantMessage, messageText);

    expect(result).toContain(
      '([Example Corp — Widget Benchmarks](https://example.com/widgets))',
    );
    expect(result).toContain('([Example Labs — Latency Report](https://example.com/latency))');
    // Citation markers are replaced, not left behind.
    expect(result).not.toContain('[cite-1]');
    expect(result).not.toContain('[cite-2]');
  });
});
