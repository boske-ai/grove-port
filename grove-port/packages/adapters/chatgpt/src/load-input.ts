import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  loadChatGptExportFromBytes,
  type ChatGptExportBundle,
} from './load-input-bytes.js';

export type { ChatGptExportBundle, ChatGptExportUser } from './load-input-bytes.js';
export { loadChatGptExportFromBytes } from './load-input-bytes.js';

export async function loadChatGptExport(inputPath: string): Promise<ChatGptExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadChatGptExportFromBytes(path.basename(inputPath), bytes);
}

export async function loadChatGptConversations(inputPath: string) {
  const bundle = await loadChatGptExport(inputPath);
  return bundle.conversations;
}
