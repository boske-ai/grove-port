import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BOSKE_EXPORT_ENVELOPE_ROOT, type ExportDataV1 } from '@grove-port/schema';
import { packEnvelope, unpackAndVerifyEnvelope } from '@grove-port/core';

/**
 * Contract test: Grove Port verify/unpack accepts envelopes produced with
 * Boske's wire root name (`boske-export-v1/`) and the same manifest signing rules.
 */
describe('Boske export wire compatibility', () => {
  test('verify accepts a boske-export-v1 tarball built with grove-port core', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-boske-compat-'));
    const outputPath = path.join(workDir, 'boske-export-fixture.tar.gz');

    try {
      const data: ExportDataV1 = {
        user: { id: 'user_alice', email: 'alice@example.com' },
        conversations: [{ _id: 'c1', title: 'first chat', user: 'user_alice' }],
        messages: [
          { _id: 'm1', text: 'hi', conversationId: 'c1', user: 'user_alice' },
          { _id: 'm2', text: 'there', conversationId: 'c1', user: 'user_alice' },
        ],
        files: [],
        presets: [],
        agents: [],
        memories: [],
        tool_calls: [],
        transcript_sessions: [],
        workspace_items: [],
        shares: [],
        attachments: [],
      };

      await packEnvelope({
        outputPath,
        envelopeRoot: BOSKE_EXPORT_ENVELOPE_ROOT,
        manifest: {
          version: 'v1',
          created_at: '2026-06-18T12:00:00.000Z',
          source: {
            app_version: '0.7.903',
            deployment: 'electron-local',
            tier: 'local',
            instance_id: '11111111-1111-4111-8111-111111111111',
          },
          user_id: 'user_alice',
          user_email: 'alice@example.com',
          counts: {
            conversations: 1,
            messages: 2,
            files: 0,
            presets: 0,
            agents: 0,
            memories: 0,
            tool_calls: 0,
            transcript_sessions: 0,
            workspace_items: 0,
            shares: 0,
          },
        },
        data,
      });

      const extractDir = path.join(workDir, 'extract');
      const result = await unpackAndVerifyEnvelope({ tarballPath: outputPath, extractDir });

      expect(result.rootName).toBe(BOSKE_EXPORT_ENVELOPE_ROOT);
      expect(result.manifest.counts.messages).toBe(2);
      expect(result.data.messages).toHaveLength(2);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
