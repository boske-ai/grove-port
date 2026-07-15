import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { convertLibreChatExport, previewLibreChatExport } from './convert.js';
import { selectActiveLineage } from './select-lineage.js';
import type { LibreChatMessage } from './types.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('@grove-port/adapter-librechat', () => {
  test('selectActiveLineage follows parent pointers', () => {
    const messages: LibreChatMessage[] = [
      {
        messageId: '1',
        parentMessageId: null,
        text: 'hello',
        isCreatedByUser: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        messageId: '2',
        parentMessageId: '1',
        text: 'world',
        isCreatedByUser: false,
        createdAt: '2026-01-01T00:01:00.000Z',
      },
      {
        messageId: '3',
        parentMessageId: '1',
        text: 'fork',
        isCreatedByUser: false,
        createdAt: '2026-01-01T00:02:00.000Z',
      },
    ];

    const { orderedMessages, hadFork } = selectActiveLineage(messages);
    expect(orderedMessages.map((message) => message.messageId)).toEqual(['1', '3']);
    expect(hadFork).toBe(true);
  });

  test('previewLibreChatExport counts conversations and messages', async () => {
    const preview = await previewLibreChatExport({
      inputPath: path.join(fixturesDir, 'librechat-export.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(1);
    expect(preview.messageCount).toBe(2);
    expect(preview.sourceFormat).toBe('librechat-export-v1');
  });

  test('convertLibreChatExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-librechat-test-'));
    const outputPath = path.join(workDir, 'out.grove-port');

    try {
      const result = await convertLibreChatExport({
        inputPath: path.join(fixturesDir, 'librechat-export.json'),
        outputPath,
        userEmail: 'traveler@example.com',
      });

      expect(result.conversationCount).toBe(1);
      const unpacked = await unpackAndVerifyEnvelope({
        tarballPath: outputPath,
        extractDir: path.join(workDir, 'extract'),
      });
      expect(unpacked.data.messages.length).toBe(result.messageCount);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
