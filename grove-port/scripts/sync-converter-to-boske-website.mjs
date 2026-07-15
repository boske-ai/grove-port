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

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

console.log(`Synced Grove Port converter to ${target}`);
