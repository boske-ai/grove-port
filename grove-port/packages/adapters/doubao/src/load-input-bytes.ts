import { unzipSyncWithBudgets } from '@grove-port/core/browser';
import { strFromU8 } from 'fflate';
import type { DoubaoConversationExport, DoubaoMetadata } from './types.js';
import { formatMessageText } from './format-message.js';

export interface DoubaoExportBundle {
  conversations: DoubaoConversationExport[];
}

function parseJsonFile<T>(bytes: Uint8Array, label: string): T {
  try {
    return JSON.parse(strFromU8(bytes)) as T;
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDoubaoConversation(value: unknown): value is DoubaoConversationExport {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    return false;
  }

  return value.messages.some(
    (message) => isRecord(message) && typeof message.role === 'string',
  );
}

function normalizeConversation(raw: unknown, label: string): DoubaoConversationExport {
  if (!isDoubaoConversation(raw)) {
    throw new Error(`${label} must be a Doubao conversation export with messages[]`);
  }

  return raw;
}

function resolveSessionPath(session: DoubaoMetadata['sessions'][number]): string | undefined {
  return session.export_path?.trim() || session.path?.trim();
}

function findConversationJson(entries: Record<string, Uint8Array>, sessionPath: string): string | undefined {
  const normalized = sessionPath.replace(/\\/g, '/').replace(/^\.\//, '');
  const candidates = [
    normalized,
    `${normalized}.json`,
    normalized.endsWith('.json') ? normalized : undefined,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const exact = entries[candidate];
    if (exact) {
      return candidate;
    }

    const match = Object.keys(entries).find((name) => name.replace(/\\/g, '/').endsWith(candidate));
    if (match) {
      return match;
    }
  }

  return undefined;
}

function loadFromMetadata(entries: Record<string, Uint8Array>): DoubaoConversationExport[] {
  const metadataEntry = Object.entries(entries).find(([name]) =>
    name.toLowerCase().endsWith('metadata.json'),
  );

  if (!metadataEntry) {
    throw new Error('Doubao export ZIP must contain metadata.json');
  }

  const [metadataName, metadataBytes] = metadataEntry;
  const metadata = parseJsonFile<DoubaoMetadata>(metadataBytes, metadataName);

  if (!Array.isArray(metadata.sessions) || metadata.sessions.length === 0) {
    throw new Error('Doubao metadata.json must include a non-empty sessions array');
  }

  const conversations: DoubaoConversationExport[] = [];

  for (const session of metadata.sessions) {
    const sessionPath = resolveSessionPath(session);
    if (!sessionPath) {
      throw new Error(`Doubao session ${session.session_id} is missing export_path in metadata.json`);
    }

    const jsonPath = findConversationJson(entries, sessionPath);
    if (!jsonPath) {
      throw new Error(`Doubao export ZIP is missing conversation JSON for session ${session.session_id}`);
    }

    const conversation = normalizeConversation(parseJsonFile(entries[jsonPath]!, jsonPath), jsonPath);
    conversations.push({
      ...conversation,
      session_id: conversation.session_id ?? session.session_id,
      title: conversation.title ?? session.title,
    });
  }

  return conversations.filter((conversation) =>
    conversation.messages.some((message) => Boolean(formatMessageText(message))),
  );
}

function loadFromChatFolders(entries: Record<string, Uint8Array>): DoubaoConversationExport[] {
  const jsonFiles = Object.entries(entries).filter(
    ([name]) => /(^|\/)chat_[^/]+\/.+\.json$/i.test(name.replace(/\\/g, '/')),
  );

  if (jsonFiles.length === 0) {
    throw new Error('Doubao export ZIP must contain metadata.json or chat_*/conversation JSON files');
  }

  return jsonFiles
    .map(([name, bytes]) => normalizeConversation(parseJsonFile(bytes, name), name))
    .filter((conversation) => conversation.messages.some((message) => Boolean(formatMessageText(message))));
}

export function loadDoubaoExportFromBytes(
  fileName: string,
  archiveBytes: Uint8Array,
): DoubaoExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (!lowerPath.endsWith('.zip')) {
    throw new Error('Doubao input must be a bulk export .zip archive');
  }

  const entries = unzipSyncWithBudgets(archiveBytes);
  const hasMetadata = Object.keys(entries).some((name) => name.toLowerCase().endsWith('metadata.json'));

  const conversations = hasMetadata ? loadFromMetadata(entries) : loadFromChatFolders(entries);

  if (conversations.length === 0) {
    throw new Error('Doubao export ZIP contains no importable conversations');
  }

  return { conversations };
}
