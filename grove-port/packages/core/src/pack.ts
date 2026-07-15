import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { create } from 'tar';
import {
  EXPORT_DATA_FILENAME,
  EXPORT_MANIFEST_FILENAME,
  EXPORT_README_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
  ExportDataV1Schema,
  ExportManifestV1Schema,
  GROVE_PORT_ENVELOPE_ROOT,
  type EnvelopeRootName,
  type ExportDataV1,
  type ExportManifestV1,
} from '@grove-port/schema';
import { canonicalManifestBytes } from './canonical.js';
import { sha256Hex } from './crypto.js';

export interface PackAttachmentInput {
  storage_name: string;
  sha256: string;
  /** Node path — used when bytes is omitted */
  sourcePath?: string;
  /** In-memory bytes — used by browser pack and preferred when present */
  bytes?: Uint8Array;
}

export interface PackEnvelopeInput {
  outputPath: string;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  data: ExportDataV1;
  attachments?: PackAttachmentInput[];
  readme?: string;
  envelopeRoot?: EnvelopeRootName;
  signingKeys?: {
    privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'];
    publicKeyBase64: string;
  };
}

export interface PackEnvelopeResult {
  manifest: ExportManifestV1;
  signature: string;
  outputPath: string;
}

function createSigningKeys(): PackEnvelopeInput['signingKeys'] {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const publicKeyBase64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  return { privateKey, publicKeyBase64 };
}

function signManifest(
  manifest: ExportManifestV1,
  privateKey: NonNullable<PackEnvelopeInput['signingKeys']>['privateKey'],
): string {
  const bytes = canonicalManifestBytes(manifest);
  return sign(null, bytes, privateKey).toString('base64');
}

function defaultReadme(manifest: ExportManifestV1): string {
  return [
    '# Grove Port export',
    '',
    `Created: ${manifest.created_at}`,
    `User: ${manifest.user_email}`,
    `Source: ${manifest.source.deployment} (${manifest.source.tier}, ${manifest.source.app_version})`,
    '',
    'This archive is a Grove Port v1 package — a portable, signed copy of AI workspace data.',
    '',
    'Verify offline:',
    '',
    '```',
    'grove-port verify path/to/this-file.grove-port',
    '```',
    '',
  ].join('\n');
}

export async function packEnvelope({
  outputPath,
  manifest,
  data,
  attachments = [],
  readme,
  envelopeRoot = GROVE_PORT_ENVELOPE_ROOT,
  signingKeys,
}: PackEnvelopeInput): Promise<PackEnvelopeResult> {
  ExportDataV1Schema.parse(data);

  const keys = signingKeys ?? createSigningKeys();
  assert(keys, 'signing keys are required');

  const stagingDir = await mkdtemp(path.join(tmpdir(), 'grove-port-pack-'));
  const root = path.join(stagingDir, envelopeRoot);
  const attachmentsDir = path.join(root, 'attachments');
  await mkdir(attachmentsDir, { recursive: true });

  try {
    const dataBytes = Buffer.from(JSON.stringify(data), 'utf8');
    await writeFile(path.join(root, EXPORT_DATA_FILENAME), dataBytes);
    const checksums: Record<string, string> = {
      [EXPORT_DATA_FILENAME]: sha256Hex(dataBytes),
    };

    for (const attachment of attachments) {
      const fileName = path.basename(attachment.storage_name);
      const dest = path.join(attachmentsDir, fileName);
      const onDisk =
        attachment.bytes ??
        (attachment.sourcePath ? await readFile(attachment.sourcePath) : undefined);

      if (!onDisk) {
        throw new Error(`attachment ${attachment.storage_name} is missing bytes or sourcePath`);
      }

      await writeFile(dest, onDisk);
      const digest = sha256Hex(onDisk);
      if (attachment.sha256 !== digest) {
        throw new Error(
          `attachment checksum mismatch for ${attachment.storage_name}: expected ${attachment.sha256}, got ${digest}`,
        );
      }
      checksums[`attachments/${fileName}`] = digest;
    }

    const readmeText = readme ?? defaultReadme({ ...manifest, checksums } as ExportManifestV1);
    await writeFile(path.join(root, EXPORT_README_FILENAME), readmeText, 'utf8');

    const finalManifest = ExportManifestV1Schema.parse({
      ...manifest,
      checksums,
      signature_alg: 'ed25519',
      signature_public_key: keys.publicKeyBase64,
    });

    await writeFile(
      path.join(root, EXPORT_MANIFEST_FILENAME),
      `${JSON.stringify(finalManifest, null, 2)}\n`,
      'utf8',
    );

    const signature = signManifest(finalManifest, keys.privateKey);
    await writeFile(path.join(root, EXPORT_SIGNATURE_FILENAME), signature, 'utf8');

    await create(
      {
        gzip: true,
        file: outputPath,
        cwd: stagingDir,
      },
      [envelopeRoot],
    );

    return { manifest: finalManifest, signature, outputPath };
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
}

function assert<T>(value: T, message: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}
