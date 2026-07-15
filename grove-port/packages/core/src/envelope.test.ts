import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { create } from 'tar';
import { describe, expect, test } from 'bun:test';
import {
  BOSKE_EXPORT_ENVELOPE_ROOT,
  EXPORT_DATA_FILENAME,
  EXPORT_MANIFEST_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
  type ExportDataV1,
  type ExportManifestV1,
} from '@grove-port/schema';
import { canonicalManifestBytes, unpackAndVerifyEnvelope } from '@grove-port/core';

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

async function createSignedFixture(): Promise<{ tarballPath: string; manifest: ExportManifestV1 }> {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const publicKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

  const data: ExportDataV1 = {
    user: { id: 'user-1', email: 'user@example.com' },
    conversations: [{ id: 'c1', title: 'Hello' }],
    messages: [{ id: 'm1', conversation_id: 'c1', text: 'Hi' }],
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

  const dataBytes = Buffer.from(JSON.stringify(data), 'utf8');
  const dataChecksum = sha256Hex(dataBytes.toString('utf8'));

  const manifest: ExportManifestV1 = {
    version: 'v1',
    created_at: '2026-06-18T12:00:00.000Z',
    source: {
      app_version: '0.7.903',
      deployment: 'electron-local',
      tier: 'local',
      instance_id: '550e8400-e29b-41d4-a716-446655440000',
    },
    user_id: 'user-1',
    user_email: 'user@example.com',
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
    checksums: {
      [EXPORT_DATA_FILENAME]: dataChecksum,
    },
    signature_alg: 'ed25519',
    signature_public_key: publicKeyBase64,
  };

  const signature = sign(null, canonicalManifestBytes(manifest), privateKey).toString('base64');

  const stagingDir = await mkdtemp(path.join(tmpdir(), 'grove-port-fixture-stage-'));
  const root = path.join(stagingDir, BOSKE_EXPORT_ENVELOPE_ROOT);
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, EXPORT_DATA_FILENAME), dataBytes);
  await writeFile(path.join(root, EXPORT_MANIFEST_FILENAME), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(root, EXPORT_SIGNATURE_FILENAME), signature);

  const tarballPath = path.join(stagingDir, 'fixture.grove-port');
  await create(
    {
      gzip: true,
      file: tarballPath,
      cwd: stagingDir,
    },
    [BOSKE_EXPORT_ENVELOPE_ROOT],
  );

  return { tarballPath, manifest };
}

describe('@grove-port/core envelope', () => {
  test('unpackAndVerifyEnvelope accepts a signed Boske-root tarball', async () => {
    const { tarballPath, manifest } = await createSignedFixture();
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-fixture-extract-'));

    try {
      const result = await unpackAndVerifyEnvelope({ tarballPath, extractDir });
      expect(result.manifest.user_email).toBe(manifest.user_email);
      expect(result.data.messages).toHaveLength(1);
      expect(result.rootName).toBe(BOSKE_EXPORT_ENVELOPE_ROOT);

      const onDiskManifest = await readFile(
        path.join(result.root, EXPORT_MANIFEST_FILENAME),
        'utf8',
      );
      expect(onDiskManifest).toContain('"version": "v1"');
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });
});
