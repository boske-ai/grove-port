import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import {
  EXPORT_ATTACHMENTS_DIR,
  EXPORT_DATA_FILENAME,
  EXPORT_MANIFEST_FILENAME,
  EXPORT_README_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
} from '@grove-port/schema';

/** Allowed top-level names under the envelope root (fail closed). */
export const ALLOWED_ENVELOPE_TOP_LEVEL = new Set<string>([
  EXPORT_MANIFEST_FILENAME,
  EXPORT_DATA_FILENAME,
  EXPORT_SIGNATURE_FILENAME,
  EXPORT_README_FILENAME,
  EXPORT_ATTACHMENTS_DIR,
]);

/**
 * Returns true when `resolved` is `root` or a path strictly under `root`.
 * Uses `path.resolve` + `path.sep` prefix check (no string-startswith alone).
 */
export function isPathInsideRoot(root: string, resolved: string): boolean {
  const rootResolved = path.resolve(root);
  const candidate = path.resolve(resolved);
  if (candidate === rootResolved) {
    return true;
  }
  return candidate.startsWith(rootResolved + path.sep);
}

/**
 * Validate a manifest checksum key: reject absolute / `..` segment / `\` / NUL,
 * allowlist `data.json` and `attachments/<safe-basename>`, and require the
 * resolved path to stay under envelope `root`.
 *
 * `..` is rejected only as a path segment (after splitting on `/`), so basenames
 * like `foo..bar.jpg` remain valid.
 *
 * @returns absolute path of the file to hash
 */
export function resolveChecksumPath(root: string, checksumKey: string): string {
  if (checksumKey.length === 0) {
    throw new Error('unsafe checksum key: empty');
  }
  if (checksumKey.includes('\0')) {
    throw new Error(`unsafe checksum key: contains NUL: '${checksumKey}'`);
  }
  if (checksumKey.includes('\\')) {
    throw new Error(`unsafe checksum key: contains backslash: '${checksumKey}'`);
  }
  if (checksumKey.split('/').some((segment) => segment === '..')) {
    throw new Error(`unsafe checksum key: contains '..' segment: '${checksumKey}'`);
  }
  if (path.isAbsolute(checksumKey)) {
    throw new Error(`unsafe checksum key: absolute path: '${checksumKey}'`);
  }

  if (checksumKey === EXPORT_DATA_FILENAME || checksumKey === EXPORT_README_FILENAME) {
    // allowed
  } else if (checksumKey.startsWith(`${EXPORT_ATTACHMENTS_DIR}/`)) {
    const basename = checksumKey.slice(EXPORT_ATTACHMENTS_DIR.length + 1);
    if (basename.length === 0) {
      throw new Error(`unsafe checksum key: empty attachment basename: '${checksumKey}'`);
    }
    // Same rule as Node pack.ts: basename only — no path separators in the name.
    if (basename !== path.basename(basename) || basename.includes('/') || basename.includes('\\')) {
      throw new Error(`unsafe checksum key: attachment name must be a safe basename: '${checksumKey}'`);
    }
  } else {
    throw new Error(
      `unsafe checksum key: must be '${EXPORT_DATA_FILENAME}', '${EXPORT_README_FILENAME}', ` +
        `or '${EXPORT_ATTACHMENTS_DIR}/<basename>': '${checksumKey}'`,
    );
  }

  const resolved = path.resolve(root, checksumKey);
  if (!isPathInsideRoot(root, resolved)) {
    throw new Error(`unsafe checksum key: resolves outside envelope root: '${checksumKey}'`);
  }

  return resolved;
}

/** What a verified envelope member is expected to be on disk. */
export type ExpectedMemberKind = 'file' | 'directory';

/**
 * Fail closed before reading/hashing: reject symlinks and paths whose realpath
 * escapes the envelope root (e.g. `attachments/` itself is a symlink).
 *
 * `expect` additionally pins the member kind, so a directory declared as a
 * checksummed file fails validation instead of surfacing a raw `EISDIR` from
 * the hash stream.
 */
export async function assertPathSafeForHash(
  root: string,
  resolved: string,
  label: string,
  expect?: ExpectedMemberKind,
): Promise<void> {
  const st = await lstat(resolved);
  if (st.isSymbolicLink()) {
    throw new Error(`unsafe path: symlink not allowed: '${label}'`);
  }

  if (expect === 'file' && !st.isFile()) {
    throw new Error(`unsafe path: expected a regular file: '${label}'`);
  }
  if (expect === 'directory' && !st.isDirectory()) {
    throw new Error(`unsafe path: expected a directory: '${label}'`);
  }

  // realpath both sides so macOS /tmp → /private/tmp (etc.) does not false-reject.
  const realRoot = await realpath(root);
  const real = await realpath(resolved);
  if (!isPathInsideRoot(realRoot, real)) {
    throw new Error(`unsafe path: real path outside envelope root: '${label}'`);
  }
}
