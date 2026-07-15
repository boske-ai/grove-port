import type { LibreChatContentPart, LibreChatMessage } from './types.js';

function renderContentPart(part: LibreChatContentPart): string | null {
  if (part.type === 'text' || part.text !== undefined) {
    if (typeof part.text === 'string') {
      return part.text.trim() ? part.text.trim() : null;
    }
    if (part.text && typeof part.text === 'object' && part.text.value?.trim()) {
      return part.text.value.trim();
    }
  }

  if (part.type && part.type !== 'text') {
    return `[${part.type}]`;
  }

  return null;
}

export function formatMessageText(message: LibreChatMessage): string {
  if (message.text?.trim()) {
    return message.text.trim();
  }

  if (!message.content?.length) {
    return '';
  }

  return message.content
    .map(renderContentPart)
    .filter((part): part is string => Boolean(part?.trim()))
    .join('\n\n')
    .trim();
}

export function isImportableMessage(message: LibreChatMessage): boolean {
  if (message.error || message.unfinished) {
    return false;
  }

  return Boolean(formatMessageText(message));
}

export function resolveSender(message: LibreChatMessage): string {
  if (message.isCreatedByUser) {
    return message.sender?.trim() || 'user';
  }

  return message.sender?.trim() || message.model?.trim() || 'assistant';
}

export function resolveEndpoint(endpoint: string | undefined): string {
  return endpoint?.trim() || 'custom';
}

export function resolveModel(model: string | undefined, endpoint: string | undefined): string {
  return model?.trim() || endpoint?.trim() || 'librechat';
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

export function countAttachmentReferences(messages: LibreChatMessage[]): number {
  return messages.reduce((count, message) => {
    const attachmentParts = message.content?.filter((part) => part.type === 'image_file') ?? [];
    return count + attachmentParts.length;
  }, 0);
}
