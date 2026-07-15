import type { DoubaoMessage } from './types.js';

export function formatMessageText(message: DoubaoMessage): string {
  if (message.content?.trim()) {
    return message.content.trim();
  }

  if (message.text?.trim()) {
    return message.text.trim();
  }

  return '';
}

export function isImportableMessage(message: DoubaoMessage): boolean {
  return Boolean(formatMessageText(message));
}

export function resolveSender(message: DoubaoMessage): string {
  if (message.role === 'user') {
    return 'user';
  }

  return 'doubao';
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

export function countAttachmentReferences(messages: DoubaoMessage[]): number {
  return messages.reduce((count, message) => {
    const text = formatMessageText(message);
    return count + (/\[attachment:/i.test(text) ? 1 : 0);
  }, 0);
}
