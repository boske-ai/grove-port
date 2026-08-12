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
import { generateEd25519KeyPair, sha256HexBytes, signManifestWeb } from './crypto-web.js';
import { createTarGzip, type TarEntry } from './tar-gzip.js';

export interface PackAttachmentBytesInput {
  storage_name: string;
  bytes: Uint8Array;
  sha256: string;
}

export interface PackEnvelopeBytesInput {
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  data: ExportDataV1;
  attachments?: PackAttachmentBytesInput[];
  readme?: string;
  envelopeRoot?: EnvelopeRootName;
}

export interface PackEnvelopeBytesResult {
  manifest: ExportManifestV1;
  signature: string;
  bytes: Uint8Array;
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

/**
 * Browser-safe basename + sanitize — aligns with Node `pack.ts` (`path.basename`)
 * and verify allowlist (no `/`, `\`, NUL, `.`, `..`).
 */
function sanitizeStorageName(storageName: string): string {
  if (storageName.includes('\0')) {
    throw new Error(`unsafe attachment storage_name: contains NUL: '${storageName}'`);
  }
  const normalized = storageName.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const base = segments[segments.length - 1] ?? '';
  if (base.length === 0 || base === '.' || base === '..') {
    throw new Error(`unsafe attachment storage_name: empty or reserved basename: '${storageName}'`);
  }
  if (base.includes('/') || base.includes('\\')) {
    throw new Error(`unsafe attachment storage_name: must be a safe basename: '${storageName}'`);
  }
  return base;
}

/** Browser-safe envelope packer — returns gzip tar bytes (`.grove-port` wire format). */
export async function packEnvelopeBytes({
  manifest,
  data,
  attachments = [],
  readme,
  envelopeRoot = GROVE_PORT_ENVELOPE_ROOT,
}: PackEnvelopeBytesInput): Promise<PackEnvelopeBytesResult> {
  ExportDataV1Schema.parse(data);

  const keys = await generateEd25519KeyPair();
  const dataBytes = new TextEncoder().encode(JSON.stringify(data));
  const checksums: Record<string, string> = {
    [EXPORT_DATA_FILENAME]: await sha256HexBytes(dataBytes),
  };

  const tarEntries: TarEntry[] = [];

  for (const attachment of attachments) {
    const fileName = sanitizeStorageName(attachment.storage_name);
    const digest = await sha256HexBytes(attachment.bytes);
    if (attachment.sha256 !== digest) {
      throw new Error(
        `attachment checksum mismatch for ${attachment.storage_name}: expected ${attachment.sha256}, got ${digest}`,
      );
    }
    checksums[`attachments/${fileName}`] = digest;
    tarEntries.push({
      path: `${envelopeRoot}/attachments/${fileName}`,
      data: attachment.bytes,
    });
  }

  const readmeText = readme ?? defaultReadme({ ...manifest, checksums } as ExportManifestV1);
  const readmeBytes = new TextEncoder().encode(readmeText);
  // Checksum the README so no envelope member sits outside the signature.
  checksums[EXPORT_README_FILENAME] = await sha256HexBytes(readmeBytes);

  const finalManifest = ExportManifestV1Schema.parse({
    ...manifest,
    checksums,
    signature_alg: 'ed25519',
    signature_public_key: keys.publicKeyBase64,
  });

  const manifestText = `${JSON.stringify(finalManifest, null, 2)}\n`;
  const signature = await signManifestWeb(finalManifest, keys.privateKey);

  tarEntries.unshift(
    { path: `${envelopeRoot}/${EXPORT_DATA_FILENAME}`, data: dataBytes },
    { path: `${envelopeRoot}/${EXPORT_README_FILENAME}`, data: readmeBytes },
    {
      path: `${envelopeRoot}/${EXPORT_MANIFEST_FILENAME}`,
      data: new TextEncoder().encode(manifestText),
    },
    {
      path: `${envelopeRoot}/${EXPORT_SIGNATURE_FILENAME}`,
      data: new TextEncoder().encode(signature),
    },
  );

  return {
    manifest: finalManifest,
    signature,
    bytes: createTarGzip(tarEntries),
  };
}
