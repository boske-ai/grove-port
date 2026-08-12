// NOT FOR PRODUCTION — do not sync converter-web to boske.dev /port or /move.
// Local dev demo only; production /port is a marketing landing in the Boske website repo.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(repoRoot, 'apps/converter-web/dist');
const target = path.join(repoRoot, '../../boske/apps/website/public/move');

if (!existsSync(source)) {
  throw new Error('converter-web dist missing — run `bun run build:web` first');
}

// This script recursively deletes `target`. Before doing that, prove it is the
// directory we think it is: the Boske website repo must exist and `target` must
// be the `public/move` leaf inside it. Without these checks a clone in an
// unexpected location would rm -rf whatever happened to sit at that path.
const websiteRoot = path.join(repoRoot, '../../boske/apps/website');
if (!existsSync(websiteRoot)) {
  throw new Error(
    `refusing to sync: Boske website repo not found at ${websiteRoot}. ` +
      'This dev-only script expects the Boske monorepo as a sibling checkout.',
  );
}
if (!existsSync(path.join(websiteRoot, 'package.json'))) {
  throw new Error(`refusing to sync: ${websiteRoot} does not look like a package (no package.json)`);
}
if (path.basename(target) !== 'move' || path.basename(path.dirname(target)) !== 'public') {
  throw new Error(`refusing to sync: unexpected target path ${target}`);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

console.log(`Synced Grove Port converter to ${target}`);
