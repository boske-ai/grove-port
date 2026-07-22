import { afterEach, describe, expect, test } from 'bun:test';
import { gzipSync } from 'fflate';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { create } from 'tar';
import {
  DEFAULT_TAR_EXTRACT_BUDGETS,
  extractTarWithBudgets,
} from './tar-budgets.js';
import { createTarGzip } from './tar-gzip.js';

const temps: string[] = [];

async function tempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

afterEach(async () => {
  while (temps.length > 0) {
    const dir = temps.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

function writeOctal(buf: Uint8Array, offset: number, value: number, length: number): void {
  const s = value.toString(8).padStart(length - 1, '0');
  const bytes = new TextEncoder().encode(s);
  buf.set(bytes.subarray(0, length - 1), offset);
  buf[offset + length - 1] = 0;
}

/** Minimal gzip-tar with one hardlink entry (typeflag '1'). */
async function craftHardlinkTar(staging: string): Promise<string> {
  const name = 'link.txt';
  const linkpath = 'target.txt';
  const header = new Uint8Array(512);
  const enc = new TextEncoder();
  header.set(enc.encode(name), 0);
  writeOctal(header, 100, 0o644, 8);
  writeOctal(header, 108, 0, 8);
  writeOctal(header, 116, 0, 8);
  writeOctal(header, 124, 0, 12);
  writeOctal(header, 136, Math.floor(Date.now() / 1000), 12);
  header[156] = 0x31; // '1' hardlink
  header.set(enc.encode('ustar\0'), 257);
  header.set(enc.encode('00'), 263);
  header.set(enc.encode(linkpath), 157);
  header.fill(0x20, 148, 156);
  let sum = 0;
  for (let i = 0; i < 512; i += 1) sum += header[i]!;
  writeOctal(header, 148, sum, 8);
  header[155] = 0;

  const tar = new Uint8Array(512 + 1024);
  tar.set(header, 0);
  const out = path.join(staging, 'crafted-hardlink.grove-port');
  await writeFile(out, gzipSync(tar));
  return out;
}

describe('extractTarWithBudgets', () => {
  test('rejects when PAX meta entries push entry count over budget', async () => {
    // Long paths force a PAX ExtendedHeader before each file; node-tar skips
    // filter/onReadEntry for those meta records — budgets must still count them.
    const entries = Array.from({ length: 6 }, (_, i) => ({
      path: `${'n'.repeat(160)}-${i}.txt`,
      data: new Uint8Array([1]),
    }));
    const tgz = createTarGzip(entries);
    const staging = await tempDir('grove-port-pax-entries-');
    const tarballPath = path.join(staging, 'pax.grove-port');
    await writeFile(tarballPath, tgz);
    const cwd = await tempDir('grove-port-pax-entries-out-');

    await expect(
      extractTarWithBudgets({
        file: tarballPath,
        cwd,
        budgets: { ...DEFAULT_TAR_EXTRACT_BUDGETS, maxEntries: 10 },
      }),
    ).rejects.toThrow(/too many entries/);
  });

  test('rejects when PAX meta body bytes exceed total extracted budget', async () => {
    const entries = Array.from({ length: 4 }, (_, i) => ({
      path: `${'p'.repeat(200)}-${i}.txt`,
      data: new Uint8Array([1]),
    }));
    const tgz = createTarGzip(entries);
    const staging = await tempDir('grove-port-pax-bytes-');
    const tarballPath = path.join(staging, 'pax-bytes.grove-port');
    await writeFile(tarballPath, tgz);
    const cwd = await tempDir('grove-port-pax-bytes-out-');

    await expect(
      extractTarWithBudgets({
        file: tarballPath,
        cwd,
        budgets: { ...DEFAULT_TAR_EXTRACT_BUDGETS, maxTotalExtractedBytes: 400 },
      }),
    ).rejects.toThrow(/total extracted size exceeds budget/);
  });

  test('rejects SymbolicLink entry types', async () => {
    const staging = await tempDir('grove-port-symlink-type-');
    await writeFile(path.join(staging, 'target.txt'), 'secret\n');
    // Relative symlink so node-tar packs a SymbolicLink entry (not absolute).
    await symlink('target.txt', path.join(staging, 'link.txt'));
    const tarballPath = path.join(staging, 'symlink.grove-port');
    await create(
      { gzip: true, file: tarballPath, cwd: staging, portable: true },
      ['link.txt'],
    );
    const cwd = await tempDir('grove-port-symlink-type-out-');

    await expect(
      extractTarWithBudgets({ file: tarballPath, cwd }),
    ).rejects.toThrow(/symlink|hardlink|link/i);
  });

  test('rejects hardlink (Link) entry types', async () => {
    const staging = await tempDir('grove-port-hardlink-type-');
    const tarballPath = await craftHardlinkTar(staging);
    const cwd = await tempDir('grove-port-hardlink-type-out-');

    await expect(
      extractTarWithBudgets({ file: tarballPath, cwd }),
    ).rejects.toThrow(/symlink|hardlink|link/i);
  });
});
