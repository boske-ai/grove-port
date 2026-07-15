import { packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import { collectReferencedAssetDatNames, stageChatGptAssets } from './assets.js';
import { flattenConversationMapping } from './flatten-mapping.js';
import { formatMessageText, resolveModel, resolveSender, toIsoTimestamp } from './format-message.js';
import { loadChatGptExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type ChatGptConversation,
  type GroveConversationRecord,
  type GroveMessageRecord,
} from './types.js';

export interface ConvertChatGptBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use `boske-export-v1` when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface ChatGptExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface ConvertChatGptBytesResult extends ChatGptExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  conv: ChatGptConversation,
  userId: string,
  assetFileNames: Record<string, string>,
  embeddedAssets: Set<string>,
): {
  conversation: GroveConversationRecord;
  messages: GroveMessageRecord[];
} {
  const conversationId = crypto.randomUUID();
  const { orderedNodeIds, hadFork } = flattenConversationMapping(conv.mapping);
  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const nodeId of orderedNodeIds) {
    const node = conv.mapping[nodeId];
    const message = node?.message;
    if (!message) {
      continue;
    }

    const messageId = crypto.randomUUID();
    const role = message.author.role;
    const modelSlug = message.metadata?.model_slug;
    const isCreatedByUser = role === 'user';

    messages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text: formatMessageText(message, assetFileNames, embeddedAssets),
      sender: resolveSender(role, modelSlug),
      isCreatedByUser,
      model: resolveModel(modelSlug),
      endpoint: 'openAI',
      createdAt: toIsoTimestamp(message.create_time),
      chatgpt_message_id: message.id,
      role,
      content_type: message.content.content_type,
    });

    previousMessageId = messageId;
  }

  const conversation: GroveConversationRecord = {
    conversationId,
    title: conv.title || 'Untitled ChatGPT conversation',
    user: userId,
    endpoint: 'openAI',
    createdAt: toIsoTimestamp(conv.create_time),
    updatedAt: toIsoTimestamp(conv.update_time ?? conv.create_time),
    source_format: SOURCE_FORMAT,
    chatgpt_conversation_id: conv.conversation_id ?? conv.id,
  };

  if (hadFork) {
    conversation.source_fork = true;
  }

  return { conversation, messages };
}

export interface ChatGptExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  packAttachments: Awaited<ReturnType<typeof stageChatGptAssets>>['packAttachments'];
  stats: ChatGptExportStats;
}

export async function buildChatGptGrovePortBundle(
  options: ConvertChatGptBytesOptions,
): Promise<ChatGptExportBuildResult> {
  const bundle = loadChatGptExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? bundle.user?.id ?? 'chatgpt-import';
  const userEmail = options.userEmail ?? bundle.user?.email ?? 'unknown@import.local';

  const stagedAssets = await stageChatGptAssets({
    conversations: bundle.conversations,
    assetFileNames: bundle.assetFileNames,
    assetFileBytes: bundle.assetFileBytes,
  });

  const embeddedAssets = new Set(
    [...collectReferencedAssetDatNames(bundle.conversations)].filter(
      (datName) => datName in bundle.assetFileBytes,
    ),
  );

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];
  let forkedConversations = 0;

  for (const conv of bundle.conversations) {
    if (!conv.mapping || typeof conv.mapping !== 'object') {
      throw new Error(
        'Invalid ChatGPT export: conversation is missing a mapping graph. Check that ChatGPT is selected as the source platform.',
      );
    }

    const { conversation, messages } = convertConversation(
      conv,
      userId,
      bundle.assetFileNames,
      embeddedAssets,
    );
    if (conversation.source_fork) {
      forkedConversations += 1;
    }
    groveConversations.push(conversation);
    groveMessages.push(...messages);
  }

  const stats: ChatGptExportStats = {
    conversationCount: groveConversations.length,
    messageCount: groveMessages.length,
    forkedConversations,
    attachmentCount: stagedAssets.attachments.length,
    fileCount: stagedAssets.files.length,
    sourceFormat: SOURCE_FORMAT,
    userId,
    userEmail,
  };

  const data: ExportDataV1 = {
    user: { id: userId, email: userEmail, source_format: SOURCE_FORMAT },
    conversations: groveConversations as unknown as ExportDataV1['conversations'],
    messages: groveMessages as unknown as ExportDataV1['messages'],
    files: stagedAssets.files as unknown as ExportDataV1['files'],
    presets: [],
    agents: [],
    memories: [],
    tool_calls: [],
    transcript_sessions: [],
    workspace_items: [],
    shares: [],
    attachments: stagedAssets.attachments,
  };

  const manifest = {
    version: 'v1' as const,
    label: options.label,
    created_at: new Date().toISOString(),
    source: {
      app_version: ADAPTER_VERSION,
      deployment: 'web-saas' as const,
      tier: 'free' as const,
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

  return {
    data,
    manifest,
    packAttachments: stagedAssets.packAttachments,
    stats,
  };
}

export async function previewChatGptExport(
  options: ConvertChatGptBytesOptions,
): Promise<ChatGptExportStats> {
  const { stats } = await buildChatGptGrovePortBundle(options);
  return stats;
}

export async function convertChatGptExportToBytes(
  options: ConvertChatGptBytesOptions,
): Promise<ConvertChatGptBytesResult> {
  const built = await buildChatGptGrovePortBundle(options);
  const packed = await packEnvelopeBytes({
    manifest: built.manifest,
    data: built.data,
    attachments: built.packAttachments,
    ...(options.envelopeRoot ? { envelopeRoot: options.envelopeRoot } : {}),
  });

  return {
    ...built.stats,
    bytes: packed.bytes,
    manifest: packed.manifest,
  };
}
