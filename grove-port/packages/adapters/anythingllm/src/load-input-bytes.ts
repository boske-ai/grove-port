import { unzipSyncWithBudgets } from '@grove-port/core/browser';
import { strFromU8 } from 'fflate';
import type { AnythingLlmChatLog, AnythingLlmConversation } from './types.js';
import { conversationKeyForLog, conversationTitle } from './format-message.js';

export interface AnythingLlmExportBundle {
  conversations: AnythingLlmConversation[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAnythingLlmChatLog(value: unknown): value is AnythingLlmChatLog {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (typeof value.id === 'number' || typeof value.id === 'string') &&
    typeof value.prompt === 'string' &&
    typeof value.response === 'string' &&
    (typeof value.sent_at === 'number' || typeof value.sent_at === 'string')
  );
}

function parseJsonLines(text: string, label: string): AnythingLlmChatLog[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error(`${label} JSONL export is empty`);
  }

  const logs: AnythingLlmChatLog[] = [];
  for (const [index, line] of lines.entries()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      throw new Error(`Invalid JSON on line ${index + 1} of ${label}`);
    }

    if (!isAnythingLlmChatLog(parsed)) {
      throw new Error(
        `Line ${index + 1} of ${label} must include id, prompt, response, and sent_at`,
      );
    }

    logs.push(parsed);
  }

  return logs;
}

function groupLogs(logs: AnythingLlmChatLog[]): AnythingLlmConversation[] {
  const grouped = new Map<string, AnythingLlmChatLog[]>();

  for (const log of logs) {
    const key = conversationKeyForLog(log);
    const existing = grouped.get(key) ?? [];
    existing.push(log);
    grouped.set(key, existing);
  }

  return [...grouped.entries()].map(([conversationKey, groupedLogs]) => {
    const sorted = [...groupedLogs].sort((left, right) => {
      const leftTime = new Date(left.sent_at).getTime();
      const rightTime = new Date(right.sent_at).getTime();
      return leftTime - rightTime;
    });

    return {
      conversationKey,
      title: conversationTitle(sorted),
      workspaceName: sorted[0]?.workspace_name?.trim() || 'default',
      logs: sorted,
    };
  });
}

function loadFromJsonBytes(fileName: string, bytes: Uint8Array): AnythingLlmExportBundle {
  const raw = JSON.parse(strFromU8(bytes)) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error('AnythingLLM JSON export must be an array of chat logs');
  }

  if (raw.length === 0) {
    throw new Error('AnythingLLM JSON export is empty');
  }

  if (!isAnythingLlmChatLog(raw[0])) {
    throw new Error(
      'AnythingLLM export items must include id, prompt, response, and sent_at fields',
    );
  }

  const logs = raw.filter(isAnythingLlmChatLog);
  if (logs.length === 0) {
    throw new Error('AnythingLLM JSON export contains no importable chat logs');
  }

  return { conversations: groupLogs(logs) };
}

export function loadAnythingLlmExportFromBytes(
  fileName: string,
  bytes: Uint8Array,
): AnythingLlmExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (lowerPath.endsWith('.jsonl')) {
    const logs = parseJsonLines(strFromU8(bytes), fileName);
    return { conversations: groupLogs(logs) };
  }

  if (lowerPath.endsWith('.json')) {
    return loadFromJsonBytes(fileName, bytes);
  }

  if (lowerPath.endsWith('.zip')) {
    const entries = unzipSyncWithBudgets(bytes);
    const jsonlEntry = Object.entries(entries).find(([name]) => name.toLowerCase().endsWith('.jsonl'));
    if (jsonlEntry) {
      const [entryName, entryBytes] = jsonlEntry;
      const logs = parseJsonLines(strFromU8(entryBytes), entryName);
      return { conversations: groupLogs(logs) };
    }

    const jsonFiles = Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith('.json'));
    for (const [entryName, entryBytes] of jsonFiles) {
      try {
        const raw = JSON.parse(strFromU8(entryBytes)) as unknown;
        if (Array.isArray(raw) && raw.length > 0 && isAnythingLlmChatLog(raw[0])) {
          const logs = raw.filter(isAnythingLlmChatLog);
          if (logs.length > 0) {
            return { conversations: groupLogs(logs) };
          }
        }
      } catch {
        // try next json entry
      }
    }

    throw new Error('AnythingLLM export ZIP must contain a .json or .jsonl chat log export');
  }

  throw new Error('Input must be an AnythingLLM .json, .jsonl, or .zip chat log export');
}
