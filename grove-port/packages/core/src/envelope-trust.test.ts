/**
 * Regression tests for the Aug 2026 audit trust findings.
 *
 * The signature is verified against `manifest.json` EXACTLY as written on disk.
 * These tests pin both directions of that contract: schema evolution must not
 * invalidate old packages, and unsigned bytes must not ride along inside one.
 */
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { create } from 'tar';
import { describe, expect, test } from 'bun:test';
import {
  EXPORT_ATTACHMENTS_DIR,
  EXPORT_DATA_FILENAME,
  EXPORT_MANIFEST_FILENAME,
  EXPORT_README_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
  GROVE_PORT_ENVELOPE_ROOT,
} from '@grove-port/schema';
import { packEnvelope, stableStringify, unpackAndVerifyEnvelope } from '@grove-port/core';
import { MAX_CANONICAL_DEPTH } from './canonical.js';

const sha256Hex = (input: Buffer | string) => createHash('sha256').update(input).digest('hex');

const MINIMAL_DATA = {
  user: { id: 'user-1' },
  conversations: [],
  messages: [],
  files: [],
  presets: [],
  agents: [],
  memories: [],
  tool_calls: [],
  transcript_sessions: [],
  shares: [],
  attachments: [],
};

/** Signs `signedManifest` with a fresh key and injects the public key into both copies. */
async function buildSignedEnvelope(options: {
  mutateSigned?: (manifest: Record<string, unknown>) => Record<string, unknown>;
  mutateOnDisk?: (manifest: Record<string, unknown>) => Record<string, unknown>;
  extraFiles?: Array<{ relPath: string; content: string }>;
  extraDirs?: string[];
  extraChecksums?: Record<string, string>;
}): Promise<string> {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const dataBytes = Buffer.from(JSON.stringify(MINIMAL_DATA), 'utf8');

  const base: Record<string, unknown> = {
    version: 'v1',
    created_at: '2026-01-01T00:00:00.000Z',
    source: {
      app_version: '1.0.0',
      deployment: 'web-saas',
      tier: 'free',
      instance_id: '00000000-0000-4000-8000-000000000000',
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
    checksums: { [EXPORT_DATA_FILENAME]: sha256Hex(dataBytes), ...options.extraChecksums },
    signature_alg: 'ed25519',
    signature_public_key: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
  };

  const signedManifest = options.mutateSigned ? options.mutateSigned(base) : base;
  const onDiskManifest = options.mutateOnDisk ? options.mutateOnDisk(signedManifest) : signedManifest;

  const staging = await mkdtemp(path.join(tmpdir(), 'grove-port-trust-'));
  const root = path.join(staging, GROVE_PORT_ENVELOPE_ROOT);
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, EXPORT_DATA_FILENAME), dataBytes);

  for (const dir of options.extraDirs ?? []) {
    await mkdir(path.join(root, dir), { recursive: true });
  }
  for (const file of options.extraFiles ?? []) {
    await mkdir(path.dirname(path.join(root, file.relPath)), { recursive: true });
    await writeFile(path.join(root, file.relPath), file.content);
  }

  await writeFile(
    path.join(root, EXPORT_MANIFEST_FILENAME),
    `${JSON.stringify(onDiskManifest, null, 2)}\n`,
  );
  await writeFile(
    path.join(root, EXPORT_SIGNATURE_FILENAME),
    sign(null, Buffer.from(stableStringify(signedManifest), 'utf8'), privateKey).toString('base64'),
  );

  const tarballPath = path.join(staging, 'fixture.grove-port');
  await create({ gzip: true, file: tarballPath, cwd: staging }, [GROVE_PORT_ENVELOPE_ROOT]);
  return tarballPath;
}

async function verify(tarballPath: string) {
  const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-trust-extract-'));
  try {
    return await unpackAndVerifyEnvelope({ tarballPath, extractDir });
  } finally {
    await rm(extractDir, { recursive: true, force: true });
    await rm(path.dirname(tarballPath), { recursive: true, force: true });
  }
}

describe('signature covers the manifest as written on disk', () => {
  test('accepts a pre-workspace_items package signed before the field existed', async () => {
    // Regression: adding `counts.workspace_items` with a Zod default used to make
    // correctly-signed older packages fail as "manifest has been tampered with",
    // because canonicalization ran over the post-default parsed object.
    const tarballPath = await buildSignedEnvelope({
      mutateSigned: (manifest) => {
        const counts = { ...(manifest.counts as Record<string, unknown>) };
        delete counts.workspace_items;
        return { ...manifest, counts };
      },
    });

    const result = await verify(tarballPath);
    expect(result.manifest.counts.workspace_items).toBe(0);
  });

  test('rejects extra manifest keys the signature never covered', async () => {
    const tarballPath = await buildSignedEnvelope({
      mutateOnDisk: (manifest) => ({
        ...manifest,
        trusted_publisher: 'boske.dev',
        retention_policy: 'delete-after-import',
      }),
    });

    await expect(verify(tarballPath)).rejects.toThrow(/signature is INVALID/);
  });

  test('rejects a manifest whose signature_public_key was swapped', async () => {
    const other = generateKeyPairSync('ed25519');
    const tarballPath = await buildSignedEnvelope({
      mutateOnDisk: (manifest) => ({
        ...manifest,
        signature_public_key: other.publicKey
          .export({ type: 'spki', format: 'der' })
          .toString('base64'),
      }),
    });

    await expect(verify(tarballPath)).rejects.toThrow(/signature is INVALID/);
  });

  test('reports a malformed public key as a verification failure, not a crypto crash', async () => {
    const tarballPath = await buildSignedEnvelope({
      mutateSigned: (manifest) => ({ ...manifest, signature_public_key: 'bm90LWEta2V5' }),
    });

    await expect(verify(tarballPath)).rejects.toThrow(/signature could not be verified/);
  });
});

describe('no envelope member escapes the checksums', () => {
  test('packEnvelope output has zero unverified members', async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), 'grove-port-pack-'));
    const outputPath = path.join(outDir, 'out.grove-port');

    try {
      await packEnvelope({
        outputPath,
        manifest: {
          version: 'v1',
          created_at: '2026-01-01T00:00:00.000Z',
          source: {
            app_version: '1.0.0',
            deployment: 'web-saas',
            tier: 'free',
            instance_id: '00000000-0000-4000-8000-000000000000',
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
        },
        data: { ...MINIMAL_DATA, workspace_items: [] },
      });

      const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-pack-extract-'));
      try {
        const result = await unpackAndVerifyEnvelope({ tarballPath: outputPath, extractDir });
        expect(result.unverifiedMembers).toEqual([]);
        expect(result.manifest.checksums[EXPORT_README_FILENAME]).toMatch(/^[a-f0-9]{64}$/);
      } finally {
        await rm(extractDir, { recursive: true, force: true });
      }
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  test('flags a legacy README that no checksum covers', async () => {
    const tarballPath = await buildSignedEnvelope({
      extraFiles: [{ relPath: EXPORT_README_FILENAME, content: 'ARBITRARY UNVERIFIED CONTENT\n' }],
    });

    const result = await verify(tarballPath);
    expect(result.unverifiedMembers).toEqual([EXPORT_README_FILENAME]);
  });

  test('verifies a README once it is declared in checksums', async () => {
    const readme = '# Grove Port export\n';
    const tarballPath = await buildSignedEnvelope({
      extraFiles: [{ relPath: EXPORT_README_FILENAME, content: readme }],
      extraChecksums: { [EXPORT_README_FILENAME]: sha256Hex(readme) },
    });

    const result = await verify(tarballPath);
    expect(result.unverifiedMembers).toEqual([]);
  });

  test('rejects a tampered README once it is declared in checksums', async () => {
    const tarballPath = await buildSignedEnvelope({
      extraFiles: [{ relPath: EXPORT_README_FILENAME, content: 'TAMPERED\n' }],
      extraChecksums: { [EXPORT_README_FILENAME]: sha256Hex('# Grove Port export\n') },
    });

    await expect(verify(tarballPath)).rejects.toThrow(/checksum mismatch/);
  });
});

describe('envelope member kinds', () => {
  test('rejects a directory declared as a checksummed attachment', async () => {
    // Previously surfaced as a raw `EISDIR` from the hash stream.
    const tarballPath = await buildSignedEnvelope({
      extraFiles: [{ relPath: `${EXPORT_ATTACHMENTS_DIR}/nested/x.bin`, content: 'x' }],
      extraChecksums: { [`${EXPORT_ATTACHMENTS_DIR}/nested`]: 'a'.repeat(64) },
    });

    await expect(verify(tarballPath)).rejects.toThrow(/expected a regular file/);
  });
});

describe('canonical serialization depth guard', () => {
  test('serializes normal manifest nesting', () => {
    expect(stableStringify({ a: { b: { c: [1, 2] } } })).toBe('{"a":{"b":{"c":[1,2]}}}');
  });

  test('refuses nesting deeper than the limit instead of overflowing the stack', () => {
    let deep: unknown = 'leaf';
    for (let i = 0; i < MAX_CANONICAL_DEPTH + 5; i += 1) {
      deep = [deep];
    }

    expect(() => stableStringify(deep)).toThrow(/nesting deeper than/);
  });
});
