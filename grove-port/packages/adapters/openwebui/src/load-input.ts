import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  loadOpenWebUiExportFromBytes,
  type OpenWebUiExportBundle,
} from './load-input-bytes.js';

export type { OpenWebUiExportBundle } from './load-input-bytes.js';
export { loadOpenWebUiExportFromBytes } from './load-input-bytes.js';

export async function loadOpenWebUiExport(inputPath: string): Promise<OpenWebUiExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadOpenWebUiExportFromBytes(path.basename(inputPath), bytes);
}
