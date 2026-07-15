import type { GeminiActivityDetail, GeminiActivityEntry, GeminiConversationMessage } from './types.js';

export function extractConversationIdFromTitleUrl(titleUrl: string | undefined): string | null {
  if (!titleUrl) {
    return null;
  }

  const match = titleUrl.match(/\/app\/c\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function detailValue(details: GeminiActivityDetail[] | undefined, names: string[]): string | null {
  if (!details) {
    return null;
  }

  for (const name of names) {
    const detail = details.find((item) => item.name?.toLowerCase() === name.toLowerCase());
    if (detail?.value?.trim()) {
      return detail.value.trim();
    }
  }

  return null;
}

export function parseActivityMessages(entry: GeminiActivityEntry): Array<{
  role: 'user' | 'assistant';
  text: string;
  createdAt?: string;
}> {
  const details = entry.details ?? entry.userInteractions ?? [];
  const messages: Array<{ role: 'user' | 'assistant'; text: string; createdAt?: string }> = [];

  const prompt =
    detailValue(details, ['Prompt', 'Prompted', 'Request']) ??
    detailValue(details, ['You asked']);
  const response =
    detailValue(details, ['Response', 'Responded', 'Answer']) ??
    detailValue(details, ['Gemini said']);

  if (prompt) {
    messages.push({ role: 'user', text: prompt, createdAt: entry.time });
  }

  if (response) {
    messages.push({ role: 'assistant', text: response, createdAt: entry.time });
  }

  return messages;
}

export function formatConversationMessage(message: GeminiConversationMessage): string {
  if (message.content?.trim()) {
    return message.content.trim();
  }

  if (message.text?.trim()) {
    return message.text.trim();
  }

  return '';
}

export function toIsoTimestamp(isoTimestamp: string | undefined, fallback: string): string {
  if (!isoTimestamp) {
    return fallback;
  }

  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toISOString();
}

export function resolveSender(role: 'user' | 'assistant'): string {
  return role === 'user' ? 'user' : 'gemini';
}
