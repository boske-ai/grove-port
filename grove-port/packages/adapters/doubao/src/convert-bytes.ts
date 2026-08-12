import { buildAdapterManifest, packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import {
  countAttachmentReferences,
  formatMessageText,
  isImportableMessage,
  resolveSender,
  toIsoTimestamp,
} from './format-message.js';
import { loadDoubaoExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type DoubaoConversationExport,
  type GroveConversationRecord,
  type GroveMessageRecord,
} from './types.js';

export interface ConvertDoubaoBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface DoubaoExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface DoubaoExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: DoubaoExportStats;
}

export interface ConvertDoubaoBytesResult extends DoubaoExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  exportItem: DoubaoConversationExport,
  userId: string,
  nowIso: string,
): {
  conversation: GroveConversationRecord;
  messages: GroveMessageRecord[];
  attachmentReferences: number;
} {
  const conversationId = crypto.randomUUID();
  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const message of exportItem.messages) {
    if (!isImportableMessage(message)) {
      continue;
    }

    const text = formatMessageText(message);
    const messageId = crypto.randomUUID();
    const isCreatedByUser = message.role === 'user';
    const createdAt = toIsoTimestamp(message.timestamp ?? message.created_at, nowIso);

    messages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text,
      sender: resolveSender(message),
      isCreatedByUser,
      model: 'doubao',
      endpoint: 'custom',
      createdAt,
      doubao_role: message.role,
      role: isCreatedByUser ? 'user' : 'assistant',
    });

    previousMessageId = messageId;
  }

  const createdAt = messages[0]?.createdAt ?? nowIso;
  const updatedAt = messages[messages.length - 1]?.createdAt ?? createdAt;

  return {
    conversation: {
      conversationId,
      title: exportItem.title?.trim() || 'Untitled Doubao conversation',
      user: userId,
      endpoint: 'custom',
      model: 'doubao',
      createdAt,
      updatedAt,
      source_format: SOURCE_FORMAT,
      doubao_session_id: exportItem.session_id ?? exportItem.id,
    },
    messages,
    attachmentReferences: countAttachmentReferences(exportItem.messages),
  };
}

export async function buildDoubaoGrovePortBundle(
  options: ConvertDoubaoBytesOptions,
): Promise<DoubaoExportBuildResult> {
  const bundle = loadDoubaoExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'doubao-import';
  const userEmail = options.userEmail ?? 'unknown@import.local';
  const nowIso = new Date().toISOString();

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];
  let attachmentReferences = 0;

  for (const item of bundle.conversations) {
    const converted = convertConversation(item, userId, nowIso);
    if (converted.messages.length === 0) {
      continue;
    }
    groveConversations.push(converted.conversation);
    groveMessages.push(...converted.messages);
    attachmentReferences += converted.attachmentReferences;
  }

  if (groveConversations.length === 0) {
    throw new Error('Doubao export contains no importable conversations');
  }

  const stats: DoubaoExportStats = {
    conversationCount: groveConversations.length,
    messageCount: groveMessages.length,
    forkedConversations: 0,
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

  const manifest: DoubaoExportBuildResult['manifest'] = buildAdapterManifest({
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

export async function previewDoubaoExport(
  options: ConvertDoubaoBytesOptions,
): Promise<DoubaoExportStats> {
  const { stats } = await buildDoubaoGrovePortBundle(options);
  return stats;
}

export async function convertDoubaoExportToBytes(
  options: ConvertDoubaoBytesOptions,
): Promise<ConvertDoubaoBytesResult> {
  const built = await buildDoubaoGrovePortBundle(options);
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
