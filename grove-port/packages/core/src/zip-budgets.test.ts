import { describe, expect, test } from 'bun:test';
import { strToU8, zipSync } from 'fflate';
import {
  DEFAULT_ZIP_BUDGET_LIMITS,
  unzipSyncWithBudgets,
  type ZipBudgetLimits,
} from './zip-budgets.js';

function limits(overrides: Partial<ZipBudgetLimits>): ZipBudgetLimits {
  return { ...DEFAULT_ZIP_BUDGET_LIMITS, ...overrides };
}

describe('unzipSyncWithBudgets', () => {
  test('inflates a normal small ZIP', () => {
    const zipBytes = zipSync({
      'conversations.json': strToU8('[{"id":"1"}]'),
      'user.json': strToU8('{"email":"a@b.c"}'),
    });

    const entries = unzipSyncWithBudgets(zipBytes);
    expect(Object.keys(entries).sort()).toEqual(['conversations.json', 'user.json']);
    expect(new TextDecoder().decode(entries['conversations.json'])).toBe('[{"id":"1"}]');
  });

  test('rejects when entry count exceeds budget', () => {
    const files: Record<string, Uint8Array> = {};
    for (let i = 0; i < 11; i += 1) {
      files[`f${i}.txt`] = strToU8('');
    }
    const zipBytes = zipSync(files);

    expect(() =>
      unzipSyncWithBudgets(zipBytes, limits({ maxEntries: 10 })),
    ).toThrow(/ZIP entry count|entries/i);
  });

  test('rejects when a single entry exceeds budget', () => {
    const zipBytes = zipSync({
      'big.bin': new Uint8Array(600),
    });

    expect(() =>
      unzipSyncWithBudgets(
        zipBytes,
        limits({ maxSingleEntryUncompressedBytes: 500 }),
      ),
    ).toThrow(/single-entry budget/i);
  });

  test('rejects when total uncompressed exceeds budget', () => {
    const zipBytes = zipSync({
      'a.bin': new Uint8Array(400),
      'b.bin': new Uint8Array(400),
    });

    expect(() =>
      unzipSyncWithBudgets(
        zipBytes,
        limits({ maxTotalUncompressedBytes: 500 }),
      ),
    ).toThrow(/total uncompressed|uncompressed bytes/i);
  });

  test('rejects high compression ratio when compressed size meets threshold', () => {
    // Highly compressible payload → small ZIP, large declared uncompressed.
    const payload = new Uint8Array(50_000);
    const zipBytes = zipSync({ 'zeros.bin': payload });

    expect(zipBytes.byteLength).toBeLessThan(5_000);

    expect(() =>
      unzipSyncWithBudgets(
        zipBytes,
        limits({
          maxCompressionRatio: 5,
          minCompressedBytesForRatio: 100,
        }),
      ),
    ).toThrow(/compression ratio|ZIP bomb/i);
  });

  test('does not apply ratio check below compressed threshold', () => {
    const payload = new Uint8Array(50_000);
    const zipBytes = zipSync({ 'zeros.bin': payload });

    const entries = unzipSyncWithBudgets(
      zipBytes,
      limits({
        maxCompressionRatio: 5,
        minCompressedBytesForRatio: zipBytes.byteLength + 1,
      }),
    );
    expect(entries['zeros.bin']?.byteLength).toBe(50_000);
  });

  test('rejects STORED entry when size exceeds budget but originalSize is tiny', () => {
    // fflate STORED path slices by `size`, not `originalSize` — budgets must use max.
    const payload = new Uint8Array(1_000).fill(0x41);
    const stored = zipSync({ 'big.bin': payload }, { level: 0 });
    const evil = patchZipUncompressedSize(stored, 1);

    expect(() =>
      unzipSyncWithBudgets(
        evil,
        limits({ maxSingleEntryUncompressedBytes: 500 }),
      ),
    ).toThrow(/single-entry budget/i);
  });

  test('rejects STORED total when size (not originalSize) blows the budget', () => {
    const payload = new Uint8Array(800).fill(0x42);
    const stored = zipSync({ 'a.bin': payload }, { level: 0 });
    const evil = patchZipUncompressedSize(stored, 10);

    expect(() =>
      unzipSyncWithBudgets(
        evil,
        limits({ maxTotalUncompressedBytes: 500 }),
      ),
    ).toThrow(/total uncompressed|uncompressed bytes/i);
  });
});

/** Mutate local + central uncompressed-size fields (lie about originalSize). */
function patchZipUncompressedSize(zip: Uint8Array, originalSize: number): Uint8Array {
  const out = new Uint8Array(zip);
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  if (view.getUint32(0, true) !== 0x04034b50) {
    throw new Error('expected local file header at offset 0');
  }
  view.setUint32(22, originalSize, true);
  const nameLen = view.getUint16(26, true);
  const extraLen = view.getUint16(28, true);
  const compSize = view.getUint32(18, true);
  let cd = 30 + nameLen + extraLen + compSize;
  if (view.getUint32(cd, true) !== 0x02014b50) {
    throw new Error('expected central directory header after STORED payload');
  }
  view.setUint32(cd + 24, originalSize, true);
  return out;
}
