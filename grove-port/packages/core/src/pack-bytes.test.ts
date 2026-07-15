import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import { unpackAndVerifyEnvelope } from './envelope.js';
import { packEnvelopeBytes } from './pack-bytes.js';

describe('packEnvelopeBytes', () => {
  test('produces a tarball that Node unpackAndVerifyEnvelope accepts', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-pack-bytes-'));
    const tarballPath = path.join(workDir, 'browser.grove-port');

    try {
      const packed = await packEnvelopeBytes({
        manifest: {
          version: 'v1',
          created_at: new Date().toISOString(),
          source: {
            app_version: '1.0.0',
            deployment: 'web-saas',
            tier: 'free',
            instance_id: '00000000-0000-4000-8000-000000000000',
            adapter: 'grove-port-adapter-chatgpt',
            adapter_version: '1.0.0',
            source_format: 'chatgpt-export-v1',
          },
          user_id: 'browser-test',
          user_email: 'browser@test.local',
          counts: {
            conversations: 1,
            messages: 1,
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
        data: {
          user: { id: 'browser-test', email: 'browser@test.local' },
          conversations: [{ conversationId: 'c1', title: 'Test' }],
          messages: [{ messageId: 'm1', text: 'hello' }],
          files: [],
          presets: [],
          agents: [],
          memories: [],
          tool_calls: [],
          transcript_sessions: [],
          workspace_items: [],
          shares: [],
          attachments: [],
        },
      });

      await writeFile(tarballPath, packed.bytes);
      const unpacked = await unpackAndVerifyEnvelope({
        tarballPath,
        extractDir: path.join(workDir, 'extract'),
      });

      expect(unpacked.manifest.signature_public_key).toBe(packed.manifest.signature_public_key);
      expect(unpacked.data.messages).toHaveLength(1);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
