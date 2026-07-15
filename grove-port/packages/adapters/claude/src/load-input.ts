import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ClaudeConversation } from './types.js';
import {
  loadClaudeExportFromBytes,
  type ClaudeExportBundle,
} from './load-input-bytes.js';

export type { ClaudeExportBundle } from './load-input-bytes.js';
export { deriveTitleFromMessages, loadClaudeExportFromBytes } from './load-input-bytes.js';

export async function loadClaudeExport(inputPath: string): Promise<ClaudeExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadClaudeExportFromBytes(path.basename(inputPath), bytes);
}

export async function loadClaudeConversations(inputPath: string): Promise<ClaudeConversation[]> {
  const bundle = await loadClaudeExport(inputPath);
  return bundle.conversations;
}

export function basenameWithoutExt(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}
