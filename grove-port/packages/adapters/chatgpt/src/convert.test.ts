import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { inspectEnvelope, unpackAndVerifyEnvelope } from '@grove-port/core';
import { SOURCE_FORMAT } from './types.js';
import {
  convertChatGptExport,
  flattenConversationMapping,
  previewChatGptExport,
} from './convert.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

describe('@grove-port/adapter-chatgpt', () => {
  test('flattenConversationMapping detects fork branches', async () => {
    const raw = JSON.parse(
      await readFile(path.join(fixturesDir, 'chatgpt-tree.json'), 'utf8'),
    ) as Array<{ mapping: Record<string, unknown> }>;

    const { orderedNodeIds, hadFork } = flattenConversationMapping(
      raw[0]!.mapping as Parameters<typeof flattenConversationMapping>[0],
    );

    expect(hadFork).toBe(true);
    expect(orderedNodeIds.length).toBeGreaterThan(0);
  });

  test('matches Boske importable message count for chatgpt-export.json', async () => {
    const preview = await previewChatGptExport({
      inputPath: path.join(fixturesDir, 'chatgpt-export.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(2);
    expect(preview.messageCount).toBe(19);
    expect(preview.forkedConversations).toBe(0);
  });

  test('flattens fork branches for chatgpt-tree.json (6 messages, not 11)', async () => {
    const preview = await previewChatGptExport({
      inputPath: path.join(fixturesDir, 'chatgpt-tree.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(1);
    expect(preview.messageCount).toBe(6);
    expect(preview.forkedConversations).toBe(1);
  });

  test('handles 2026 parent-only mapping graphs', async () => {
    const preview = await previewChatGptExport({
      inputPath: path.join(fixturesDir, 'chatgpt-2026-parent-only.json'),
      userEmail: 'traveler@example.com',
    });

    expect(preview.conversationCount).toBe(1);
    expect(preview.messageCount).toBe(2);
  });

  test('convertChatGptExport produces a verifiable grove-port package', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-chatgpt-test-'));
    const outputPath = path.join(workDir, 'out.grove-port');

    try {
      const result = await convertChatGptExport({
        inputPath: path.join(fixturesDir, 'chatgpt-tree.json'),
        outputPath,
        userEmail: 'traveler@example.com',
        label: 'ChatGPT test import',
      });

      expect(result.conversationCount).toBe(1);
      expect(result.messageCount).toBe(6);
      expect(result.forkedConversations).toBe(1);
      expect(result.manifest.source.adapter).toBe('grove-port-adapter-chatgpt');
      expect(result.manifest.source.source_format).toBe(SOURCE_FORMAT);

      const extractDir = path.join(workDir, 'extract');
      const unpacked = await unpackAndVerifyEnvelope({ tarballPath: outputPath, extractDir });
      expect(unpacked.data.messages.length).toBe(result.messageCount);

      const summary = await inspectEnvelope(outputPath);
      expect(summary.actual_counts.messages).toBe(result.messageCount);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  test('processes citations fixture end-to-end', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-chatgpt-citations-'));
    const outputPath = path.join(workDir, 'out.grove-port');

    try {
      const result = await convertChatGptExport({
        inputPath: path.join(fixturesDir, 'chatgpt-citations.json'),
        outputPath,
        userEmail: 'traveler@example.com',
      });

      expect(result.messageCount).toBe(2);
      const unpacked = await unpackAndVerifyEnvelope({
        tarballPath: outputPath,
        extractDir: path.join(workDir, 'extract'),
      });
      const assistant = unpacked.data.messages.find(
        (message) => (message as { role?: string }).role === 'assistant',
      ) as { text?: string } | undefined;

      expect(assistant?.text).toContain('([Signal Sciences - Crunchbase Company Profile & Funding]');
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
