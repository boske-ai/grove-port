import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { convertOpenWebUiExport, previewOpenWebUiExport } from './convert.js';
import { flattenOpenWebUiHistory } from './flatten-history.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('@grove-port/adapter-openwebui', () => {
  test('flattenOpenWebUiHistory follows currentId branch', () => {
    const { orderedMessageIds, hadFork } = flattenOpenWebUiHistory({
      currentId: 'assistant-b',
      messages: {
        'user-1': {
          id: 'user-1',
          parentId: null,
          childrenIds: ['assistant-a', 'assistant-b'],
          role: 'user',
          content: 'Question',
        },
        'assistant-a': {
          id: 'assistant-a',
          parentId: 'user-1',
          childrenIds: [],
          role: 'assistant',
          content: 'First answer',
        },
        'assistant-b': {
          id: 'assistant-b',
          parentId: 'user-1',
          childrenIds: [],
          role: 'assistant',
          content: 'Regenerated answer',
        },
      },
    });

    expect(hadFork).toBe(true);
    expect(orderedMessageIds).toEqual(['user-1', 'assistant-b']);
  });

  test('previewOpenWebUiExport counts conversations and messages', async () => {
    const preview = await previewOpenWebUiExport({
      inputPath: path.join(fixturesDir, 'openwebui-export.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(2);
    expect(preview.messageCount).toBe(4);
    expect(preview.forkedConversations).toBe(1);
  });

  test('convertOpenWebUiExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-openwebui-test-'));
    const outputPath = path.join(workDir, 'out.grove-port');

    try {
      const result = await convertOpenWebUiExport({
        inputPath: path.join(fixturesDir, 'openwebui-export.json'),
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
