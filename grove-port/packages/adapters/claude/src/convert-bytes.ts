import { buildAdapterManifest, packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import {
  formatMessageText,
  resolveModel,
  resolveSender,
  toIsoTimestamp,
} from './format-message.js';
import { loadClaudeExportFromBytes } from './load-input-bytes.js';
import { selectActiveLineage } from './select-lineage.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type ClaudeConversation,
  type GroveConversationRecord,
  type GroveMessageRecord,
} from './types.js';

export interface ConvertClaudeBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface ClaudeExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface ClaudeExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: ClaudeExportStats;
}

export interface ConvertClaudeBytesResult extends ClaudeExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  conv: ClaudeConversation,
  userId: string,
): {
  conversation: GroveConversationRecord;
  messages: GroveMessageRecord[];
} {
  const conversationId = crypto.randomUUID();
  const model = conv.model?.trim() || 'claude';
  const { orderedMessages, hadFork } = selectActiveLineage(
    conv.chat_messages,
    conv.current_leaf_message_uuid,
  );

  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const message of orderedMessages) {
    const messageId = crypto.randomUUID();
    const isCreatedByUser = message.sender === 'human';

    messages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text: formatMessageText(message),
      sender: resolveSender(message.sender),
      isCreatedByUser,
      model: resolveModel(model),
      endpoint: 'anthropic',
      createdAt: toIsoTimestamp(message.created_at),
      claude_message_uuid: message.uuid,
      role: isCreatedByUser ? 'user' : 'assistant',
    });

    previousMessageId = messageId;
  }

  const conversation: GroveConversationRecord = {
    conversationId,
    title: conv.name?.trim() || 'Untitled Claude conversation',
    user: userId,
    endpoint: 'anthropic',
    createdAt: toIsoTimestamp(conv.created_at),
    updatedAt: toIsoTimestamp(conv.updated_at ?? conv.created_at),
    source_format: SOURCE_FORMAT,
    claude_conversation_uuid: conv.uuid,
    model,
  };

  if (hadFork) {
    conversation.source_fork = true;
  }

  return { conversation, messages };
}

export async function buildClaudeGrovePortBundle(
  options: ConvertClaudeBytesOptions,
): Promise<ClaudeExportBuildResult> {
  const bundle = loadClaudeExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? bundle.user?.uuid ?? 'claude-import';
  const userEmail = options.userEmail ?? bundle.user?.email_address ?? 'unknown@import.local';

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];
  let forkedConversations = 0;

  for (const conv of bundle.conversations) {
    const { conversation, messages } = convertConversation(conv, userId);
    if (conversation.source_fork) {
      forkedConversations += 1;
    }
    groveConversations.push(conversation);
    groveMessages.push(...messages);
  }

  const stats: ClaudeExportStats = {
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

  const manifest: ClaudeExportBuildResult['manifest'] = buildAdapterManifest({
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

export async function previewClaudeExport(
  options: ConvertClaudeBytesOptions,
): Promise<ClaudeExportStats> {
  const { stats } = await buildClaudeGrovePortBundle(options);
  return stats;
}

export async function convertClaudeExportToBytes(
  options: ConvertClaudeBytesOptions,
): Promise<ConvertClaudeBytesResult> {
  const built = await buildClaudeGrovePortBundle(options);
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
