import { mkdir, mkdtemp, symlink, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import {
  assertPathSafeForHash,
  resolveChecksumPath,
} from './path-safe.js';

describe('resolveChecksumPath', () => {
  test('accepts attachments basename containing `..` substring', () => {
    const root = path.resolve('/tmp/grove-port-envelope-root');
    const resolved = resolveChecksumPath(root, 'attachments/foo..bar.jpg');
    expect(resolved).toBe(path.resolve(root, 'attachments/foo..bar.jpg'));
  });

  test('rejects `..` as a path segment', () => {
    const root = path.resolve('/tmp/grove-port-envelope-root');
    expect(() => resolveChecksumPath(root, '../outside.txt')).toThrow(/unsafe checksum key/);
    expect(() => resolveChecksumPath(root, 'attachments/../outside.txt')).toThrow(
      /unsafe checksum key/,
    );
  });
});

describe('assertPathSafeForHash', () => {
  test('rejects symlink file pointing outside the envelope root', async () => {
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-symlink-'));
    const outsideDir = await mkdtemp(path.join(tmpdir(), 'grove-port-outside-'));
    try {
      const root = path.join(extractDir, 'root');
      const attachmentsDir = path.join(root, 'attachments');
      await mkdir(attachmentsDir, { recursive: true });
      const outsideFile = path.join(outsideDir, 'secret.txt');
      await writeFile(outsideFile, 'secret\n');
      const linkPath = path.join(attachmentsDir, 'leak.txt');
      await symlink(outsideFile, linkPath);

      await expect(assertPathSafeForHash(root, linkPath, 'attachments/leak.txt')).rejects.toThrow(
        /symlink|outside/,
      );
    } finally {
      await rm(extractDir, { recursive: true, force: true });
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  test('rejects attachments directory that is a symlink', async () => {
    const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-symlink-dir-'));
    const outsideDir = await mkdtemp(path.join(tmpdir(), 'grove-port-outside-dir-'));
    try {
      const root = path.join(extractDir, 'root');
      await mkdir(root, { recursive: true });
      await writeFile(path.join(outsideDir, 'secret.txt'), 'secret\n');
      const attachmentsDir = path.join(root, 'attachments');
      await symlink(outsideDir, attachmentsDir);

      await expect(assertPathSafeForHash(root, attachmentsDir, 'attachments')).rejects.toThrow(
        /symlink|outside/,
      );
    } finally {
      await rm(extractDir, { recursive: true, force: true });
      await rm(outsideDir, { recursive: true, force: true });
    }
  });
});
