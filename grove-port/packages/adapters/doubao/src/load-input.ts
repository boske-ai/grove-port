import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadDoubaoExportFromBytes, type DoubaoExportBundle } from './load-input-bytes.js';

export type { DoubaoExportBundle } from './load-input-bytes.js';
export { loadDoubaoExportFromBytes } from './load-input-bytes.js';

export async function loadDoubaoExport(inputPath: string): Promise<DoubaoExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadDoubaoExportFromBytes(path.basename(inputPath), bytes);
}
