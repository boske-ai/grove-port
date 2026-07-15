import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { zipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { convertDeepSeekExport, previewDeepSeekExport } from './convert.js';
import { flattenDeepSeekMapping } from './flatten-mapping.js';
import type { DeepSeekConversationExport } from './types.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('@grove-port/adapter-deepseek', () => {
  test('flattenDeepSeekMapping skips THINK and follows latest branch', () => {
    const raw = JSON.parse(
      readFileSync(path.join(fixturesDir, 'conversations.json'), 'utf8'),
    ) as DeepSeekConversationExport[];
    const { orderedNodeIds, hadFork } = flattenDeepSeekMapping(raw[0]!.mapping);

    expect(orderedNodeIds).toEqual(['req-1', 'resp-1', 'req-2', 'resp-2']);
    expect(hadFork).toBe(true);
  });

  test('previewDeepSeekExport counts conversations and messages from JSON', async () => {
    const preview = await previewDeepSeekExport({
      inputPath: path.join(fixturesDir, 'conversations.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(1);
    expect(preview.messageCount).toBe(4);
    expect(preview.forkedConversations).toBe(1);
    expect(preview.sourceFormat).toBe('deepseek-export-v1');
  });

  test('convertDeepSeekExport produces a verifiable grove-port package from ZIP', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-deepseek-test-'));
    const zipPath = path.join(workDir, 'deepseek-export.zip');
    const outputPath = path.join(workDir, 'out.grove-port');

    const conversationsBytes = readFileSync(path.join(fixturesDir, 'conversations.json'));
    const zipBytes = zipSync({
      'conversations.json': new Uint8Array(conversationsBytes),
    });
    await writeFile(zipPath, zipBytes);

    try {
      const result = await convertDeepSeekExport({
        inputPath: zipPath,
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
