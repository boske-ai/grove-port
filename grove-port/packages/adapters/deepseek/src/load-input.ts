import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadDeepSeekExportFromBytes, type DeepSeekExportBundle } from './load-input-bytes.js';

export type { DeepSeekExportBundle } from './load-input-bytes.js';
export { loadDeepSeekExportFromBytes } from './load-input-bytes.js';

export async function loadDeepSeekExport(inputPath: string): Promise<DeepSeekExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadDeepSeekExportFromBytes(path.basename(inputPath), bytes);
}
