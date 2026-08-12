import { buildAdapterManifest, packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import {
  countAttachmentReferences,
  formatMessageText,
  resolveEndpoint,
  resolveModel,
  resolveSender,
  toIsoTimestamp,
} from './format-message.js';
import { loadLibreChatExportFromBytes } from './load-input-bytes.js';
import { resolveOrderedMessages } from './select-lineage.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type GroveConversationRecord,
  type GroveMessageRecord,
  type LibreChatConversationExport,
} from './types.js';

export interface ConvertLibreChatBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface LibreChatExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface LibreChatExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: LibreChatExportStats;
}

export interface ConvertLibreChatBytesResult extends LibreChatExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  exportItem: LibreChatConversationExport,
  userId: string,
  nowIso: string,
): {
  conversation: GroveConversationRecord;
  messages: GroveMessageRecord[];
  attachmentReferences: number;
  hadFork: boolean;
} {
  const { orderedMessages, hadFork } = resolveOrderedMessages(exportItem);
  const conversationId = crypto.randomUUID();
  const endpoint = resolveEndpoint(exportItem.endpoint);
  const model = resolveModel(exportItem.model, exportItem.endpoint);
  const groveMessages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const message of orderedMessages) {
    const text = formatMessageText(message);
    if (!text) {
      continue;
    }

    const messageId = crypto.randomUUID();
    const isCreatedByUser = Boolean(message.isCreatedByUser);

    groveMessages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text,
      sender: resolveSender(message),
      isCreatedByUser,
      model: message.model?.trim() || model,
      endpoint,
      createdAt: toIsoTimestamp(message.createdAt, nowIso),
      librechat_message_id: message.messageId,
      role: isCreatedByUser ? 'user' : 'assistant',
    });

    previousMessageId = messageId;
  }

  const createdAt = groveMessages[0]?.createdAt ?? nowIso;
  const updatedAt = groveMessages[groveMessages.length - 1]?.createdAt ?? createdAt;

  const conversation: GroveConversationRecord = {
    conversationId,
    title: exportItem.title?.trim() || 'Untitled LibreChat conversation',
    user: userId,
    endpoint,
    model,
    createdAt,
    updatedAt,
    source_format: SOURCE_FORMAT,
    librechat_conversation_id: exportItem.conversationId,
  };

  if (hadFork) {
    conversation.source_fork = true;
  }

  return {
    conversation,
    messages: groveMessages,
    attachmentReferences: countAttachmentReferences(orderedMessages),
    hadFork,
  };
}

export async function buildLibreChatGrovePortBundle(
  options: ConvertLibreChatBytesOptions,
): Promise<LibreChatExportBuildResult> {
  const bundle = loadLibreChatExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'librechat-import';
  const userEmail = options.userEmail ?? 'unknown@import.local';
  const nowIso = new Date().toISOString();

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];
  let forkedConversations = 0;
  let attachmentReferences = 0;

  for (const item of bundle.conversations) {
    const converted = convertConversation(item, userId, nowIso);
    if (converted.hadFork) {
      forkedConversations += 1;
    }
    groveConversations.push(converted.conversation);
    groveMessages.push(...converted.messages);
    attachmentReferences += converted.attachmentReferences;
  }

  const stats: LibreChatExportStats = {
    conversationCount: groveConversations.length,
    messageCount: groveMessages.length,
    forkedConversations,
    attachmentCount: attachmentReferences,
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

  const manifest: LibreChatExportBuildResult['manifest'] = buildAdapterManifest({
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

export async function previewLibreChatExport(
  options: ConvertLibreChatBytesOptions,
): Promise<LibreChatExportStats> {
  const { stats } = await buildLibreChatGrovePortBundle(options);
  return stats;
}

export async function convertLibreChatExportToBytes(
  options: ConvertLibreChatBytesOptions,
): Promise<ConvertLibreChatBytesResult> {
  const built = await buildLibreChatGrovePortBundle(options);
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
