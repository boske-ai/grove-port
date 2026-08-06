import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { extract, type ReadEntry } from 'tar';
import { isPathInsideRoot } from './path-safe.js';

const MIB = 1024 * 1024;

/** Default tar extract / data.json budgets (plan Wave 3). */
export const DEFAULT_TAR_EXTRACT_BUDGETS = {
  maxArchiveBytes: 512 * MIB,
  maxEntries: 20_000,
  maxTotalExtractedBytes: 512 * MIB,
  maxDataJsonBytes: 128 * MIB,
  /** manifest.json is canonicalized and signed — keep it small enough to parse safely. */
  maxManifestBytes: 4 * MIB,
} as const;

export type TarExtractBudgets = {
  readonly maxArchiveBytes: number;
  readonly maxEntries: number;
  readonly maxTotalExtractedBytes: number;
  readonly maxDataJsonBytes: number;
  readonly maxManifestBytes: number;
};

/**
 * Refuse tar member paths that could escape `cwd` (defense in depth).
 */
export function assertTarEntryPathSafe(entryPath: string, cwd: string): void {
  if (entryPath.length === 0) {
    throw new Error('tar extract refused: empty entry path');
  }
  if (entryPath.includes('\0')) {
    throw new Error(`tar extract refused: path contains NUL: '${entryPath}'`);
  }
  if (entryPath.includes('\\')) {
    throw new Error(`tar extract refused: path contains backslash: '${entryPath}'`);
  }
  if (path.isAbsolute(entryPath)) {
    throw new Error(`tar extract refused: absolute path: '${entryPath}'`);
  }
  if (entryPath.split('/').some((segment) => segment === '..')) {
    throw new Error(`tar extract refused: path escapes extract dir: '${entryPath}'`);
  }

  const resolved = path.resolve(cwd, entryPath);
  if (!isPathInsideRoot(cwd, resolved)) {
    throw new Error(`tar extract refused: path escapes extract dir: '${entryPath}'`);
  }
}

function assertNotLinkEntry(entry: { type?: string; path?: string }): void {
  if (entry.type === 'SymbolicLink' || entry.type === 'Link') {
    const kind = entry.type === 'SymbolicLink' ? 'symlink' : 'hardlink';
    const label = entry.path && entry.path.length > 0 ? entry.path : '<unknown>';
    throw new Error(`tar extract refused: ${kind} entry not allowed: '${label}'`);
  }
}

/**
 * Extract a `.grove-port` tarball with entry-count / uncompressed-byte budgets.
 * Fail closed: throws on over-budget or unsafe paths (does not skip).
 *
 * Note: node-tar does not call `filter` / `onReadEntry` for PAX / GlobalExtendedHeader
 * meta records. Those are accounted via the parser `meta` / `ignoredEntry` events.
 */
export async function extractTarWithBudgets({
  file,
  cwd,
  budgets = DEFAULT_TAR_EXTRACT_BUDGETS,
}: {
  file: string;
  cwd: string;
  budgets?: TarExtractBudgets;
}): Promise<void> {
  const archiveStat = await stat(file);
  if (archiveStat.size > budgets.maxArchiveBytes) {
    throw new Error(
      `tar extract refused: archive exceeds max size (${archiveStat.size} > ${budgets.maxArchiveBytes} bytes)`,
    );
  }

  let entryCount = 0;
  let totalBytes = 0;
  // node-tar does not reliably reject the extract promise when `filter` throws;
  // capture and rethrow so budgets fail closed with a clear error.
  let refuseError: Error | undefined;
  // Set once the pipeline exists, so the first refusal can tear it down instead
  // of draining the rest of a hostile archive (a 512 MiB budget must not cost
  // hundreds of GiB of gunzip before the error surfaces).
  let stopPipeline: (() => void) | undefined;

  const refuse = (err: unknown): void => {
    if (!refuseError) {
      refuseError = err instanceof Error ? err : new Error(String(err));
    }
    stopPipeline?.();
  };

  const accountEntry = (
    entryPath: string,
    entry: ReadEntry | { size?: number; type?: string },
    options?: { skipPathCheck?: boolean },
  ): boolean => {
    if (refuseError) {
      return false;
    }
    try {
      assertNotLinkEntry({ type: entry.type, path: entryPath });
      if (!options?.skipPathCheck) {
        assertTarEntryPathSafe(entryPath, cwd);
      }

      entryCount += 1;
      if (entryCount > budgets.maxEntries) {
        throw new Error(
          `tar extract refused: too many entries (${entryCount} > ${budgets.maxEntries})`,
        );
      }

      const size = typeof entry.size === 'number' ? entry.size : 0;
      if (!Number.isFinite(size) || size < 0) {
        throw new Error(`tar extract refused: invalid entry size for '${entryPath}'`);
      }

      totalBytes += size;
      if (totalBytes > budgets.maxTotalExtractedBytes) {
        throw new Error(
          `tar extract refused: total extracted size exceeds budget (${totalBytes} > ${budgets.maxTotalExtractedBytes} bytes)`,
        );
      }

      return true;
    } catch (err) {
      refuse(err);
      return false;
    }
  };

  const unpack = extract({
    cwd,
    filter: accountEntry,
    onReadEntry(entry: ReadEntry) {
      // Defense in depth: re-check after header parse (links + path).
      if (refuseError) {
        entry.ignore = true;
        return;
      }
      try {
        assertNotLinkEntry(entry);
        assertTarEntryPathSafe(entry.path, cwd);
      } catch (err) {
        entry.ignore = true;
        refuse(err);
      }
    },
  });

  // PAX / GlobalExtendedHeader: not visible to filter/onReadEntry — count body bytes.
  unpack.on('meta', (meta: string | Buffer) => {
    const size =
      typeof meta === 'string' ? Buffer.byteLength(meta) : meta.byteLength;
    accountEntry('<pax-meta>', { size, type: 'ExtendedHeader' }, { skipPathCheck: true });
  });

  // Oversized meta (above maxMetaEntrySize) skips the meta event — still bill it.
  unpack.on('ignoredEntry', (entry: ReadEntry) => {
    if (entry.meta) {
      accountEntry(entry.path || '<pax-meta>', entry, { skipPathCheck: true });
    }
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const source = createReadStream(file);
      let settled = false;

      const settle = (err?: Error): void => {
        if (settled) {
          return;
        }
        settled = true;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      };

      // Tear down on refusal: stop reading the archive and abort the parser, then
      // settle explicitly. `abort()` does not reliably emit `close` once data is
      // still buffered, so waiting on it would hang on exactly the large hostile
      // archives this teardown exists to cut short.
      stopPipeline = () => {
        source.unpipe(unpack);
        source.destroy();
        try {
          unpack.abort(refuseError ?? new Error('tar extract refused'));
        } catch {
          // abort() is best-effort — the refusal below is what callers see.
        }
        settle(refuseError ?? new Error('tar extract refused'));
      };

      unpack.on('error', settle);
      unpack.on('close', () => settle());
      source.on('error', settle).pipe(unpack);

      // A refusal raised from `filter` during the first synchronous chunk can
      // land before the pipeline was wired — settle it here.
      if (refuseError) {
        stopPipeline();
      }
    });
  } catch (err) {
    if (refuseError) {
      throw refuseError;
    }
    throw err;
  } finally {
    stopPipeline = undefined;
  }

  if (refuseError) {
    throw refuseError;
  }
}

/** Fail closed before `JSON.parse` of any envelope member. */
export async function assertFileWithinBudget(
  filePath: string,
  maxBytes: number,
  label: string,
): Promise<void> {
  const st = await stat(filePath);
  if (st.size > maxBytes) {
    throw new Error(`${label} exceeds max size (${st.size} > ${maxBytes} bytes)`);
  }
}

/** Fail closed before `JSON.parse` of `data.json`. */
export async function assertDataJsonWithinBudget(
  dataPath: string,
  maxBytes: number = DEFAULT_TAR_EXTRACT_BUDGETS.maxDataJsonBytes,
): Promise<void> {
  await assertFileWithinBudget(dataPath, maxBytes, 'data.json');
}
