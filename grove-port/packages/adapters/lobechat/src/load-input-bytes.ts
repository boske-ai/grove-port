import { strFromU8, unzipSync } from 'fflate';
import type { LobeChatSessionExport } from './types.js';

export interface LobeChatExportBundle {
  sessions: LobeChatSessionExport[];
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

function isLobeChatSession(value: unknown): value is LobeChatSessionExport {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    return false;
  }

  return value.messages.some(
    (message) =>
      isRecord(message) &&
      typeof message.role === 'string' &&
      ('content' in message || 'tool_calls' in message),
  );
}

function normalizeSession(raw: unknown, label: string): LobeChatSessionExport {
  if (!isLobeChatSession(raw)) {
    throw new Error(
      `${label} must be a LobeChat OpenAI-format export with a messages array`,
    );
  }

  return raw;
}

export function loadLobeChatExportFromBytes(
  fileName: string,
  archiveOrJsonBytes: Uint8Array,
): LobeChatExportBundle {
  const lowerPath = fileName.toLowerCase();

  if (lowerPath.endsWith('.zip')) {
    const entries = unzipSync(archiveOrJsonBytes);
    const jsonFiles = Object.entries(entries).filter(([name]) => name.toLowerCase().endsWith('.json'));

    if (jsonFiles.length === 0) {
      throw new Error('LobeChat export ZIP must contain .json session files');
    }

    const sessions = jsonFiles
      .map(([name, bytes]) => normalizeSession(parseJsonFile(bytes, name), name))
      .filter((session) => session.messages.length > 0);

    if (sessions.length === 0) {
      throw new Error('LobeChat export ZIP contains no importable sessions');
    }

    return { sessions };
  }

  if (lowerPath.endsWith('.json')) {
    const raw = parseJsonFile<unknown>(archiveOrJsonBytes, fileName);

    if (Array.isArray(raw)) {
      const sessions = raw
        .map((item, index) => normalizeSession(item, `${fileName}[${index}]`))
        .filter((session) => session.messages.length > 0);

      if (sessions.length === 0) {
        throw new Error('LobeChat JSON array contains no importable sessions');
      }

      return { sessions };
    }

    return {
      sessions: [normalizeSession(raw, fileName)],
    };
  }

  throw new Error('Input must be a LobeChat .json export or .zip of session JSON files');
}
