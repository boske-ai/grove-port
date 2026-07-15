import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { MistralConversation } from './types.js';
import {
  loadMistralExportFromBytes,
  type MistralExportBundle,
} from './load-input-bytes.js';

export type { MistralExportBundle } from './load-input-bytes.js';
export { loadMistralExportFromBytes } from './load-input-bytes.js';

export async function loadMistralExport(inputPath: string): Promise<MistralExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadMistralExportFromBytes(path.basename(inputPath), bytes);
}

export async function loadMistralConversations(inputPath: string): Promise<MistralConversation[]> {
  const bundle = await loadMistralExport(inputPath);
  return bundle.conversations;
}
