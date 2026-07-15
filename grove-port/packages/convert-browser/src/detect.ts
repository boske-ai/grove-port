import { strFromU8, unzipSync } from 'fflate';

export type DetectedAdapterName =
  | 'chatgpt'
  | 'claude'
  | 'openwebui'
  | 'librechat'
  | 'gemini'
  | 'doubao'
  | 'deepseek'
  | 'lobechat'
  | 'anythingllm';

export type DetectionConfidence = 'high' | 'low';

/** Shown when a Mistral export is detected (ADR 0001). */
export const MISTRAL_UNSUPPORTED_MESSAGE =
  'Mistral Le Chat exports are not supported by Grove Port.';

export interface DetectExportCandidate {
  adapter: DetectedAdapterName;
  reason: string;
  score: number;
}

export interface DetectExportResult {
  adapter: DetectedAdapterName;
  reason: string;
  confidence: DetectionConfidence;
  alternatives: Array<{ adapter: DetectedAdapterName; reason: string }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function zipBaseName(entryName: string): string {
  const normalized = entryName.replace(/\\/g, '/');
  const segments = normalized.split('/');
  return segments[segments.length - 1] ?? normalized;
}

function isMainConversationsEntry(entryName: string): boolean {
  return zipBaseName(entryName).toLowerCase() === 'conversations.json';
}

function isShardedConversationsEntry(entryName: string): boolean {
  return /^conversations-\d+\.json$/i.test(zipBaseName(entryName));
}

function isChatGptConversation(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.mapping)) {
    return false;
  }

  return Object.values(value.mapping).some(
    (node) => isRecord(node) && isRecord(node.message) && 'parent' in node,
  );
}

function isDeepSeekConversation(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.mapping)) {
    return false;
  }

  return Object.values(value.mapping).some(
    (node) =>
      isRecord(node) &&
      isRecord(node.fragment) &&
      typeof node.fragment.type === 'string' &&
      ['REQUEST', 'RESPONSE', 'THINK', 'SEARCH'].includes(String(node.fragment.type)),
  );
}

function isClaudeConversation(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.uuid === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.chat_messages)
  );
}

function isMistralMessage(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.chatId === 'string' &&
    typeof value.role === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isLibreChatConversation(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const hasConversationId = typeof value.conversationId === 'string';
  const hasMessages = Array.isArray(value.messages);
  const hasTree = Array.isArray(value.messagesTree);

  if (!hasConversationId || (!hasMessages && !hasTree)) {
    return false;
  }

  if (hasMessages && (value.messages as unknown[]).length > 0) {
    return (value.messages as unknown[]).some(
      (message) =>
        isRecord(message) &&
        typeof message.messageId === 'string' &&
        ('text' in message || 'content' in message),
    );
  }

  if (hasTree) {
    return (value.messagesTree as unknown[]).some(
      (node) => isRecord(node) && typeof node.messageId === 'string',
    );
  }

  return false;
}

function isOpenAiMessagesSession(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    return false;
  }

  return (value.messages as unknown[]).some(
    (message) =>
      isRecord(message) &&
      typeof message.role === 'string' &&
      ('content' in message || 'tool_calls' in message),
  );
}

function isLobeChatSession(value: unknown, fileName = ''): boolean {
  if (!isOpenAiMessagesSession(value)) {
    return false;
  }

  const lower = fileName.toLowerCase();
  if (/lobe[-_]?chat|lobehub/.test(lower)) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.meta) ||
    isRecord(value.config) ||
    typeof value.topic === 'string' ||
    typeof value.sessionId === 'string'
  );
}

function isAnythingLlmChatLog(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (typeof value.id === 'number' || typeof value.id === 'string') &&
    typeof value.prompt === 'string' &&
    typeof value.response === 'string' &&
    (typeof value.sent_at === 'number' || typeof value.sent_at === 'string')
  );
}

function isOpenWebUiExportItem(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (isRecord(value.chat) && isRecord(value.chat.history)) {
    return isRecord(value.chat.history.messages);
  }

  if (isRecord(value.history)) {
    return isRecord(value.history.messages) && typeof value.history.currentId === 'string';
  }

  return false;
}

function isGeminiActivityLog(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some(
    (item) =>
      isRecord(item) &&
      ((typeof item.titleUrl === 'string' && item.titleUrl.includes('gemini.google.com')) ||
        (typeof item.header === 'string' && /gemini apps/i.test(item.header))),
  );
}

function isGeminiConversationsExport(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.conversations)) {
    return false;
  }

  return (value.conversations as unknown[]).some(
    (conversation) =>
      isRecord(conversation) &&
      Array.isArray(conversation.messages) &&
      (conversation.messages as unknown[]).some(
        (message) =>
          isRecord(message) &&
          typeof message.role === 'string' &&
          ('text' in message || 'content' in message),
      ),
  );
}

function isDoubaoSession(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    return false;
  }

  return (
    typeof value.session_id === 'string' &&
    (value.messages as unknown[]).some(
      (message) =>
        isRecord(message) &&
        typeof message.role === 'string' &&
        ('content' in message || 'text' in message),
    )
  );
}

function isDoubaoMetadata(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.sessions)) {
    return false;
  }

  return (value.sessions as unknown[]).some(
    (session) =>
      isRecord(session) &&
      typeof session.session_id === 'string' &&
      (typeof session.export_path === 'string' || typeof session.path === 'string'),
  );
}

function isMistralFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  if (/\bmistral\b/.test(lower)) {
    return true;
  }

  // Match "le-chat" / "le_chat" as a token — not a substring of names like "google-chat".
  return /(?:^|[^a-z])le[-_]?chat(?:[^a-z]|$)/.test(lower);
}

function assertNotMistralExport(raw: unknown): void {
  if (!Array.isArray(raw)) {
    return;
  }

  if (raw.some(isMistralMessage)) {
    throw new Error(MISTRAL_UNSUPPORTED_MESSAGE);
  }
}

function assertNotMistralZip(entryNames: string[]): void {
  if (entryNames.some((name) => /(^|\/)chat-[0-9a-f-]+\.json$/i.test(name))) {
    throw new Error(MISTRAL_UNSUPPORTED_MESSAGE);
  }
}

function addScore(
  scores: Map<DetectedAdapterName, DetectExportCandidate>,
  adapter: DetectedAdapterName,
  reason: string,
  points: number,
): void {
  const existing = scores.get(adapter);
  if (existing) {
    existing.score += points;
    existing.reason = reason;
    return;
  }

  scores.set(adapter, { adapter, reason, score: points });
}

function scoreJsonItems(raw: unknown): DetectExportCandidate[] {
  const scores = new Map<DetectedAdapterName, DetectExportCandidate>();

  if (!Array.isArray(raw)) {
    if (isLibreChatConversation(raw)) {
      addScore(scores, 'librechat', 'LibreChat conversation export (conversationId)', 12);
    }
    if (isLobeChatSession(raw)) {
      addScore(scores, 'lobechat', 'LobeChat OpenAI-format session export', 12);
    }
    return [...scores.values()];
  }

  for (const item of raw) {
    if (isAnythingLlmChatLog(item)) {
      addScore(scores, 'anythingllm', 'AnythingLLM chat log export (prompt/response)', 12);
    }
    if (isLibreChatConversation(item)) {
      addScore(scores, 'librechat', 'LibreChat conversation export (conversationId)', 12);
    }
    if (isLobeChatSession(item)) {
      addScore(scores, 'lobechat', 'LobeChat OpenAI-format session export', 12);
    }
    if (isOpenWebUiExportItem(item)) {
      addScore(scores, 'openwebui', 'Open WebUI chat export (history)', 10);
    }
    if (isClaudeConversation(item)) {
      addScore(scores, 'claude', 'Claude conversation export (chat_messages)', 10);
    }
    if (isDeepSeekConversation(item)) {
      addScore(scores, 'deepseek', 'DeepSeek conversation graph (fragments)', 12);
    }
    if (isChatGptConversation(item)) {
      addScore(scores, 'chatgpt', 'ChatGPT conversation graph (mapping)', 10);
    }
  }

  return [...scores.values()].sort((left, right) => right.score - left.score);
}

function scoreZipEntryNames(entryNames: string[]): DetectExportCandidate[] {
  const scores = new Map<DetectedAdapterName, DetectExportCandidate>();
  const normalized = entryNames.map((name) => name.replace(/\\/g, '/'));

  if (entryNames.some((name) => name.endsWith('conversation_asset_file_names.json'))) {
    addScore(scores, 'chatgpt', 'ChatGPT export ZIP (attachment index)', 12);
  }

  if (entryNames.some((name) => isShardedConversationsEntry(name))) {
    addScore(scores, 'chatgpt', 'ChatGPT export ZIP (conversations shards)', 14);
  }

  if (entryNames.some((name) => zipBaseName(name).toLowerCase() === 'export_manifest.json')) {
    addScore(scores, 'chatgpt', 'ChatGPT export ZIP (export_manifest.json)', 8);
  }

  if (entryNames.some((name) => name.endsWith('.dat'))) {
    addScore(scores, 'chatgpt', 'ChatGPT export ZIP (attachment files)', 10);
  }

  if (entryNames.some((name) => /(^|\/)users\.json$/i.test(name))) {
    addScore(scores, 'claude', 'Claude export ZIP (users.json)', 12);
  }

  if (
    entryNames.some(
      (name) => /(^|\/)user\.json$/i.test(name) && !name.endsWith('users.json'),
    )
  ) {
    addScore(scores, 'chatgpt', 'ChatGPT export ZIP (user.json)', 12);
  }

  return [...scores.values()].sort((left, right) => right.score - left.score);
}

function scoreFileName(fileName: string): DetectExportCandidate[] {
  const lower = fileName.toLowerCase();
  const scores = new Map<DetectedAdapterName, DetectExportCandidate>();

  if (/chatgpt|openai/.test(lower)) {
    addScore(scores, 'chatgpt', 'File name suggests ChatGPT', 4);
  }
  if (/claude|anthropic/.test(lower)) {
    addScore(scores, 'claude', 'File name suggests Claude', 4);
  }
  if (/open[-_]?webui|webui/.test(lower)) {
    addScore(scores, 'openwebui', 'File name suggests Open WebUI', 4);
  }
  if (/librechat|libre[-_]?chat/.test(lower)) {
    addScore(scores, 'librechat', 'File name suggests LibreChat', 4);
  }
  if (/gemini/.test(lower)) {
    addScore(scores, 'gemini', 'File name suggests Gemini Takeout', 4);
  }
  if (/doubao|豆包/.test(lower)) {
    addScore(scores, 'doubao', 'File name suggests Doubao', 4);
  }
  if (/deepseek/.test(lower)) {
    addScore(scores, 'deepseek', 'File name suggests DeepSeek', 4);
  }
  if (/lobe[-_]?chat|lobehub/.test(lower)) {
    addScore(scores, 'lobechat', 'File name suggests LobeChat', 4);
  }
  if (/anythingllm|anything[-_]?llm/.test(lower)) {
    addScore(scores, 'anythingllm', 'File name suggests AnythingLLM', 4);
  }

  return [...scores.values()];
}

function mergeCandidates(groups: DetectExportCandidate[][]): DetectExportCandidate[] {
  const merged = new Map<DetectedAdapterName, DetectExportCandidate>();

  for (const group of groups) {
    for (const candidate of group) {
      addScore(merged, candidate.adapter, candidate.reason, candidate.score);
    }
  }

  return [...merged.values()].sort((left, right) => right.score - left.score);
}

function buildResult(candidates: DetectExportCandidate[]): DetectExportResult {
  const [top, second] = candidates;
  if (!top) {
    throw new Error(
      'Could not detect export format. Choose the source platform manually, or verify the file is a supported export.',
    );
  }

  const closeSecond = second && top.score - second.score < 5;
  const confidence: DetectionConfidence = closeSecond ? 'low' : 'high';

  return {
    adapter: top.adapter,
    reason: top.reason,
    confidence,
    alternatives: candidates.slice(1, 3).map(({ adapter, reason }) => ({ adapter, reason })),
  };
}

function detectFromJson(raw: unknown, fileName: string): DetectExportResult {
  if (isLibreChatConversation(raw)) {
    return buildResult(
      mergeCandidates([
        [{ adapter: 'librechat', reason: 'LibreChat conversation export', score: 12 }],
        scoreFileName(fileName),
      ]),
    );
  }

  if (isLobeChatSession(raw, fileName)) {
    return buildResult(
      mergeCandidates([
        [{ adapter: 'lobechat', reason: 'LobeChat OpenAI-format session export', score: 12 }],
        scoreFileName(fileName),
      ]),
    );
  }

  if (isDeepSeekConversation(raw)) {
    return buildResult(
      mergeCandidates([
        [{ adapter: 'deepseek', reason: 'DeepSeek conversation export', score: 12 }],
        scoreFileName(fileName),
      ]),
    );
  }

  if (!Array.isArray(raw)) {
    throw new Error('Export JSON must be an array or a recognized conversation object');
  }

  if (raw.length === 0) {
    throw new Error('Export file is empty — cannot detect format');
  }

  assertNotMistralExport(raw);

  return buildResult(mergeCandidates([scoreJsonItems(raw), scoreFileName(fileName)]));
}

function detectFromJsonl(bytes: Uint8Array, fileName: string): DetectExportResult {
  const lines = strFromU8(bytes).split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('Export file is empty — cannot detect format');
  }

  const firstLine = JSON.parse(lines[0]!) as unknown;
  if (isAnythingLlmChatLog(firstLine)) {
    return buildResult(
      mergeCandidates([
        [{ adapter: 'anythingllm', reason: 'AnythingLLM chat log JSONL export', score: 12 }],
        scoreFileName(fileName),
      ]),
    );
  }

  throw new Error('Could not detect export format from JSONL');
}

function detectFromZip(bytes: Uint8Array, fileName: string): DetectExportResult {
  const entries = unzipSync(bytes);
  const entryNames = Object.keys(entries);
  assertNotMistralZip(entryNames);

  const groups: DetectExportCandidate[][] = [scoreZipEntryNames(entryNames), scoreFileName(fileName)];

  const conversationsEntry = entryNames.find(isMainConversationsEntry);
  const shardedConversationEntries = entryNames
    .filter(isShardedConversationsEntry)
    .sort((left, right) => {
      const leftMatch = /^conversations-(\d+)\.json$/i.exec(zipBaseName(left));
      const rightMatch = /^conversations-(\d+)\.json$/i.exec(zipBaseName(right));
      const leftNum = leftMatch ? Number.parseInt(leftMatch[1]!, 10) : 0;
      const rightNum = rightMatch ? Number.parseInt(rightMatch[1]!, 10) : 0;
      return leftNum - rightNum;
    });

  if (conversationsEntry) {
    const conversationsBytes = entries[conversationsEntry];
    if (conversationsBytes) {
      const raw = JSON.parse(strFromU8(conversationsBytes)) as unknown;
      assertNotMistralExport(raw);

      if (isGeminiConversationsExport(raw)) {
        groups.push([
          { adapter: 'gemini', reason: 'Gemini Takeout ZIP (conversations wrapper)', score: 12 },
        ]);
      } else {
        groups.push(scoreJsonItems(raw));
      }
    }
  } else if (shardedConversationEntries.length > 0) {
    const firstShardBytes = entries[shardedConversationEntries[0]!];
    if (firstShardBytes) {
      const raw = JSON.parse(strFromU8(firstShardBytes)) as unknown;
      assertNotMistralExport(raw);
      groups.push(scoreJsonItems(raw));
    }
  }

  for (const activityEntry of entryNames.filter((name) =>
    name.toLowerCase().includes('myactivity.json'),
  )) {
    const activityBytes = entries[activityEntry];
    if (!activityBytes) {
      continue;
    }

    try {
      const raw = JSON.parse(strFromU8(activityBytes)) as unknown;
      if (isGeminiActivityLog(raw)) {
        groups.push([
          { adapter: 'gemini', reason: 'Gemini Takeout ZIP (MyActivity.json)', score: 14 },
        ]);
        break;
      }
    } catch {
      // ignore invalid activity log during detection
    }
  }

  const metadataEntry = entryNames.find((name) => name.toLowerCase().endsWith('metadata.json'));
  if (metadataEntry) {
    const metadataBytes = entries[metadataEntry];
    if (metadataBytes) {
      try {
        const raw = JSON.parse(strFromU8(metadataBytes)) as unknown;
        if (isDoubaoMetadata(raw)) {
          groups.push([
            { adapter: 'doubao', reason: 'Doubao export ZIP (metadata.json sessions)', score: 14 },
          ]);
        }
      } catch {
        // ignore invalid metadata during detection
      }
    }
  }

  const jsonEntries = Object.entries(entries).filter(
    ([name]) =>
      name.toLowerCase().endsWith('.json') &&
      !isMainConversationsEntry(name) &&
      !isShardedConversationsEntry(name) &&
      !name.toLowerCase().endsWith('metadata.json'),
  );
  for (const [name, fileBytes] of jsonEntries) {
    try {
      const raw = JSON.parse(strFromU8(fileBytes)) as unknown;
      if (Array.isArray(raw)) {
        groups.push(scoreJsonItems(raw));
      } else if (isDoubaoSession(raw)) {
        groups.push([{ adapter: 'doubao', reason: `Doubao export (${name})`, score: 12 }]);
      } else if (isLibreChatConversation(raw)) {
        groups.push([{ adapter: 'librechat', reason: `LibreChat export (${name})`, score: 12 }]);
      } else if (isLobeChatSession(raw, name)) {
        groups.push([{ adapter: 'lobechat', reason: `LobeChat export (${name})`, score: 12 }]);
      } else if (isDeepSeekConversation(raw)) {
        groups.push([{ adapter: 'deepseek', reason: `DeepSeek export (${name})`, score: 12 }]);
      }
    } catch {
      // ignore invalid json entries during detection
    }
  }

  const jsonlEntries = Object.entries(entries).filter(([name]) =>
    name.toLowerCase().endsWith('.jsonl'),
  );
  for (const [name, fileBytes] of jsonlEntries) {
    const lines = strFromU8(fileBytes)
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      continue;
    }

    try {
      const firstLine = JSON.parse(lines[0]!) as unknown;
      if (isAnythingLlmChatLog(firstLine)) {
        groups.push([
          { adapter: 'anythingllm', reason: `AnythingLLM export (${name})`, score: 12 },
        ]);
      }
    } catch {
      // ignore invalid jsonl during detection
    }
  }

  if (groups.every((group) => group.length === 0)) {
    throw new Error(
      'ZIP does not match a known export layout. Expected ChatGPT, Claude, Open WebUI, LibreChat, Gemini, Doubao, DeepSeek, LobeChat, or AnythingLLM.',
    );
  }

  return buildResult(mergeCandidates(groups));
}

export function detectExportAdapter(fileName: string, bytes: Uint8Array): DetectExportResult {
  const lower = fileName.toLowerCase();

  if (isMistralFileName(fileName)) {
    throw new Error(MISTRAL_UNSUPPORTED_MESSAGE);
  }

  if (lower.endsWith('.zip')) {
    return detectFromZip(bytes, fileName);
  }

  if (lower.endsWith('.jsonl')) {
    return detectFromJsonl(bytes, fileName);
  }

  if (lower.endsWith('.json')) {
    const raw = JSON.parse(strFromU8(bytes)) as unknown;
    return detectFromJson(raw, fileName);
  }

  throw new Error('Unsupported file type — upload a .json, .jsonl, or .zip export');
}
