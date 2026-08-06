import { buildAdapterManifest, packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import { resolveSender, toIsoTimestamp } from './format-message.js';
import { loadGeminiExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type GeminiParsedConversation,
  type GroveConversationRecord,
  type GroveMessageRecord,
} from './types.js';

export interface ConvertGeminiBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface GeminiExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface GeminiExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: GeminiExportStats;
}

export interface ConvertGeminiBytesResult extends GeminiExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  exportItem: GeminiParsedConversation,
  userId: string,
  nowIso: string,
): { conversation: GroveConversationRecord; messages: GroveMessageRecord[] } {
  const conversationId = crypto.randomUUID();
  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const message of exportItem.messages) {
    const messageId = crypto.randomUUID();
    const isCreatedByUser = message.role === 'user';

    messages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text: message.text,
      sender: resolveSender(message.role),
      isCreatedByUser,
      model: 'gemini',
      endpoint: 'custom',
      createdAt: toIsoTimestamp(message.createdAt, nowIso),
      gemini_role: message.role,
      role: message.role,
    });

    previousMessageId = messageId;
  }

  const createdAt = messages[0]?.createdAt ?? nowIso;
  const updatedAt = messages[messages.length - 1]?.createdAt ?? createdAt;

  return {
    conversation: {
      conversationId,
      title: exportItem.title,
      user: userId,
      endpoint: 'custom',
      model: 'gemini',
      createdAt,
      updatedAt,
      source_format: SOURCE_FORMAT,
      gemini_conversation_id: exportItem.sourceConversationId,
    },
    messages,
  };
}

export async function buildGeminiGrovePortBundle(
  options: ConvertGeminiBytesOptions,
): Promise<GeminiExportBuildResult> {
  const bundle = loadGeminiExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'gemini-import';
  const userEmail = options.userEmail ?? 'unknown@import.local';
  const nowIso = new Date().toISOString();

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];

  for (const item of bundle.conversations) {
    const converted = convertConversation(item, userId, nowIso);
    if (converted.messages.length === 0) {
      continue;
    }
    groveConversations.push(converted.conversation);
    groveMessages.push(...converted.messages);
  }

  if (groveConversations.length === 0) {
    throw new Error('Gemini export contains no importable conversations');
  }

  const stats: GeminiExportStats = {
    conversationCount: groveConversations.length,
    messageCount: groveMessages.length,
    forkedConversations: 0,
    attachmentCount: 0,
    fileCount: 0,
    sourceFormat: SOURCE_FORMAT,
    userId,
    userEmail,
  };

  const data: ExportDataV1 = {
    user: {
      id: userId,
      email: userEmail,
      source_format: SOURCE_FORMAT,
    },
    conversations: groveConversations as unknown as ExportDataV1['conversations'],
    messages: groveMessages as unknown as ExportDataV1['messages'],
    files: [],
    presets: [],
    agents: [],
    memories: [],
    tool_calls: [],
    transcript_sessions: [],
    workspace_items: [],
    shares: [],
    attachments: [],
  };

  const manifest: GeminiExportBuildResult['manifest'] = buildAdapterManifest({
    adapterId: ADAPTER_ID,
    adapterVersion: ADAPTER_VERSION,
    sourceFormat: SOURCE_FORMAT,
    userId,
    userEmail,
    label: options.label,
    createdAt: nowIso,
    counts: {
      conversations: stats.conversationCount,
      messages: stats.messageCount,
      files: stats.fileCount,
    },
  });

  return { data, manifest, stats };
}

export async function previewGeminiExport(
  options: ConvertGeminiBytesOptions,
): Promise<GeminiExportStats> {
  const { stats } = await buildGeminiGrovePortBundle(options);
  return stats;
}

export async function convertGeminiExportToBytes(
  options: ConvertGeminiBytesOptions,
): Promise<ConvertGeminiBytesResult> {
  const built = await buildGeminiGrovePortBundle(options);
  const packed = await packEnvelopeBytes({
    manifest: built.manifest,
    data: built.data,
    attachments: [],
    ...(options.envelopeRoot ? { envelopeRoot: options.envelopeRoot } : {}),
  });

  return {
    ...built.stats,
    bytes: packed.bytes,
    manifest: packed.manifest,
  };
}
