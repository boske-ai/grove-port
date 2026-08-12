import { unzipSync, type Unzipped } from 'fflate';

/** Default ZIP inflate budgets (fail closed). */
export interface ZipBudgetLimits {
  maxEntries: number;
  maxTotalUncompressedBytes: number;
  maxSingleEntryUncompressedBytes: number;
  /** Reject when totalUncompressed / archiveBytes > this value. */
  maxCompressionRatio: number;
  /** Ratio check applies only when archive compressed size is at least this. */
  minCompressedBytesForRatio: number;
}

export const DEFAULT_ZIP_BUDGET_LIMITS: ZipBudgetLimits = {
  maxEntries: 10_000,
  maxTotalUncompressedBytes: 512 * 1024 * 1024,
  maxSingleEntryUncompressedBytes: 256 * 1024 * 1024,
  maxCompressionRatio: 100,
  minCompressedBytesForRatio: 1 * 1024 * 1024,
};

function resolveLimits(overrides?: Partial<ZipBudgetLimits>): ZipBudgetLimits {
  if (!overrides) {
    return DEFAULT_ZIP_BUDGET_LIMITS;
  }
  return { ...DEFAULT_ZIP_BUDGET_LIMITS, ...overrides };
}

/**
 * Memo of successful inflates, keyed by the backing buffer.
 *
 * The browser flow runs detect → preview → convert against the same cached
 * bytes, and every adapter inflates internally, so one upload used to be
 * decompressed and re-parsed three times. A `WeakMap` keeps this tied to the
 * caller's buffer lifetime: once the worker drops the file, the entry goes too.
 *
 * Only successful results are cached, and the limits are part of the key, so a
 * stricter call can never be served a permissively-inflated archive.
 */
const inflateCache = new WeakMap<ArrayBufferLike, Map<string, Unzipped>>();

function cacheKey(limits: ZipBudgetLimits, byteOffset: number, byteLength: number): string {
  return [
    byteOffset,
    byteLength,
    limits.maxEntries,
    limits.maxTotalUncompressedBytes,
    limits.maxSingleEntryUncompressedBytes,
    limits.maxCompressionRatio,
    limits.minCompressedBytesForRatio,
  ].join(':');
}

/**
 * Inflate a ZIP with entry-count / size / ratio budgets.
 * Over-budget entries throw (never silently skipped).
 */
export function unzipSyncWithBudgets(
  bytes: Uint8Array,
  limits?: Partial<ZipBudgetLimits>,
): Unzipped {
  const resolved = resolveLimits(limits);
  const key = cacheKey(resolved, bytes.byteOffset, bytes.byteLength);
  const cached = inflateCache.get(bytes.buffer)?.get(key);
  if (cached) {
    return cached;
  }

  let entryCount = 0;
  let totalUncompressed = 0;
  const compressedArchiveBytes = bytes.byteLength;

  const result = unzipSync(bytes, {
    filter(file) {
      entryCount += 1;
      if (entryCount > resolved.maxEntries) {
        throw new Error(
          `ZIP entry count exceeds budget (${entryCount} > ${resolved.maxEntries})`,
        );
      }

      // STORED (compression 0): fflate slices by `size`, not `originalSize`.
      // Fail closed on mismatched headers by billing the larger declared size.
      const billedUncompressed = Math.max(file.size, file.originalSize);

      if (billedUncompressed > resolved.maxSingleEntryUncompressedBytes) {
        throw new Error(
          `ZIP entry "${file.name}" exceeds single-entry budget ` +
            `(${billedUncompressed} > ${resolved.maxSingleEntryUncompressedBytes} bytes)`,
        );
      }

      totalUncompressed += billedUncompressed;
      if (totalUncompressed > resolved.maxTotalUncompressedBytes) {
        throw new Error(
          `ZIP total uncompressed bytes exceed budget ` +
            `(${totalUncompressed} > ${resolved.maxTotalUncompressedBytes})`,
        );
      }

      if (
        compressedArchiveBytes >= resolved.minCompressedBytesForRatio &&
        totalUncompressed / compressedArchiveBytes > resolved.maxCompressionRatio
      ) {
        throw new Error(
          `ZIP compression ratio exceeds budget ` +
            `(${totalUncompressed}/${compressedArchiveBytes} > ${resolved.maxCompressionRatio}:1); ` +
            `possible ZIP bomb`,
        );
      }

      return true;
    },
  });

  let perBuffer = inflateCache.get(bytes.buffer);
  if (!perBuffer) {
    perBuffer = new Map<string, Unzipped>();
    inflateCache.set(bytes.buffer, perBuffer);
  }
  perBuffer.set(key, result);

  return result;
}
