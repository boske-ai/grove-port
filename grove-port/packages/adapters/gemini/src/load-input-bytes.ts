import { unzipSyncWithBudgets } from '@grove-port/core/browser';
import { strFromU8 } from 'fflate';
import {
  extractConversationIdFromTitleUrl,
  formatConversationMessage,
  parseActivityMessages,
} from './format-message.js';
import {
  GEMS_ONLY_EXPORT_MESSAGE,
  type GeminiActivityEntry,
  type GeminiConversationExport,
  type GeminiParsedConversation,
} from './types.js';

export interface GeminiExportBundle {
  conversations: GeminiParsedConversation[];
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

function isActivityEntry(value: unknown): value is GeminiActivityEntry {
  return isRecord(value) && (typeof value.titleUrl === 'string' || Array.isArray(value.details));
}

function isGeminiConversation(value: unknown): value is GeminiConversationExport {
  return isRecord(value) && Array.isArray(value.messages);
}

function normalizeZipPath(name: string): string {
  return name.replace(/\\/g, '/');
}

function detectGemsOnlyExport(entryNames: string[]): boolean {
  const normalized = entryNames.map(normalizeZipPath);
  const hasActivity = normalized.some((name) => /myactivity\.json$/i.test(name));
  const hasConversations = normalized.some((name) => /conversations\.json$/i.test(name));
  const hasPerConversationJson = normalized.some(
    (name) =>
      /(^|\/)gemini(?: apps)?\/.+\.json$/i.test(name) &&
      !/myactivity\.json$/i.test(name) &&
      !/gems[-_]?config/i.test(name) &&
      !/config\.json$/i.test(name),
  );

  if (hasActivity || hasConversations || hasPerConversationJson) {
    return false;
  }

  return normalized.some((name) => /(^|\/)gemini(?:\/|$)/i.test(name));
}

function loadActivityLog(entries: Record<string, Uint8Array>): GeminiParsedConversation[] {
  const activityEntries = Object.entries(entries).filter(([name]) =>
    normalizeZipPath(name).toLowerCase().includes('myactivity.json'),
  );

  if (activityEntries.length === 0) {
    throw new Error('Gemini Takeout ZIP is missing MyActivity.json');
  }

  const sortedEntries = [...activityEntries].sort(([leftName], [rightName]) => {
    const leftGemini = /gemini apps/i.test(normalizeZipPath(leftName)) ? 0 : 1;
    const rightGemini = /gemini apps/i.test(normalizeZipPath(rightName)) ? 0 : 1;
    return leftGemini - rightGemini;
  });

  const grouped = new Map<string, GeminiParsedConversation>();

  for (const [entryName, entryBytes] of sortedEntries) {
    const raw = parseJsonFile<unknown>(entryBytes, entryName);
    if (!Array.isArray(raw)) {
      throw new Error('Gemini MyActivity.json must be an array of activity entries');
    }

    for (const item of raw) {
      if (!isActivityEntry(item)) {
        continue;
      }

      const conversationId = extractConversationIdFromTitleUrl(item.titleUrl);
      if (!conversationId) {
        continue;
      }

      const messages = parseActivityMessages(item);
      if (messages.length === 0) {
        continue;
      }

      const existing = grouped.get(conversationId) ?? {
        sourceConversationId: conversationId,
        title: item.title?.trim() || 'Untitled Gemini conversation',
        messages: [],
      };

      existing.messages.push(...messages);
      grouped.set(conversationId, existing);
    }
  }

  return [...grouped.values()].filter((conversation) => conversation.messages.length > 0);
}

function loadConversationsJson(entries: Record<string, Uint8Array>): GeminiParsedConversation[] {
  const conversationsEntry = Object.entries(entries).find(([name]) =>
    normalizeZipPath(name).toLowerCase().endsWith('conversations.json'),
  );

  if (!conversationsEntry) {
    throw new Error('Gemini Takeout ZIP is missing conversations.json');
  }

  const [entryName, entryBytes] = conversationsEntry;
  const raw = parseJsonFile<unknown>(entryBytes, entryName);
  const conversations = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.conversations)
      ? raw.conversations
      : null;

  if (!conversations) {
    throw new Error('Gemini conversations.json must contain a conversations array');
  }

  return conversations
    .filter(isGeminiConversation)
    .map((conversation, index) => ({
      sourceConversationId: conversation.id?.trim() || `gemini-conversation-${index + 1}`,
      title: conversation.title?.trim() || 'Untitled Gemini conversation',
      messages: conversation.messages
        .map((message) => {
          const text = formatConversationMessage(message);
          if (!text) {
            return null;
          }

          const role = message.role === 'user' ? 'user' : 'assistant';
          return {
            role: role as 'user' | 'assistant',
            text,
            createdAt: message.timestamp ?? message.createTime,
          };
        })
        .filter((message): message is NonNullable<typeof message> => Boolean(message)),
    }))
    .filter((conversation) => conversation.messages.length > 0);
}

function loadPerConversationFiles(entries: Record<string, Uint8Array>): GeminiParsedConversation[] {
  const jsonFiles = Object.entries(entries).filter(([name]) => {
    const normalized = normalizeZipPath(name).toLowerCase();
    return (
      normalized.endsWith('.json') &&
      !normalized.endsWith('myactivity.json') &&
      !normalized.endsWith('conversations.json') &&
      /(^|\/)gemini(?: apps)?\//.test(normalized)
    );
  });

  if (jsonFiles.length === 0) {
    throw new Error('Gemini Takeout ZIP does not contain a recognized Gemini Apps layout');
  }

  return jsonFiles
    .map(([name, bytes], index) => {
      const conversation = parseJsonFile<GeminiConversationExport>(bytes, name);
      if (!isGeminiConversation(conversation)) {
        throw new Error(`${name} must be a Gemini conversation JSON export with messages[]`);
      }

      return {
        sourceConversationId: conversation.id?.trim() || `gemini-file-${index + 1}`,
        title: conversation.title?.trim() || 'Untitled Gemini conversation',
        messages: conversation.messages
          .map((message) => {
            const text = formatConversationMessage(message);
            if (!text) {
              return null;
            }

            const role = message.role === 'user' ? 'user' : 'assistant';
            return {
              role: role as 'user' | 'assistant',
              text,
              createdAt: message.timestamp ?? message.createTime,
            };
          })
          .filter((message): message is NonNullable<typeof message> => Boolean(message)),
      };
    })
    .filter((conversation) => conversation.messages.length > 0);
}

function detectLayout(entryNames: string[]): 'activity' | 'conversations' | 'files' {
  const normalized = entryNames.map(normalizeZipPath);

  if (normalized.some((name) => name.toLowerCase().includes('myactivity.json'))) {
    return 'activity';
  }

  if (normalized.some((name) => name.toLowerCase().endsWith('conversations.json'))) {
    return 'conversations';
  }

  if (normalized.some((name) => /(^|\/)gemini(?: apps)?\/.+\.json$/i.test(name))) {
    return 'files';
  }

  throw new Error('Gemini Takeout ZIP does not contain a recognized Gemini Apps layout');
}

export function loadGeminiExportFromBytes(
  fileName: string,
  archiveBytes: Uint8Array,
): GeminiExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (!lowerPath.endsWith('.zip')) {
    throw new Error('Gemini input must be a Google Takeout .zip archive');
  }

  const entries = unzipSyncWithBudgets(archiveBytes);
  const entryNames = Object.keys(entries);

  if (detectGemsOnlyExport(entryNames)) {
    throw new Error(GEMS_ONLY_EXPORT_MESSAGE);
  }

  const layout = detectLayout(entryNames);
  const conversations =
    layout === 'activity'
      ? loadActivityLog(entries)
      : layout === 'conversations'
        ? loadConversationsJson(entries)
        : loadPerConversationFiles(entries);

  if (conversations.length === 0) {
    throw new Error('Gemini Takeout ZIP contains no importable conversations');
  }

  return { conversations };
}
