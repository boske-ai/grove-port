import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { zipSync } from 'fflate';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { convertAnythingLlmExport, previewAnythingLlmExport } from './convert.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('@grove-port/adapter-anythingllm', () => {
  test('previewAnythingLlmExport counts conversations and messages from JSON', async () => {
    const preview = await previewAnythingLlmExport({
      inputPath: path.join(fixturesDir, 'anythingllm-export.json'),
      userEmail: 'admin@example.com',
    });

    expect(preview.conversationCount).toBe(2);
    expect(preview.messageCount).toBe(4);
    expect(preview.sourceFormat).toBe('anythingllm-export-v1');
  });

  test('previewAnythingLlmExport handles JSONL export', async () => {
    const preview = await previewAnythingLlmExport({
      inputPath: path.join(fixturesDir, 'anythingllm-export.jsonl'),
      userEmail: 'admin@example.com',
    });

    expect(preview.conversationCount).toBe(1);
    expect(preview.messageCount).toBe(2);
  });

  test('previewAnythingLlmExport handles JSON inside ZIP', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-anythingllm-zip-'));
    const zipPath = path.join(workDir, 'anythingllm-export.zip');

    try {
      const json = readFileSync(path.join(fixturesDir, 'anythingllm-export.json'));
      await writeFile(
        zipPath,
        zipSync({
          'anythingllm/chats.json': new Uint8Array(json),
        }),
      );

      const preview = await previewAnythingLlmExport({
        inputPath: zipPath,
        userEmail: 'admin@example.com',
      });

      expect(preview.conversationCount).toBe(2);
      expect(preview.messageCount).toBe(4);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  test('convertAnythingLlmExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-anythingllm-test-'));
    const outputPath = path.join(workDir, 'out.grove-port');

    try {
      const result = await convertAnythingLlmExport({
        inputPath: path.join(fixturesDir, 'anythingllm-export.json'),
        outputPath,
        userEmail: 'admin@example.com',
      });

      expect(result.conversationCount).toBe(2);
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
