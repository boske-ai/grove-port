import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { convertLobeChatExport, previewLobeChatExport } from './convert.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('@grove-port/adapter-lobechat', () => {
  test('previewLobeChatExport counts conversations and messages', async () => {
    const preview = await previewLobeChatExport({
      inputPath: path.join(fixturesDir, 'lobechat-export.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(1);
    expect(preview.messageCount).toBe(2);
    expect(preview.sourceFormat).toBe('lobechat-export-v1');
  });

  test('convertLobeChatExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-lobechat-test-'));
    const outputPath = path.join(workDir, 'out.grove-port');

    try {
      const result = await convertLobeChatExport({
        inputPath: path.join(fixturesDir, 'lobechat-export.json'),
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
