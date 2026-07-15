import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { extract } from 'tar';
import {
  DATA_COLLECTION_KEYS,
  ENVELOPE_ROOT_NAMES,
  EXPORT_ATTACHMENTS_DIR,
  EXPORT_DATA_FILENAME,
  EXPORT_MANIFEST_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
  ExportDataV1Schema,
  ExportManifestV1Schema,
  type EnvelopeRootName,
  type ExportCounts,
  type ExportDataV1,
  type ExportManifestV1,
} from '@grove-port/schema';
import { sha256HexFile, verifyManifestSignature } from './crypto.js';

export interface UnpackAndVerifyResult {
  manifest: ExportManifestV1;
  data: ExportDataV1;
  root: string;
  rootName: EnvelopeRootName;
}

export interface InspectSummary {
  wire_id: string;
  envelope_root: EnvelopeRootName;
  manifest: {
    version: ExportManifestV1['version'];
    label?: string;
    created_at: string;
    user_id: string;
    user_email: string;
    source: ExportManifestV1['source'];
    counts: ExportCounts;
  };
  actual_counts: ExportCounts & { attachments: number; user_fields: number };
  checksum_files: number;
  signature_valid: true;
}

function resolveEnvelopeRoot(extractDir: string): { root: string; rootName: EnvelopeRootName } {
  for (const rootName of ENVELOPE_ROOT_NAMES) {
    const root = path.join(extractDir, rootName);
    if (existsSync(root)) {
      return { root, rootName };
    }
  }

  throw new Error(
    `envelope is missing root directory (${ENVELOPE_ROOT_NAMES.map((name: string) => `'${name}/'`).join(' or ')})`,
  );
}

function countDataCollections(data: ExportDataV1): InspectSummary['actual_counts'] {
  const counts = {} as InspectSummary['actual_counts'];

  for (const key of DATA_COLLECTION_KEYS) {
    counts[key] = data[key].length;
  }

  counts.attachments = data.attachments.length;
  counts.user_fields = Object.keys(data.user).length;
  return counts;
}

export async function unpackAndVerifyEnvelope({
  tarballPath,
  extractDir,
}: {
  tarballPath: string;
  extractDir: string;
}): Promise<UnpackAndVerifyResult> {
  await mkdir(extractDir, { recursive: true });
  await extract({ file: tarballPath, cwd: extractDir });

  const { root, rootName } = resolveEnvelopeRoot(extractDir);

  const manifestRaw = JSON.parse(
    await readFile(path.join(root, EXPORT_MANIFEST_FILENAME), 'utf8'),
  ) as unknown;
  const manifest = ExportManifestV1Schema.parse(manifestRaw);

  const signatureBase64 = (await readFile(path.join(root, EXPORT_SIGNATURE_FILENAME), 'utf8')).trim();
  const signatureValid = verifyManifestSignature(
    manifest,
    signatureBase64,
    manifest.signature_public_key,
  );

  if (!signatureValid) {
    throw new Error('envelope signature is INVALID — manifest has been tampered with');
  }

  for (const [relPath, expectedHash] of Object.entries(manifest.checksums)) {
    const filePath = path.join(root, relPath);
    if (!existsSync(filePath)) {
      throw new Error(`envelope is missing declared file '${relPath}'`);
    }

    const actualHash = await sha256HexFile(filePath);
    if (actualHash !== expectedHash) {
      throw new Error(
        `checksum mismatch for '${relPath}': expected ${expectedHash}, got ${actualHash}`,
      );
    }
  }

  const attachmentsDir = path.join(root, EXPORT_ATTACHMENTS_DIR);
  if (existsSync(attachmentsDir)) {
    const onDisk = await readdir(attachmentsDir);
    for (const name of onDisk) {
      const key = `${EXPORT_ATTACHMENTS_DIR}/${name}`;
      if (!(key in manifest.checksums)) {
        throw new Error(`unexpected attachment '${key}' is not in manifest.checksums`);
      }
    }
  }

  const dataRaw = JSON.parse(await readFile(path.join(root, EXPORT_DATA_FILENAME), 'utf8')) as unknown;
  const data = ExportDataV1Schema.parse(dataRaw);

  return { manifest, data, root, rootName };
}

export async function inspectEnvelope(tarballPath: string): Promise<InspectSummary> {
  const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-inspect-'));

  try {
    const { manifest, data, rootName } = await unpackAndVerifyEnvelope({
      tarballPath,
      extractDir,
    });

    return {
      wire_id: 'boske-export-v1',
      envelope_root: rootName,
      manifest: {
        version: manifest.version,
        label: manifest.label,
        created_at: manifest.created_at,
        user_id: manifest.user_id,
        user_email: manifest.user_email,
        source: manifest.source,
        counts: manifest.counts,
      },
      actual_counts: countDataCollections(data),
      checksum_files: Object.keys(manifest.checksums).length,
      signature_valid: true,
    };
  } finally {
    await rm(extractDir, { recursive: true, force: true });
  }
}
