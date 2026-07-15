import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { zipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { convertGeminiExport, previewGeminiExport } from './convert.js';
import { GEMS_ONLY_EXPORT_MESSAGE } from './types.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

function buildActivityZip(): Uint8Array {
  return zipSync({
    'Takeout/My Activity/Gemini Apps/MyActivity.json': new Uint8Array(
      readFileSync(path.join(fixturesDir, 'MyActivity.json')),
    ),
  });
}

function buildConversationsZip(): Uint8Array {
  return zipSync({
    'Google Products/Gemini/conversations.json': new Uint8Array(
      readFileSync(path.join(fixturesDir, 'conversations.json')),
    ),
  });
}

describe('@grove-port/adapter-gemini', () => {
  test('previewGeminiExport counts conversations and messages from activity log ZIP', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-gemini-preview-'));
    const zipPath = path.join(workDir, 'gemini-activity.zip');
    await writeFile(zipPath, buildActivityZip());

    try {
      const preview = await previewGeminiExport({
        inputPath: zipPath,
        userEmail: 'traveler@example.com',
      });

      expect(preview.conversationCount).toBe(1);
      expect(preview.messageCount).toBe(4);
      expect(preview.sourceFormat).toBe('gemini-takeout-v1');
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  test('previewGeminiExport skips non-Gemini MyActivity.json when Search appears first', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-gemini-mixed-'));
    const zipPath = path.join(workDir, 'mixed-takeout.zip');
    await writeFile(
      zipPath,
      zipSync({
        'Takeout/My Activity/Search/MyActivity.json': new TextEncoder().encode(
          JSON.stringify([{ header: 'Search', title: 'cats', time: '2026-06-21T09:00:00.000Z' }]),
        ),
        'Takeout/My Activity/Gemini Apps/MyActivity.json': new Uint8Array(
          readFileSync(path.join(fixturesDir, 'MyActivity.json')),
        ),
      }),
    );

    try {
      const preview = await previewGeminiExport({
        inputPath: zipPath,
        userEmail: 'traveler@example.com',
      });

      expect(preview.conversationCount).toBe(1);
      expect(preview.messageCount).toBe(4);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  test('previewGeminiExport handles conversations.json layout', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-gemini-conversations-'));
    const zipPath = path.join(workDir, 'gemini-conversations.zip');
    await writeFile(zipPath, buildConversationsZip());

    try {
      const preview = await previewGeminiExport({
        inputPath: zipPath,
        userEmail: 'traveler@example.com',
      });

      expect(preview.conversationCount).toBe(1);
      expect(preview.messageCount).toBe(2);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  test('convertGeminiExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-gemini-test-'));
    const zipPath = path.join(workDir, 'gemini-activity.zip');
    const outputPath = path.join(workDir, 'out.grove-port');
    await writeFile(zipPath, buildActivityZip());

    try {
      const result = await convertGeminiExport({
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

  test('rejects Gems-only Takeout export', async () => {
    const zipBytes = zipSync({
      'Takeout/Gemini/gems-config.json': new TextEncoder().encode('{"gems":[]}'),
    });

    await expect(
      previewGeminiExport({
        fileName: 'gems-only.zip',
        bytes: zipBytes,
      }),
    ).rejects.toThrow(GEMS_ONLY_EXPORT_MESSAGE);
  });
});
