import { strFromU8 } from 'fflate';
import type { OpenWebUiChatData, OpenWebUiExportItem } from './types.js';

function normalizeExportItem(item: OpenWebUiExportItem): OpenWebUiChatData {
  if (item.chat) {
    return item.chat;
  }

  if (item.history) {
    return {
      title: item.title,
      models: item.models,
      history: item.history,
    };
  }

  throw new Error('Open WebUI export item must include chat or history');
}

function isOpenWebUiExportItem(value: unknown): value is OpenWebUiExportItem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return Boolean(record.chat || record.history);
}

export interface OpenWebUiExportBundle {
  items: Array<{
    chat: OpenWebUiChatData;
    createdAt?: number | null;
    updatedAt?: number | null;
  }>;
}

export function loadOpenWebUiExportFromBytes(
  fileName: string,
  jsonBytes: Uint8Array,
): OpenWebUiExportBundle {
  if (!fileName.toLowerCase().endsWith('.json')) {
    throw new Error('Open WebUI input must be a .json export file');
  }

  const raw = JSON.parse(strFromU8(jsonBytes)) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error('Open WebUI export must be a JSON array');
  }

  if (raw.length > 0 && !isOpenWebUiExportItem(raw[0])) {
    throw new Error('Open WebUI export items must include chat or history');
  }

  return {
    items: (raw as OpenWebUiExportItem[]).map((item) => ({
      chat: normalizeExportItem(item),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
  };
}
