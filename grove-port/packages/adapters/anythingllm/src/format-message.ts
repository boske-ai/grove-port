import type { AnythingLlmChatLog } from './types.js';

export function toIsoTimestamp(value: number | string | undefined, fallback: string): string {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }
    return parsed.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toISOString();
}

export function conversationKeyForLog(log: AnythingLlmChatLog): string {
  const workspace = log.workspace_name?.trim() || 'default';
  const thread = log.thread_id !== undefined ? String(log.thread_id) : String(log.id);
  return `${workspace}::${thread}`;
}

export function conversationTitle(logs: AnythingLlmChatLog[]): string {
  const workspace = logs[0]?.workspace_name?.trim();
  const promptPreview = logs[0]?.prompt?.trim().slice(0, 60);
  if (workspace && promptPreview) {
    return `${workspace}: ${promptPreview}`;
  }
  if (workspace) {
    return workspace;
  }
  if (promptPreview) {
    return promptPreview;
  }
  return 'Untitled AnythingLLM conversation';
}
