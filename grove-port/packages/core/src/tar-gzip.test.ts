import { gunzipSync } from 'node:zlib';
import { describe, expect, test } from 'bun:test';
import { createTarGzip } from './tar-gzip.js';

describe('createTarGzip', () => {
  test('never overflows ustar name into mode for multi-byte paths', () => {
    // 40 CJK chars × 3 bytes = 120 UTF-8 bytes — old char-slice then encode spilled into mode
    // until mode was rewritten; assert name field stays ≤100 bytes and mode is intact.
    const cjkName = 'あ'.repeat(40);
    expect(new TextEncoder().encode(cjkName).length).toBeGreaterThan(100);

    const tar = gunzipSync(createTarGzip([{ path: cjkName, data: new Uint8Array([1, 2, 3]) }]));

    // Long single-segment names use PAX ('x') then a stub file header.
    expect(tar[156]).toBe(0x78); // 'x'
    const modeField = tar.subarray(100, 108);
    expect(String.fromCharCode(...modeField)).toMatch(/^0000644/);
  });

  test('packs paths longer than 100 bytes via ustar prefix when possible', () => {
    const longPath = `grove-port-v1/attachments/${'a'.repeat(70)}-日本語.png`;
    expect(new TextEncoder().encode(longPath).length).toBeGreaterThan(100);
    expect(new TextEncoder().encode(`${'a'.repeat(70)}-日本語.png`).length).toBeLessThanOrEqual(100);

    const tar = gunzipSync(
      createTarGzip([{ path: longPath, data: new TextEncoder().encode('payload') }]),
    );
    // ustar (not PAX): typeflag regular file, prefix non-empty at 345
    expect(tar[156]).toBe(0x30); // '0'
    const prefix = tar.subarray(345, 345 + 25);
    expect(String.fromCharCode(...prefix)).toBe('grove-port-v1/attachments');
  });
});
