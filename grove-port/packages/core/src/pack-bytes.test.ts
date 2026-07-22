import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import { unpackAndVerifyEnvelope } from './envelope.js';
import { sha256HexBytes } from './crypto-web.js';
import { packEnvelopeBytes } from './pack-bytes.js';

const baseManifest = {
  version: 'v1' as const,
  created_at: new Date().toISOString(),
  source: {
    app_version: '1.0.0',
    deployment: 'web-saas' as const,
    tier: 'free' as const,
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
};

const emptyData = {
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
  attachments: [] as Array<{
    file_id: string;
    storage_name: string;
    original_name: string;
    bytes: number;
    sha256: string;
  }>,
};

describe('packEnvelopeBytes', () => {
  test('produces a tarball that Node unpackAndVerifyEnvelope accepts', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-pack-bytes-'));
    const tarballPath = path.join(workDir, 'browser.grove-port');

    try {
      const packed = await packEnvelopeBytes({
        manifest: baseManifest,
        data: emptyData,
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

  test('round-trips long CJK attachment names via Node unpackAndVerifyEnvelope', async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), 'grove-port-pack-bytes-long-'));
    const tarballPath = path.join(workDir, 'browser-long.grove-port');

    // Path traversal + basename sanitize: only the final segment is stored.
    const storageName = `${'id'.repeat(40)}-報告書_${'あ'.repeat(20)}.png`;
    const unsafeInputName = `subdir/../${storageName}`;
    const fileBytes = new TextEncoder().encode('attachment-bytes');
    const digest = await sha256HexBytes(fileBytes);

    const tarPath = `grove-port-v1/attachments/${storageName}`;
    expect(new TextEncoder().encode(tarPath).length).toBeGreaterThan(100);

    try {
      const packed = await packEnvelopeBytes({
        manifest: {
          ...baseManifest,
          counts: { ...baseManifest.counts, files: 1 },
        },
        data: {
          ...emptyData,
          files: [{ id: 'f1', name: storageName }],
          attachments: [
            {
              file_id: 'f1',
              storage_name: storageName,
              original_name: '報告書.png',
              bytes: fileBytes.byteLength,
              sha256: digest,
            },
          ],
        },
        attachments: [{ storage_name: unsafeInputName, bytes: fileBytes, sha256: digest }],
      });

      const checksumKey = `attachments/${storageName}`;
      expect(packed.manifest.checksums[checksumKey]).toBe(digest);
      expect(Object.keys(packed.manifest.checksums).filter((k) => k.startsWith('attachments/'))).toEqual([
        checksumKey,
      ]);

      await writeFile(tarballPath, packed.bytes);
      const unpacked = await unpackAndVerifyEnvelope({
        tarballPath,
        extractDir: path.join(workDir, 'extract'),
      });

      expect(unpacked.manifest.checksums[checksumKey]).toBe(digest);
      expect(unpacked.data.attachments[0]?.storage_name).toBe(storageName);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
