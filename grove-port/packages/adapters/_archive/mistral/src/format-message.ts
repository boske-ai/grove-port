import type { MistralContentChunk, MistralMessage } from './types.js';

function processContentChunks(chunks: MistralContentChunk[]): string {
  const parts: string[] = [];

  for (const chunk of chunks) {
    if (chunk.type === 'text' && chunk.text?.trim()) {
      parts.push(chunk.text.trim());
    } else if (chunk.type === 'reference' && chunk.referenceIds?.length) {
      parts.push(chunk.referenceIds.map((id) => `[^${id}]`).join(''));
    }
  }

  return parts.join('\n').trim();
}

export function formatMessageText(message: MistralMessage): string {
  if (message.contentChunks?.length) {
    const fromChunks = processContentChunks(message.contentChunks);
    if (fromChunks) {
      return fromChunks;
    }
  }

  return message.content?.trim() ?? '';
}

export function deriveConversationTitle(messages: MistralMessage[]): string {
  const sorted = sortMessagesByTimestamp(messages);
  const firstUser = sorted.find((message) => message.role === 'user');
  const text = firstUser ? formatMessageText(firstUser) : '';

  if (!text) {
    return 'Untitled Mistral conversation';
  }

  return text.length <= 50 ? text : `${text.slice(0, 50).trim()}...`;
}

export function sortMessagesByTimestamp(messages: MistralMessage[]): MistralMessage[] {
  return [...messages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export function resolveSender(role: string): string {
  if (role === 'user') {
    return 'user';
  }
  if (role === 'assistant') {
    return 'Mistral';
  }
  return role;
}

export function toIsoTimestamp(isoTimestamp: string | undefined): string {
  if (!isoTimestamp) {
    throw new Error('Mistral message is missing createdAt timestamp');
  }
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid Mistral timestamp: ${isoTimestamp}`);
  }
  return parsed.toISOString();
}

export function countAttachmentReferences(messages: MistralMessage[]): number {
  return messages.reduce((total, message) => total + (message.files?.length ?? 0), 0);
}
