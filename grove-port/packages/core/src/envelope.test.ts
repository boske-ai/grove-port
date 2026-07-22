import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { create } from 'tar';
import { describe, expect, test } from 'bun:test';
import {
  BOSKE_EXPORT_ENVELOPE_ROOT,
  EXPORT_ATTACHMENTS_DIR,
  EXPORT_DATA_FILENAME,
  EXPORT_MANIFEST_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
  type ExportDataV1,
  type ExportManifestV1,
} from '@grove-port/schema';
import { canonicalManifestBytes, unpackAndVerifyEnvelope } from '@grove-port/core';
import { DEFAULT_TAR_EXTRACT_BUDGETS } from './tar-budgets.js';

function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

async function createSignedFixture(options?: {
  /** Merged onto the default `data.json` checksum unless `replaceChecksums` is set. */
  checksumOverrides?: Record<string, string>;
  /** When true, `checksumOverrides` fully replaces checksums (default still empty object). */
  replaceChecksums?: boolean;
  extraTopLevelFile?: string;
}): Promise<{ tarballPath: string; manifest: ExportManifestV1 }> {
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

  const checksums: Record<string, string> = options?.replaceChecksums
    ? { ...(options.checksumOverrides ?? {}) }
    : {
        [EXPORT_DATA_FILENAME]: dataChecksum,
        ...options?.checksumOverrides,
      };

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
    checksums,
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
  if (options?.extraTopLevelFile) {
    await writeFile(path.join(root, options.extraTopLevelFile), 'unexpected\n');
  }

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

  test('unpackAndVerifyEnvelope rejects absolute checksum keys before hashing', async () => {
    const absoluteKey = path.resolve('/tmp/grove-port-escape-target');
    const { tarballPath } = await createSignedFixture({
      checksumOverrides: {
        [absoluteKey]: 'a'.repeat(64),
      },
    });
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-fixture-extract-'));

    try {
      await expect(unpackAndVerifyEnvelope({ tarballPath, extractDir })).rejects.toThrow(
        /unsafe checksum key/,
      );
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope rejects `../` checksum keys before hashing', async () => {
    const { tarballPath } = await createSignedFixture({
      checksumOverrides: {
        '../outside.txt': 'b'.repeat(64),
      },
    });
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-fixture-extract-'));

    try {
      await expect(unpackAndVerifyEnvelope({ tarballPath, extractDir })).rejects.toThrow(
        /unsafe checksum key/,
      );
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope rejects unexpected top-level members', async () => {
    const { tarballPath } = await createSignedFixture({
      extraTopLevelFile: 'evil.bin',
    });
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-fixture-extract-'));

    try {
      await expect(unpackAndVerifyEnvelope({ tarballPath, extractDir })).rejects.toThrow(
        /unexpected top-level member/,
      );
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope rejects symlink attachments pointing outside the tree', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const publicKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

    const data: ExportDataV1 = {
      user: { id: 'user-1', email: 'user@example.com' },
      conversations: [],
      messages: [],
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
    const outsideHash = sha256Hex('secret-bytes\n');

    const attachmentKey = `${EXPORT_ATTACHMENTS_DIR}/leak.txt`;
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
        conversations: 0,
        messages: 0,
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
        [attachmentKey]: outsideHash,
      },
      signature_alg: 'ed25519',
      signature_public_key: publicKeyBase64,
    };
    const signature = sign(null, canonicalManifestBytes(manifest), privateKey).toString('base64');

    const stagingDir = await mkdtemp(path.join(tmpdir(), 'grove-port-symlink-stage-'));
    const escapeDir = path.join(stagingDir, 'escape-target');
    await mkdir(escapeDir, { recursive: true });
    await writeFile(path.join(escapeDir, 'secret.txt'), 'secret-bytes\n');

    const root = path.join(stagingDir, BOSKE_EXPORT_ENVELOPE_ROOT);
    const attachmentsDir = path.join(root, EXPORT_ATTACHMENTS_DIR);
    await mkdir(attachmentsDir, { recursive: true });
    await writeFile(path.join(root, EXPORT_DATA_FILENAME), dataBytes);
    await writeFile(path.join(root, EXPORT_MANIFEST_FILENAME), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(path.join(root, EXPORT_SIGNATURE_FILENAME), signature);
    // Relative symlink escapes envelope root to sibling escape-target/ (survives tar round-trip).
    await symlink(path.join('..', '..', 'escape-target', 'secret.txt'), path.join(attachmentsDir, 'leak.txt'));

    const tarballPath = path.join(stagingDir, 'fixture.grove-port');
    await create(
      {
        gzip: true,
        file: tarballPath,
        cwd: stagingDir,
      },
      [BOSKE_EXPORT_ENVELOPE_ROOT, 'escape-target'],
    );

    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-symlink-extract-'));
    try {
      await expect(unpackAndVerifyEnvelope({ tarballPath, extractDir })).rejects.toThrow(
        /symlink|outside/,
      );
    } finally {
      await rm(stagingDir, { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  for (const filename of [
    EXPORT_MANIFEST_FILENAME,
    EXPORT_SIGNATURE_FILENAME,
    EXPORT_DATA_FILENAME,
  ] as const) {
    test(`unpackAndVerifyEnvelope rejects top-level symlink at ${filename}`, async () => {
      const { privateKey, publicKey } = generateKeyPairSync('ed25519');
      const publicKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

      const data: ExportDataV1 = {
        user: { id: 'user-1', email: 'user@example.com' },
        conversations: [],
        messages: [],
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
      const outsidePayload =
        filename === EXPORT_MANIFEST_FILENAME
          ? `${JSON.stringify({ version: 'v1' }, null, 2)}\n`
          : filename === EXPORT_SIGNATURE_FILENAME
            ? 'not-a-real-signature\n'
            : 'secret-data\n';

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
          conversations: 0,
          messages: 0,
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

      const stagingDir = await mkdtemp(path.join(tmpdir(), 'grove-port-toplevel-symlink-'));
      const escapeDir = path.join(stagingDir, 'escape-target');
      await mkdir(escapeDir, { recursive: true });
      await writeFile(path.join(escapeDir, filename), outsidePayload);

      const root = path.join(stagingDir, BOSKE_EXPORT_ENVELOPE_ROOT);
      await mkdir(root, { recursive: true });

      if (filename !== EXPORT_DATA_FILENAME) {
        await writeFile(path.join(root, EXPORT_DATA_FILENAME), dataBytes);
      }
      if (filename !== EXPORT_MANIFEST_FILENAME) {
        await writeFile(
          path.join(root, EXPORT_MANIFEST_FILENAME),
          `${JSON.stringify(manifest, null, 2)}\n`,
        );
      }
      if (filename !== EXPORT_SIGNATURE_FILENAME) {
        await writeFile(path.join(root, EXPORT_SIGNATURE_FILENAME), signature);
      }
      // Relative symlink escapes envelope root to sibling escape-target/ (survives tar).
      await symlink(path.join('..', 'escape-target', filename), path.join(root, filename));

      const tarballPath = path.join(stagingDir, 'fixture.grove-port');
      await create(
        {
          gzip: true,
          file: tarballPath,
          cwd: stagingDir,
        },
        [BOSKE_EXPORT_ENVELOPE_ROOT, 'escape-target'],
      );

      const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-toplevel-extract-'));
      try {
        await expect(unpackAndVerifyEnvelope({ tarballPath, extractDir })).rejects.toThrow(
          /symlink|outside/,
        );
      } finally {
        await rm(stagingDir, { recursive: true, force: true });
        await rm(extractDir, { recursive: true, force: true });
      }
    });
  }

  test('unpackAndVerifyEnvelope rejects missing data.json in checksums', async () => {
    const { tarballPath } = await createSignedFixture({
      replaceChecksums: true,
      checksumOverrides: {},
    });
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-fixture-extract-'));

    try {
      await expect(unpackAndVerifyEnvelope({ tarballPath, extractDir })).rejects.toThrow(
        /manifest\.checksums must include 'data\.json'/,
      );
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope rejects oversized .grove-port before extract', async () => {
    const stagingDir = await mkdtemp(path.join(tmpdir(), 'grove-port-oversize-archive-'));
    const tarballPath = path.join(stagingDir, 'huge.grove-port');
    await writeFile(tarballPath, Buffer.alloc(64));
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-oversize-extract-'));

    try {
      await expect(
        unpackAndVerifyEnvelope({
          tarballPath,
          extractDir,
          budgets: { ...DEFAULT_TAR_EXTRACT_BUDGETS, maxArchiveBytes: 32 },
        }),
      ).rejects.toThrow(/archive exceeds max size/);
    } finally {
      await rm(stagingDir, { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope rejects too many tar entries', async () => {
    const { tarballPath } = await createSignedFixture();
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-entries-extract-'));

    try {
      await expect(
        unpackAndVerifyEnvelope({
          tarballPath,
          extractDir,
          budgets: { ...DEFAULT_TAR_EXTRACT_BUDGETS, maxEntries: 2 },
        }),
      ).rejects.toThrow(/too many entries/);
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope rejects oversized total extracted bytes', async () => {
    const { tarballPath } = await createSignedFixture();
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-bytes-extract-'));

    try {
      await expect(
        unpackAndVerifyEnvelope({
          tarballPath,
          extractDir,
          budgets: { ...DEFAULT_TAR_EXTRACT_BUDGETS, maxTotalExtractedBytes: 16 },
        }),
      ).rejects.toThrow(/total extracted size exceeds budget/);
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope rejects oversized data.json before JSON.parse', async () => {
    const { tarballPath } = await createSignedFixture();
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-datajson-extract-'));

    try {
      await expect(
        unpackAndVerifyEnvelope({
          tarballPath,
          extractDir,
          budgets: { ...DEFAULT_TAR_EXTRACT_BUDGETS, maxDataJsonBytes: 8 },
        }),
      ).rejects.toThrow(/data\.json exceeds max size/);
    } finally {
      await rm(path.dirname(tarballPath), { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });

  test('unpackAndVerifyEnvelope refuses tar entry path escape', async () => {
    const stagingDir = await mkdtemp(path.join(tmpdir(), 'grove-port-escape-stage-'));
    const payloadPath = path.join(stagingDir, 'payload.txt');
    await writeFile(payloadPath, 'escape\n');
    const tarballPath = path.join(stagingDir, 'escape.grove-port');
    await create(
      {
        gzip: true,
        file: tarballPath,
        cwd: stagingDir,
        preservePaths: true,
        onWriteEntry(entry) {
          entry.path = '../outside-escape.txt';
        },
      },
      ['payload.txt'],
    );
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-escape-extract-'));

    try {
      await expect(unpackAndVerifyEnvelope({ tarballPath, extractDir })).rejects.toThrow(
        /path escapes extract dir/,
      );
    } finally {
      await rm(stagingDir, { recursive: true, force: true });
      await rm(extractDir, { recursive: true, force: true });
    }
  });
});
