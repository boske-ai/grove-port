import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadLobeChatExportFromBytes, type LobeChatExportBundle } from './load-input-bytes.js';

export type { LobeChatExportBundle } from './load-input-bytes.js';
export { loadLobeChatExportFromBytes } from './load-input-bytes.js';

export async function loadLobeChatExport(inputPath: string): Promise<LobeChatExportBundle> {
  const bytes = new Uint8Array(await readFile(inputPath));
  return loadLobeChatExportFromBytes(path.basename(inputPath), bytes);
}
