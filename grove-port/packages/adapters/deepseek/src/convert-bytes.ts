import { packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import {
  flattenDeepSeekMapping,
  formatFragmentText,
  fragmentRole,
  toIsoTimestampFromFragment,
} from './flatten-mapping.js';
import { loadDeepSeekExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type DeepSeekConversationExport,
  type GroveConversationRecord,
  type GroveMessageRecord,
} from './types.js';

export interface ConvertDeepSeekBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface DeepSeekExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface DeepSeekExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: DeepSeekExportStats;
}

export interface ConvertDeepSeekBytesResult extends DeepSeekExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertConversation(
  exportItem: DeepSeekConversationExport,
  userId: string,
  nowIso: string,
): {
  conversation: GroveConversationRecord;
  messages: GroveMessageRecord[];
  hadFork: boolean;
} {
  const { orderedNodeIds, hadFork } = flattenDeepSeekMapping(exportItem.mapping);
  const conversationId = crypto.randomUUID();
  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const nodeId of orderedNodeIds) {
    const node = exportItem.mapping[nodeId];
    const fragment = node?.fragment;
    if (!node || !fragment) {
      continue;
    }

    const text = formatFragmentText(fragment);
    const messageId = crypto.randomUUID();
    const role = fragmentRole(fragment);
    const isCreatedByUser = role === 'user';

    messages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text,
      sender: isCreatedByUser ? 'user' : 'deepseek',
      isCreatedByUser,
      model: 'deepseek-chat',
      endpoint: 'custom',
      createdAt: toIsoTimestampFromFragment(fragment, nowIso),
      deepseek_node_id: nodeId,
      deepseek_fragment_type: fragment.type,
      role,
    });

    previousMessageId = messageId;
  }

  const createdAt = messages[0]?.createdAt ?? nowIso;
  const updatedAt = messages[messages.length - 1]?.createdAt ?? createdAt;

  const conversation: GroveConversationRecord = {
    conversationId,
    title: exportItem.title?.trim() || 'Untitled DeepSeek conversation',
    user: userId,
    endpoint: 'custom',
    model: 'deepseek-chat',
    createdAt,
    updatedAt,
    source_format: SOURCE_FORMAT,
    deepseek_conversation_id: exportItem.id,
  };

  if (hadFork) {
    conversation.source_fork = true;
  }

  return { conversation, messages, hadFork };
}

export async function buildDeepSeekGrovePortBundle(
  options: ConvertDeepSeekBytesOptions,
): Promise<DeepSeekExportBuildResult> {
  const bundle = loadDeepSeekExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'deepseek-import';
  const userEmail = options.userEmail ?? 'unknown@import.local';
  const nowIso = new Date().toISOString();

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];
  let forkedConversations = 0;

  for (const item of bundle.conversations) {
    const converted = convertConversation(item, userId, nowIso);
    if (converted.messages.length === 0) {
      continue;
    }
    if (converted.hadFork) {
      forkedConversations += 1;
    }
    groveConversations.push(converted.conversation);
    groveMessages.push(...converted.messages);
  }

  if (groveConversations.length === 0) {
    throw new Error('DeepSeek export contains no importable conversations');
  }

  const stats: DeepSeekExportStats = {
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

  const manifest: DeepSeekExportBuildResult['manifest'] = {
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

export async function previewDeepSeekExport(
  options: ConvertDeepSeekBytesOptions,
): Promise<DeepSeekExportStats> {
  const { stats } = await buildDeepSeekGrovePortBundle(options);
  return stats;
}

export async function convertDeepSeekExportToBytes(
  options: ConvertDeepSeekBytesOptions,
): Promise<ConvertDeepSeekBytesResult> {
  const built = await buildDeepSeekGrovePortBundle(options);
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
