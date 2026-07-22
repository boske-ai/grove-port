import { unzipSyncWithBudgets } from '@grove-port/core/browser';
import { strFromU8 } from 'fflate';
import type { DeepSeekConversationExport } from './types.js';

export interface DeepSeekExportBundle {
  conversations: DeepSeekConversationExport[];
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

function isDeepSeekConversation(value: unknown): value is DeepSeekConversationExport {
  if (!isRecord(value) || !isRecord(value.mapping)) {
    return false;
  }

  return Object.values(value.mapping).some(
    (node) =>
      isRecord(node) &&
      typeof node.id === 'string' &&
      isRecord(node.fragment) &&
      typeof node.fragment.type === 'string',
  );
}

function normalizeConversation(raw: unknown, label: string): DeepSeekConversationExport {
  if (!isDeepSeekConversation(raw)) {
    throw new Error(
      `${label} must be a DeepSeek conversation export with a mapping graph of fragments`,
    );
  }

  return raw;
}

function loadConversationsFromJson(raw: unknown, label: string): DeepSeekConversationExport[] {
  if (Array.isArray(raw)) {
    return raw.map((item, index) => normalizeConversation(item, `${label}[${index}]`));
  }

  return [normalizeConversation(raw, label)];
}

export function loadDeepSeekExportFromBytes(
  fileName: string,
  archiveOrJsonBytes: Uint8Array,
): DeepSeekExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (lowerPath.endsWith('.zip')) {
    const entries = unzipSyncWithBudgets(archiveOrJsonBytes);
    const conversationsEntry = Object.entries(entries).find(([name]) =>
      name.toLowerCase().endsWith('conversations.json'),
    );

    if (!conversationsEntry) {
      throw new Error('DeepSeek export ZIP must contain conversations.json');
    }

    const [entryName, entryBytes] = conversationsEntry;
    const raw = parseJsonFile<unknown>(entryBytes, entryName);
    const conversations = loadConversationsFromJson(raw, entryName).filter((conversation) =>
      Object.keys(conversation.mapping).length > 0,
    );

    if (conversations.length === 0) {
      throw new Error('DeepSeek export ZIP contains no importable conversations');
    }

    return { conversations };
  }

  if (lowerPath.endsWith('.json')) {
    const raw = parseJsonFile<unknown>(archiveOrJsonBytes, fileName);
    const conversations = loadConversationsFromJson(raw, fileName).filter((conversation) =>
      Object.keys(conversation.mapping).length > 0,
    );

    if (conversations.length === 0) {
      throw new Error('DeepSeek export contains no importable conversations');
    }

    return { conversations };
  }

  throw new Error('Input must be a DeepSeek .json export or .zip containing conversations.json');
}
