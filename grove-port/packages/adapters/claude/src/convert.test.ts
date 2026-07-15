import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { SOURCE_FORMAT } from './types.js';
import {
  convertClaudeExport,
  previewClaudeExport,
  selectActiveLineage,
} from './convert.js';
import { formatMessageText } from './format-message.js';
import type { ClaudeMessage } from './types.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('@grove-port/adapter-claude', () => {
  test('formatMessageText prefers text field and skips thinking blocks', () => {
    const message: ClaudeMessage = {
      uuid: 'm1',
      sender: 'assistant',
      created_at: '2025-01-15T10:30:05.000000Z',
      content: [
        { type: 'thinking', thinking: 'secret' },
        { type: 'text', text: 'Visible answer' },
      ],
    };

    expect(formatMessageText(message)).toBe('Visible answer');
  });

  test('selectActiveLineage follows current_leaf_message_uuid', () => {
    const messages: ClaudeMessage[] = [
      {
        uuid: 'user-1',
        sender: 'human',
        created_at: '2025-02-01T09:00:00.000000Z',
        text: 'Question',
        parent_message_uuid: null,
      },
      {
        uuid: 'assistant-a',
        sender: 'assistant',
        created_at: '2025-02-01T09:01:00.000000Z',
        text: 'First answer',
        parent_message_uuid: 'user-1',
      },
      {
        uuid: 'assistant-b',
        sender: 'assistant',
        created_at: '2025-02-01T09:02:00.000000Z',
        text: 'Regenerated answer',
        parent_message_uuid: 'user-1',
      },
    ];

    const { orderedMessages, hadFork } = selectActiveLineage(messages, 'assistant-b');

    expect(hadFork).toBe(true);
    expect(orderedMessages.map((message) => message.uuid)).toEqual([
      'user-1',
      'assistant-b',
    ]);
  });

  test('previewClaudeExport counts conversations and messages', async () => {
    const preview = await previewClaudeExport({
      inputPath: path.join(fixturesDir, 'claude-export.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(2);
    expect(preview.messageCount).toBe(4);
    expect(preview.forkedConversations).toBe(1);
    expect(preview.sourceFormat).toBe(SOURCE_FORMAT);
  });

  test('convertClaudeExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-claude-test-'));
    const outputPath = path.join(workDir, 'out.grove-port');

    try {
      const result = await convertClaudeExport({
        inputPath: path.join(fixturesDir, 'claude-export.json'),
        outputPath,
        userEmail: 'traveler@example.com',
      });

      expect(result.messageCount).toBe(4);
      const unpacked = await unpackAndVerifyEnvelope({
        tarballPath: outputPath,
        extractDir: path.join(workDir, 'extract'),
      });
      expect(unpacked.data.messages.length).toBe(4);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
