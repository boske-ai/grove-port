import { unzipSyncWithBudgets } from '@grove-port/core/browser';
import { strFromU8 } from 'fflate';
import type { MistralConversation, MistralMessage } from './types.js';

export interface MistralExportBundle {
  conversations: MistralConversation[];
}

function parseJsonFile<T>(bytes: Uint8Array, label: string): T {
  try {
    return JSON.parse(strFromU8(bytes)) as T;
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function isMistralMessage(value: unknown): value is MistralMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.chatId === 'string' &&
    typeof record.role === 'string' &&
    typeof record.createdAt === 'string'
  );
}

function normalizeMessageArray(raw: unknown, label: string): MistralConversation {
  if (!Array.isArray(raw)) {
    throw new Error(`${label} must be a JSON array of messages`);
  }
  if (raw.length > 0 && !isMistralMessage(raw[0])) {
    throw new Error(`${label} messages must include id, chatId, role, and createdAt`);
  }
  return raw as MistralConversation;
}

function groupMessagesByChatId(messages: MistralMessage[]): MistralConversation[] {
  const groups = new Map<string, MistralMessage[]>();

  for (const message of messages) {
    const existing = groups.get(message.chatId) ?? [];
    existing.push(message);
    groups.set(message.chatId, existing);
  }

  return [...groups.values()];
}

export function loadMistralExportFromBytes(
  fileName: string,
  archiveOrJsonBytes: Uint8Array,
): MistralExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (lowerPath.endsWith('.zip')) {
    // Retired adapter (ADR 0001), kept as reference only — still routed through
    // the budgeted helper so no unbudgeted inflate path exists in the tree.
    const entries = unzipSyncWithBudgets(archiveOrJsonBytes);
    const chatFiles = Object.entries(entries).filter(([name]) =>
      /(^|\/)chat-[0-9a-f-]+\.json$/i.test(name),
    );

    if (chatFiles.length === 0) {
      throw new Error('Mistral export ZIP must contain chat-{uuid}.json files');
    }

    return {
      conversations: chatFiles.map(([name, bytes]) =>
        normalizeMessageArray(parseJsonFile(bytes, name), name),
      ),
    };
  }

  if (lowerPath.endsWith('.json')) {
    const raw = parseJsonFile<unknown>(archiveOrJsonBytes, fileName);
    if (Array.isArray(raw) && (raw.length === 0 || isMistralMessage(raw[0]))) {
      return { conversations: groupMessagesByChatId(raw as MistralMessage[]) };
    }
    throw new Error('Mistral JSON must be an array of messages with chatId fields');
  }

  throw new Error('Input must be chat-{uuid}.json or a Mistral export .zip');
}
