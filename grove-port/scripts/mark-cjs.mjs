// Mark dist/cjs as CommonJS.
//
// The packages are `"type": "module"`, so without this Node reads the .js
// files under dist/cjs/ as ESM and a `require()` from a CommonJS consumer
// (the Boske backend) fails. A nested package.json scopes the format to
// that directory only.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = process.argv[2];
if (!pkg) {
  throw new Error('usage: mark-cjs.mjs <package-dir-name>');
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packages', pkg, 'dist', 'cjs');
if (!existsSync(root)) {
  mkdirSync(root, { recursive: true });
}
writeFileSync(path.join(root, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
console.log(`marked ${pkg}/dist/cjs as commonjs`);
