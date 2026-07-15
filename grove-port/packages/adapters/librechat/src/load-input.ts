import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadLibreChatExportFromBytes, type LibreChatExportBundle } from './load-input-bytes.js';

export type { LibreChatExportBundle } from './load-input-bytes.js';
export { loadLibreChatExportFromBytes } from './load-input-bytes.js';

export async function loadLibreChatExport(inputPath: string): Promise<LibreChatExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadLibreChatExportFromBytes(path.basename(inputPath), bytes);
}
