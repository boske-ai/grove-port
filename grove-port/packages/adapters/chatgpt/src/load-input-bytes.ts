import { unzipSyncWithBudgets } from '@grove-port/core/browser';
import { strFromU8 } from 'fflate';
import type { ChatGptConversation } from './types.js';

export interface ChatGptExportUser {
  email?: string;
  id?: string;
}

export interface ChatGptExportBundle {
  conversations: ChatGptConversation[];
  user?: ChatGptExportUser;
  assetFileNames: Record<string, string>;
  assetFileBytes: Record<string, Uint8Array>;
}

function parseConversationsArray(raw: unknown): ChatGptConversation[] {
  if (!Array.isArray(raw)) {
    throw new Error('ChatGPT export must be a JSON array of conversations');
  }
  return raw as ChatGptConversation[];
}

function zipBaseName(entryName: string): string {
  const normalized = entryName.replace(/\\/g, '/');
  const segments = normalized.split('/');
  return segments[segments.length - 1] ?? normalized;
}

function isMainConversationsEntry(entryName: string): boolean {
  return zipBaseName(entryName).toLowerCase() === 'conversations.json';
}

function isShardedConversationsEntry(entryName: string): boolean {
  return /^conversations-\d+\.json$/i.test(zipBaseName(entryName));
}

function shardSortKey(entryName: string): number {
  const match = /^conversations-(\d+)\.json$/i.exec(zipBaseName(entryName));
  return match ? Number.parseInt(match[1]!, 10) : Number.MAX_SAFE_INTEGER;
}

function resolveConversationEntryNames(entryNames: string[]): string[] {
  const mainEntry = entryNames.find(isMainConversationsEntry);
  if (mainEntry) {
    return [mainEntry];
  }

  const shardEntries = entryNames.filter(isShardedConversationsEntry);
  if (shardEntries.length > 0) {
    return [...shardEntries].sort((left, right) => shardSortKey(left) - shardSortKey(right));
  }

  return [];
}

function readZipEntry(entries: Record<string, Uint8Array>, name: string): unknown | undefined {
  const entry = entries[name];
  if (!entry) {
    return undefined;
  }
  return JSON.parse(strFromU8(entry)) as unknown;
}

function resolveAssetFileNames(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw as Record<string, string>;
}

function resolveExportUser(raw: unknown): ChatGptExportUser | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const record = raw as Record<string, unknown>;
  return {
    email: typeof record.email === 'string' ? record.email : undefined,
    id: typeof record.id === 'string' ? record.id : undefined,
  };
}

function loadConversationsFromZipEntries(
  entries: Record<string, Uint8Array>,
  conversationEntryNames: string[],
): ChatGptConversation[] {
  const conversations: ChatGptConversation[] = [];

  for (const entryName of conversationEntryNames) {
    const entry = entries[entryName];
    if (!entry) {
      throw new Error(`ChatGPT export ZIP is missing ${entryName} bytes`);
    }

    const raw = JSON.parse(strFromU8(entry)) as unknown;
    conversations.push(...parseConversationsArray(raw));
  }

  return conversations;
}

export function loadChatGptExportFromBytes(
  fileName: string,
  archiveOrJsonBytes: Uint8Array,
): ChatGptExportBundle {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.json')) {
    const raw = JSON.parse(strFromU8(archiveOrJsonBytes)) as unknown;
    return {
      conversations: parseConversationsArray(raw),
      assetFileNames: {},
      assetFileBytes: {},
    };
  }

  if (lower.endsWith('.zip')) {
    const entries = unzipSyncWithBudgets(archiveOrJsonBytes);
    const entryNames = Object.keys(entries);
    const conversationEntryNames = resolveConversationEntryNames(entryNames);

    if (conversationEntryNames.length === 0) {
      throw new Error(
        'ChatGPT export ZIP must contain conversations.json or conversations-*.json shards',
      );
    }

    const assetFileNames = resolveAssetFileNames(
      readZipEntry(entries, 'conversation_asset_file_names.json'),
    );

    const assetFileBytes: Record<string, Uint8Array> = {};
    for (const [entryName, entryBytes] of Object.entries(entries)) {
      if (entryName.endsWith('.dat')) {
        assetFileBytes[entryName] = entryBytes;
      }
    }

    return {
      conversations: loadConversationsFromZipEntries(entries, conversationEntryNames),
      user: resolveExportUser(readZipEntry(entries, 'user.json')),
      assetFileNames,
      assetFileBytes,
    };
  }

  throw new Error('Input must be conversations.json or a ChatGPT export .zip');
}
