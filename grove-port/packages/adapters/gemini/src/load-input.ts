import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadGeminiExportFromBytes, type GeminiExportBundle } from './load-input-bytes.js';

export type { GeminiExportBundle } from './load-input-bytes.js';
export { loadGeminiExportFromBytes } from './load-input-bytes.js';

export async function loadGeminiExport(inputPath: string): Promise<GeminiExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadGeminiExportFromBytes(path.basename(inputPath), bytes);
}
