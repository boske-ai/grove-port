import { buildAdapterManifest, packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import {
  flattenOpenWebUiHistory,
  resolveModel,
  resolveSender,
  toIsoTimestamp,
} from './flatten-history.js';
import { loadOpenWebUiExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type GroveConversationRecord,
  type GroveMessageRecord,
  type OpenWebUiChatData,
} from './types.js';

export interface ConvertOpenWebUiBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface OpenWebUiExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface OpenWebUiExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: OpenWebUiExportStats;
}

export interface ConvertOpenWebUiBytesResult extends OpenWebUiExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertChat(
  chat: OpenWebUiChatData,
  userId: string,
  createdAtFallback: string,
  updatedAtFallback: string,
): {
  conversation: GroveConversationRecord;
  messages: GroveMessageRecord[];
} {
  const conversationId = crypto.randomUUID();
  const { orderedMessageIds, hadFork } = flattenOpenWebUiHistory(chat.history);
  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const messageId of orderedMessageIds) {
    const message = chat.history.messages[messageId];
    if (!message) {
      continue;
    }

    const groveMessageId = crypto.randomUUID();
    const isCreatedByUser = message.role === 'user';
    const model = resolveModel(chat.models, message.model);
    const createdAt = toIsoTimestamp(message.timestamp, createdAtFallback);

    messages.push({
      messageId: groveMessageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text: message.content.trim(),
      sender: resolveSender(message.role, message.model),
      isCreatedByUser,
      model,
      endpoint: 'custom',
      createdAt,
      openwebui_message_id: message.id,
      role: message.role,
    });

    previousMessageId = groveMessageId;
  }

  const conversation: GroveConversationRecord = {
    conversationId,
    title: chat.title?.trim() || 'Untitled Open WebUI conversation',
    user: userId,
    endpoint: 'custom',
    createdAt: messages[0]?.createdAt ?? createdAtFallback,
    updatedAt: messages[messages.length - 1]?.createdAt ?? updatedAtFallback,
    source_format: SOURCE_FORMAT,
    openwebui_models: chat.models,
  };

  if (hadFork) {
    conversation.source_fork = true;
  }

  return { conversation, messages };
}

export async function buildOpenWebUiGrovePortBundle(
  options: ConvertOpenWebUiBytesOptions,
): Promise<OpenWebUiExportBuildResult> {
  const bundle = loadOpenWebUiExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'openwebui-import';
  const userEmail = options.userEmail ?? 'unknown@import.local';
  const nowIso = new Date().toISOString();

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];
  let forkedConversations = 0;

  for (const item of bundle.items) {
    const createdAtFallback = item.createdAt
      ? new Date(item.createdAt * 1000).toISOString()
      : nowIso;
    const updatedAtFallback = item.updatedAt
      ? new Date(item.updatedAt * 1000).toISOString()
      : createdAtFallback;

    const { conversation, messages } = convertChat(
      item.chat,
      userId,
      createdAtFallback,
      updatedAtFallback,
    );

    if (conversation.source_fork) {
      forkedConversations += 1;
    }

    groveConversations.push(conversation);
    groveMessages.push(...messages);
  }

  const stats: OpenWebUiExportStats = {
    conversationCount: groveConversations.length,
    messageCount: groveMessages.length,
    forkedConversations,
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

  const manifest: OpenWebUiExportBuildResult['manifest'] = buildAdapterManifest({
    adapterId: ADAPTER_ID,
    adapterVersion: ADAPTER_VERSION,
    sourceFormat: SOURCE_FORMAT,
    userId,
    userEmail,
    label: options.label,
    counts: {
      conversations: stats.conversationCount,
      messages: stats.messageCount,
      files: stats.fileCount,
    },
  });

  return { data, manifest, stats };
}

export async function previewOpenWebUiExport(
  options: ConvertOpenWebUiBytesOptions,
): Promise<OpenWebUiExportStats> {
  const { stats } = await buildOpenWebUiGrovePortBundle(options);
  return stats;
}

export async function convertOpenWebUiExportToBytes(
  options: ConvertOpenWebUiBytesOptions,
): Promise<ConvertOpenWebUiBytesResult> {
  const built = await buildOpenWebUiGrovePortBundle(options);
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

export { flattenOpenWebUiHistory } from './flatten-history.js';
