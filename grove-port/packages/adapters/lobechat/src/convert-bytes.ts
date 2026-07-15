import { packEnvelopeBytes } from '@grove-port/core/browser';
import type { EnvelopeRootName, ExportDataV1, ExportManifestV1 } from '@grove-port/schema';
import {
  formatMessageText,
  isImportableMessage,
  resolveModel,
  resolveSender,
  toIsoTimestamp,
} from './format-message.js';
import { loadLobeChatExportFromBytes } from './load-input-bytes.js';
import {
  ADAPTER_ID,
  ADAPTER_VERSION,
  NO_PARENT,
  SOURCE_FORMAT,
  type GroveConversationRecord,
  type GroveMessageRecord,
  type LobeChatSessionExport,
} from './types.js';

export interface ConvertLobeChatBytesOptions {
  fileName: string;
  bytes: Uint8Array;
  userId?: string;
  userEmail?: string;
  label?: string;
  /** Wire root — use boske-export-v1 when feeding Boske ImportService. */
  envelopeRoot?: EnvelopeRootName;
}

export interface LobeChatExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: typeof SOURCE_FORMAT;
  userId: string;
  userEmail: string;
}

export interface LobeChatExportBuildResult {
  data: ExportDataV1;
  manifest: Omit<ExportManifestV1, 'checksums' | 'signature_alg' | 'signature_public_key'>;
  stats: LobeChatExportStats;
}

export interface ConvertLobeChatBytesResult extends LobeChatExportStats {
  bytes: Uint8Array;
  manifest: ExportManifestV1;
}

function convertSession(
  session: LobeChatSessionExport,
  userId: string,
  nowIso: string,
): { conversation: GroveConversationRecord; messages: GroveMessageRecord[] } {
  const conversationId = crypto.randomUUID();
  const model = resolveModel(session.model);
  const messages: GroveMessageRecord[] = [];
  let previousMessageId = NO_PARENT;

  for (const message of session.messages) {
    if (!isImportableMessage(message)) {
      continue;
    }

    const text = formatMessageText(message);
    const messageId = crypto.randomUUID();
    const isCreatedByUser = message.role === 'user';
    const createdAt = toIsoTimestamp(message.createdAt ?? message.updatedAt, nowIso);

    messages.push({
      messageId,
      conversationId,
      parentMessageId: previousMessageId,
      user: userId,
      text,
      sender: resolveSender(message, model),
      isCreatedByUser,
      model,
      endpoint: 'custom',
      createdAt,
      lobechat_role: message.role,
      role: isCreatedByUser ? 'user' : message.role === 'tool' ? 'tool' : 'assistant',
    });

    previousMessageId = messageId;
  }

  const createdAt = messages[0]?.createdAt ?? nowIso;
  const updatedAt = messages[messages.length - 1]?.createdAt ?? createdAt;

  return {
    conversation: {
      conversationId,
      title: session.topic?.trim() || session.title?.trim() || 'Untitled LobeChat conversation',
      user: userId,
      endpoint: 'custom',
      model,
      createdAt,
      updatedAt,
      source_format: SOURCE_FORMAT,
      lobechat_session_id: session.sessionId,
    },
    messages,
  };
}

export async function buildLobeChatGrovePortBundle(
  options: ConvertLobeChatBytesOptions,
): Promise<LobeChatExportBuildResult> {
  const bundle = loadLobeChatExportFromBytes(options.fileName, options.bytes);
  const userId = options.userId ?? 'lobechat-import';
  const userEmail = options.userEmail ?? 'unknown@import.local';
  const nowIso = new Date().toISOString();

  const groveConversations: GroveConversationRecord[] = [];
  const groveMessages: GroveMessageRecord[] = [];

  for (const session of bundle.sessions) {
    const converted = convertSession(session, userId, nowIso);
    if (converted.messages.length === 0) {
      continue;
    }
    groveConversations.push(converted.conversation);
    groveMessages.push(...converted.messages);
  }

  if (groveConversations.length === 0) {
    throw new Error('LobeChat export contains no importable conversations');
  }

  const stats: LobeChatExportStats = {
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

  const manifest: LobeChatExportBuildResult['manifest'] = {
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

export async function previewLobeChatExport(
  options: ConvertLobeChatBytesOptions,
): Promise<LobeChatExportStats> {
  const { stats } = await buildLobeChatGrovePortBundle(options);
  return stats;
}

export async function convertLobeChatExportToBytes(
  options: ConvertLobeChatBytesOptions,
): Promise<ConvertLobeChatBytesResult> {
  const built = await buildLobeChatGrovePortBundle(options);
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
