import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadAnythingLlmExportFromBytes, type AnythingLlmExportBundle } from './load-input-bytes.js';

export type { AnythingLlmExportBundle } from './load-input-bytes.js';
export { loadAnythingLlmExportFromBytes } from './load-input-bytes.js';

export async function loadAnythingLlmExport(inputPath: string): Promise<AnythingLlmExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadAnythingLlmExportFromBytes(path.basename(inputPath), bytes);
}
