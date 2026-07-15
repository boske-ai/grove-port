import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { zipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { unpackAndVerifyEnvelope } from '@grove-port/core';
import { convertDoubaoExport, previewDoubaoExport } from './convert.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

function buildFixtureZip(): Uint8Array {
  return zipSync({
    'metadata.json': new Uint8Array(readFileSync(path.join(fixturesDir, 'metadata.json'))),
    'chat_2026-06-22/doubao-session-001.json': new Uint8Array(
      readFileSync(path.join(fixturesDir, 'chat_2026-06-22/doubao-session-001.json')),
    ),
  });
}

describe('@grove-port/adapter-doubao', () => {
  test('previewDoubaoExport counts conversations and messages', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-doubao-preview-'));
    const zipPath = path.join(workDir, 'doubao-export.zip');
    await writeFile(zipPath, buildFixtureZip());

    try {
      const preview = await previewDoubaoExport({
        inputPath: zipPath,
        userEmail: 'traveler@example.com',
      });

      expect(preview.conversationCount).toBe(1);
      expect(preview.messageCount).toBe(2);
      expect(preview.sourceFormat).toBe('doubao-export-v1');
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  test('convertDoubaoExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-doubao-test-'));
    const zipPath = path.join(workDir, 'doubao-export.zip');
    const outputPath = path.join(workDir, 'out.grove-port');
    await writeFile(zipPath, buildFixtureZip());

    try {
      const result = await convertDoubaoExport({
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
