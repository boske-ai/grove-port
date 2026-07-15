import { strFromU8, unzipSync } from 'fflate';
import type { ClaudeConversation, ClaudeExportUser } from './types.js';

export interface ClaudeExportBundle {
  conversations: ClaudeConversation[];
  user?: ClaudeExportUser;
}

function parseJsonFile<T>(bytes: Uint8Array, label: string): T {
  const text = strFromU8(bytes);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function isClaudeConversation(value: unknown): value is ClaudeConversation {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.uuid === 'string' &&
    typeof record.name === 'string' &&
    Array.isArray(record.chat_messages)
  );
}

function normalizeConversations(raw: unknown): ClaudeConversation[] {
  if (!Array.isArray(raw)) {
    throw new Error('Claude export must be a JSON array of conversations');
  }

  if (raw.length === 0) {
    return [];
  }

  if (!isClaudeConversation(raw[0])) {
    throw new Error('Claude export array items must include uuid, name, and chat_messages');
  }

  return raw as ClaudeConversation[];
}

export function loadClaudeExportFromBytes(
  fileName: string,
  archiveOrJsonBytes: Uint8Array,
): ClaudeExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (lowerPath.endsWith('.zip')) {
    const entries = unzipSync(archiveOrJsonBytes);
    const conversationsEntry = Object.entries(entries).find(([name]) =>
      name.endsWith('conversations.json'),
    );

    if (!conversationsEntry) {
      throw new Error('Claude export ZIP must contain conversations.json');
    }

    const conversations = normalizeConversations(
      parseJsonFile(conversationsEntry[1], 'conversations.json'),
    );
    const userEntry = Object.entries(entries).find(([name]) => name.endsWith('users.json'));
    const user = userEntry
      ? (parseJsonFile<ClaudeExportUser[]>(userEntry[1], 'users.json')[0] ?? undefined)
      : undefined;

    return { conversations, user };
  }

  if (lowerPath.endsWith('.json')) {
    const raw = JSON.parse(strFromU8(archiveOrJsonBytes)) as unknown;
    return { conversations: normalizeConversations(raw) };
  }

  throw new Error('Input must be conversations.json or a Claude export .zip');
}

export function deriveTitleFromMessages(firstUserText: string | undefined): string {
  if (!firstUserText?.trim()) {
    return 'Untitled Claude conversation';
  }
  const trimmed = firstUserText.trim();
  return trimmed.length <= 50 ? trimmed : `${trimmed.slice(0, 50).trim()}...`;
}
