import { unzipSyncWithBudgets } from '@grove-port/core/browser';
import { strFromU8 } from 'fflate';
import type { LibreChatConversationExport } from './types.js';

export interface LibreChatExportBundle {
  conversations: LibreChatConversationExport[];
}

function parseJsonFile<T>(bytes: Uint8Array, label: string): T {
  try {
    return JSON.parse(strFromU8(bytes)) as T;
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function isLibreChatConversation(value: unknown): value is LibreChatConversationExport {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const hasMessages = Array.isArray(record.messages);
  const hasTree = Array.isArray(record.messagesTree);
  const hasConversationId = typeof record.conversationId === 'string';

  return hasConversationId && (hasMessages || hasTree);
}

function normalizeConversation(raw: unknown, label: string): LibreChatConversationExport {
  if (!isLibreChatConversation(raw)) {
    throw new Error(
      `${label} must be a LibreChat conversation export with conversationId and messages or messagesTree`,
    );
  }

  return raw;
}

export function loadLibreChatExportFromBytes(
  fileName: string,
  archiveOrJsonBytes: Uint8Array,
): LibreChatExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (lowerPath.endsWith('.zip')) {
    const entries = unzipSyncWithBudgets(archiveOrJsonBytes);
    const jsonFiles = Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith('.json'));

    if (jsonFiles.length === 0) {
      throw new Error('LibreChat export ZIP must contain .json conversation files');
    }

    const conversations = jsonFiles
      .map(([name, bytes]) => normalizeConversation(parseJsonFile(bytes, name), name))
      .filter((conversation) => {
        const messageCount =
          (conversation.messages?.length ?? 0) + (conversation.messagesTree?.length ?? 0);
        return messageCount > 0;
      });

    if (conversations.length === 0) {
      throw new Error('LibreChat export ZIP contains no importable conversations');
    }

    return { conversations };
  }

  if (lowerPath.endsWith('.json')) {
    const raw = parseJsonFile<unknown>(archiveOrJsonBytes, fileName);

    if (Array.isArray(raw)) {
      const conversations = raw
        .map((item, index) => normalizeConversation(item, `${fileName}[${index}]`))
        .filter((conversation) => {
          const messageCount =
            (conversation.messages?.length ?? 0) + (conversation.messagesTree?.length ?? 0);
          return messageCount > 0;
        });

      if (conversations.length === 0) {
        throw new Error('LibreChat JSON array contains no importable conversations');
      }

      return { conversations };
    }

    return {
      conversations: [normalizeConversation(raw, fileName)],
    };
  }

  throw new Error('Input must be a LibreChat .json export or .zip of conversation JSON files');
}
