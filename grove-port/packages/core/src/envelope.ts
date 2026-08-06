import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
import {
  ALLOWED_ENVELOPE_TOP_LEVEL,
  assertPathSafeForHash,
  resolveChecksumPath,
} from './path-safe.js';
import {
  DEFAULT_TAR_EXTRACT_BUDGETS,
  assertFileWithinBudget,
  extractTarWithBudgets,
  type TarExtractBudgets,
} from './tar-budgets.js';

export interface UnpackAndVerifyResult {
  manifest: ExportManifestV1;
  data: ExportDataV1;
  root: string;
  rootName: EnvelopeRootName;
  /**
   * Envelope members present on disk that no checksum covers. Always empty for
   * packages produced by this toolchain; a non-empty list means the package
   * carries content the signature does not vouch for (pre-2026-08 `README.md`).
   */
  unverifiedMembers: string[];
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
  /**
   * The manifest carries the key that verifies it, so a valid signature proves
   * the package is internally consistent — NOT who produced it. Until Grove Port
   * ships a trusted-key allowlist, this is always `self-signed`.
   */
  signature_trust: 'self-signed';
  /** Envelope members no checksum covers (empty for packages this toolchain produced). */
  unverified_members: string[];
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

async function assertEnvelopeTopLevelAllowlist(root: string): Promise<string[]> {
  const entries = await readdir(root);
  for (const name of entries) {
    if (!ALLOWED_ENVELOPE_TOP_LEVEL.has(name)) {
      throw new Error(`unexpected top-level member '${name}' under envelope root`);
    }
  }
  return entries;
}

/**
 * Structural members that carry the signature rather than being covered by it.
 * Everything else under the root must appear in `manifest.checksums`.
 */
const SIGNATURE_MACHINERY: ReadonlySet<string> = new Set([
  EXPORT_MANIFEST_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
  EXPORT_ATTACHMENTS_DIR,
]);

function collectUnverifiedMembers(
  topLevelEntries: string[],
  checksums: Record<string, string>,
): string[] {
  return topLevelEntries
    .filter((name) => !SIGNATURE_MACHINERY.has(name) && !(name in checksums))
    .sort();
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
  budgets = DEFAULT_TAR_EXTRACT_BUDGETS,
}: {
  tarballPath: string;
  extractDir: string;
  /** Optional overrides for tests; production uses {@link DEFAULT_TAR_EXTRACT_BUDGETS}. */
  budgets?: TarExtractBudgets;
}): Promise<UnpackAndVerifyResult> {
  await mkdir(extractDir, { recursive: true });
  await extractTarWithBudgets({ file: tarballPath, cwd: extractDir, budgets });

  const { root, rootName } = resolveEnvelopeRoot(extractDir);
  const topLevelEntries = await assertEnvelopeTopLevelAllowlist(root);

  const manifestPath = path.join(root, EXPORT_MANIFEST_FILENAME);
  await assertPathSafeForHash(root, manifestPath, EXPORT_MANIFEST_FILENAME, 'file');
  await assertFileWithinBudget(manifestPath, budgets.maxManifestBytes, EXPORT_MANIFEST_FILENAME);
  const manifestRaw = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;

  if (typeof manifestRaw !== 'object' || manifestRaw === null || Array.isArray(manifestRaw)) {
    throw new Error(`${EXPORT_MANIFEST_FILENAME} must be a JSON object`);
  }

  const signaturePath = path.join(root, EXPORT_SIGNATURE_FILENAME);
  await assertPathSafeForHash(root, signaturePath, EXPORT_SIGNATURE_FILENAME, 'file');
  const signatureBase64 = (await readFile(signaturePath, 'utf8')).trim();

  // Verify against the manifest EXACTLY as written on disk, before schema parsing.
  //
  // Canonicalizing the Zod-parsed object instead would (a) leave unknown keys
  // outside the signature, since Zod strips them, and (b) make every future
  // schema default a silent wire break — adding `counts.workspace_items` with a
  // default made correctly-signed older packages verify as "tampered with".
  const publicKeyBase64 = (manifestRaw as Record<string, unknown>).signature_public_key;
  if (typeof publicKeyBase64 !== 'string' || publicKeyBase64.length === 0) {
    throw new Error(`${EXPORT_MANIFEST_FILENAME} is missing 'signature_public_key'`);
  }

  let signatureValid: boolean;
  try {
    signatureValid = verifyManifestSignature(
      manifestRaw as Record<string, unknown>,
      signatureBase64,
      publicKeyBase64,
    );
  } catch (error) {
    // Malformed key/signature bytes must read as a failed verification, not as
    // an opaque crypto stack trace.
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`envelope signature could not be verified: ${message}`);
  }

  if (!signatureValid) {
    throw new Error('envelope signature is INVALID — manifest has been tampered with');
  }

  const manifest = ExportManifestV1Schema.parse(manifestRaw);

  if (!(EXPORT_DATA_FILENAME in manifest.checksums)) {
    throw new Error(`manifest.checksums must include '${EXPORT_DATA_FILENAME}'`);
  }

  for (const [relPath, expectedHash] of Object.entries(manifest.checksums)) {
    const filePath = resolveChecksumPath(root, relPath);
    if (!existsSync(filePath)) {
      throw new Error(`envelope is missing declared file '${relPath}'`);
    }
    await assertPathSafeForHash(root, filePath, relPath, 'file');

    const actualHash = await sha256HexFile(filePath);
    if (actualHash !== expectedHash) {
      throw new Error(
        `checksum mismatch for '${relPath}': expected ${expectedHash}, got ${actualHash}`,
      );
    }
  }

  const attachmentsDir = path.join(root, EXPORT_ATTACHMENTS_DIR);
  if (existsSync(attachmentsDir)) {
    await assertPathSafeForHash(root, attachmentsDir, EXPORT_ATTACHMENTS_DIR, 'directory');
    const onDisk = await readdir(attachmentsDir);
    for (const name of onDisk) {
      const key = `${EXPORT_ATTACHMENTS_DIR}/${name}`;
      const attachmentPath = path.join(attachmentsDir, name);
      await assertPathSafeForHash(root, attachmentPath, key, 'file');
      if (!(key in manifest.checksums)) {
        throw new Error(`unexpected attachment '${key}' is not in manifest.checksums`);
      }
    }
  }

  const dataPath = path.join(root, EXPORT_DATA_FILENAME);
  await assertPathSafeForHash(root, dataPath, EXPORT_DATA_FILENAME, 'file');
  await assertFileWithinBudget(dataPath, budgets.maxDataJsonBytes, EXPORT_DATA_FILENAME);
  const dataRaw = JSON.parse(await readFile(dataPath, 'utf8')) as unknown;
  const data = ExportDataV1Schema.parse(dataRaw);

  return {
    manifest,
    data,
    root,
    rootName,
    unverifiedMembers: collectUnverifiedMembers(topLevelEntries, manifest.checksums),
  };
}

export async function inspectEnvelope(tarballPath: string): Promise<InspectSummary> {
  const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-inspect-'));

  try {
    const { manifest, data, rootName, unverifiedMembers } = await unpackAndVerifyEnvelope({
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
      signature_trust: 'self-signed',
      unverified_members: unverifiedMembers,
    };
  } finally {
    await rm(extractDir, { recursive: true, force: true });
  }
}
