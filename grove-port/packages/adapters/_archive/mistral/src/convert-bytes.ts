import { packEnvelopeBytes } from '@grove-port/core/browser';
import type { ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import {
  countAttachmentReferences,
  deriveConversationTitle,
  formatMessageText,
  resolveSender,
  sortMessagesByTimestamp,
  toIsoTimestamp,
} from './format-message.js';
import { loadMistralExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type GroveConversationRecord,
  type GroveMessageRecord,
  type MistralConversation,
} from './types.js';

export interface ConvertMistralBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
}

export interface MistralExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface MistralExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: MistralExportStats;
}

export interface ConvertMistralBytesResult extends MistralExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  messages: MistralConversation,
  userId: string,
): {
  conversation: GroveConversationRecord;
  messages: GroveMessageRecord[];
  attachmentReferences: number;
} {
  const sortedMessages = sortMessagesByTimestamp(messages).filter(
    (message) => message.role === 'user' || message.role === 'assistant',
  );

  const conversationId = crypto.randomUUID();
  const chatId = sortedMessages[0]?.chatId ?? crypto.randomUUID();
  const groveMessages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const message of sortedMessages) {
    const text = formatMessageText(message);
    if (!text) {
      continue;
    }

    const messageId = crypto.randomUUID();
    const isCreatedByUser = message.role === 'user';

    groveMessages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text,
      sender: resolveSender(message.role),
      isCreatedByUser,
      model: 'mistral-large-latest',
      endpoint: 'mistral',
      createdAt: toIsoTimestamp(message.createdAt),
      mistral_message_id: message.id,
      role: isCreatedByUser ? 'user' : 'assistant',
    });

    previousMessageId = messageId;
  }

  const createdAt = groveMessages[0]?.createdAt ?? new Date().toISOString();
  const updatedAt = groveMessages[groveMessages.length - 1]?.createdAt ?? createdAt;

  return {
    conversation: {
      conversationId,
      title: deriveConversationTitle(sortedMessages),
      user: userId,
      endpoint: 'mistral',
      createdAt,
      updatedAt,
      source_format: SOURCE_FORMAT,
      mistral_chat_id: chatId,
    },
    messages: groveMessages,
    attachmentReferences: countAttachmentReferences(sortedMessages),
  };
}

export async function buildMistralGrovePortBundle(
  options: ConvertMistralBytesOptions,
): Promise<MistralExportBuildResult> {
  const bundle = loadMistralExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'mistral-import';
  const userEmail = options.userEmail ?? 'unknown@import.local';

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];
  let attachmentReferences = 0;

  for (const conversation of bundle.conversations) {
    const converted = convertConversation(conversation, userId);
    groveConversations.push(converted.conversation);
    groveMessages.push(...converted.messages);
    attachmentReferences += converted.attachmentReferences;
  }

  const stats: MistralExportStats = {
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

  const manifest: MistralExportBuildResult['manifest'] = {
    version: 'v1',
    label: options.label,
    created_at: new Date().toISOString(),
    source: {
      app_version: ADAPTER_VERSION,
      deployment: 'web-saas',
      tier: 'free',
      instance_id: '00000000-0000-4000-8000-000000000000',
      adapter: ADAPTER_ID,
      adapter_version: ADAPTER_VERSION,
      source_format: SOURCE_FORMAT,
    },
    user_id: userId,
    user_email: userEmail,
    counts: {
      conversations: stats.conversationCount,
      messages: stats.messageCount,
      files: stats.fileCount,
      presets: 0,
      agents: 0,
      memories: 0,
      tool_calls: 0,
      transcript_sessions: 0,
      workspace_items: 0,
      shares: 0,
    },
  };

  return { data, manifest, stats };
}

export async function previewMistralExport(
  options: ConvertMistralBytesOptions,
): Promise<MistralExportStats> {
  const { stats } = await buildMistralGrovePortBundle(options);
  return stats;
}

export async function convertMistralExportToBytes(
  options: ConvertMistralBytesOptions,
): Promise<ConvertMistralBytesResult> {
  const built = await buildMistralGrovePortBundle(options);
  const packed = await packEnvelopeBytes({
    manifest: built.manifest,
    data: built.data,
    attachments: [],
  });

  return {
    ...built.stats,
    bytes: packed.bytes,
    manifest: packed.manifest,
  };
}
