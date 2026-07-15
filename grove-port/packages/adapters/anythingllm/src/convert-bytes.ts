import { packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import { toIsoTimestamp } from './format-message.js';
import { loadAnythingLlmExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type AnythingLlmConversation,
  type GroveConversationRecord,
  type GroveMessageRecord,
} from './types.js';

export interface ConvertAnythingLlmBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface AnythingLlmExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface AnythingLlmExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: AnythingLlmExportStats;
}

export interface ConvertAnythingLlmBytesResult extends AnythingLlmExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  item: AnythingLlmConversation,
  userId: string,
  nowIso: string,
): { conversation: GroveConversationRecord; messages: GroveMessageRecord[] } {
  const conversationId = crypto.randomUUID();
  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const log of item.logs) {
    const createdAt = toIsoTimestamp(log.sent_at, nowIso);

    if (log.prompt.trim()) {
      const messageId = crypto.randomUUID();
      messages.push({
        messageId,
        conversationId,
        parentMessageId: previousMessageId,
        user: userId,
        text: log.prompt.trim(),
        sender: log.username?.trim() || 'user',
        isCreatedByUser: true,
        model: 'anythingllm',
        endpoint: 'custom',
        createdAt,
        anythingllm_log_id: log.id,
        role: 'user',
      });
      previousMessageId = messageId;
    }

    if (log.response.trim()) {
      const messageId = crypto.randomUUID();
      messages.push({
        messageId,
        conversationId,
        parentMessageId: previousMessageId,
        user: userId,
        text: log.response.trim(),
        sender: 'assistant',
        isCreatedByUser: false,
        model: 'anythingllm',
        endpoint: 'custom',
        createdAt,
        anythingllm_log_id: log.id,
        role: 'assistant',
      });
      previousMessageId = messageId;
    }
  }

  const createdAt = messages[0]?.createdAt ?? nowIso;
  const updatedAt = messages[messages.length - 1]?.createdAt ?? createdAt;

  return {
    conversation: {
      conversationId,
      title: item.title,
      user: userId,
      endpoint: 'custom',
      createdAt,
      updatedAt,
      source_format: SOURCE_FORMAT,
      anythingllm_workspace: item.workspaceName,
    },
    messages,
  };
}

export async function buildAnythingLlmGrovePortBundle(
  options: ConvertAnythingLlmBytesOptions,
): Promise<AnythingLlmExportBuildResult> {
  const bundle = loadAnythingLlmExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'anythingllm-import';
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
    throw new Error('AnythingLLM export contains no importable conversations');
  }

  const stats: AnythingLlmExportStats = {
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

  const manifest: AnythingLlmExportBuildResult['manifest'] = {
    version: 'v1',
    label: options.label,
    created_at: nowIso,
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

export async function previewAnythingLlmExport(
  options: ConvertAnythingLlmBytesOptions,
): Promise<AnythingLlmExportStats> {
  const { stats } = await buildAnythingLlmGrovePortBundle(options);
  return stats;
}

export async function convertAnythingLlmExportToBytes(
  options: ConvertAnythingLlmBytesOptions,
): Promise<ConvertAnythingLlmBytesResult> {
  const built = await buildAnythingLlmGrovePortBundle(options);
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
