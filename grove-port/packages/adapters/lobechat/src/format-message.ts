import type { LobeChatMessage, LobeChatToolCall } from './types.js';

function renderToolCall(toolCall: LobeChatToolCall): string {
  const name = toolCall.function?.name?.trim() || 'tool';
  const args = toolCall.function?.arguments?.trim();
  return args ? `[tool_call:${name}] ${args}` : `[tool_call:${name}]`;
}

export function formatMessageText(message: LobeChatMessage): string {
  if (typeof message.content === 'string') {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    const parts = message.content
      .map((part) => {
        if (typeof part.text === 'string' && part.text.trim()) {
          return part.text.trim();
        }
        if (part.type && part.type !== 'text') {
          return `[${part.type}]`;
        }
        return null;
      })
      .filter((part): part is string => Boolean(part));

    if (parts.length > 0) {
      return parts.join('\n\n');
    }
  }

  if (message.tool_calls?.length) {
    return message.tool_calls.map(renderToolCall).join('\n\n');
  }

  return '';
}

export function isImportableMessage(message: LobeChatMessage): boolean {
  const role = message.role?.trim().toLowerCase();
  if (role === 'system') {
    return false;
  }

  return Boolean(formatMessageText(message));
}

export function resolveSender(message: LobeChatMessage, model: string): string {
  if (message.role === 'user') {
    return message.name?.trim() || 'user';
  }

  return message.name?.trim() || model || 'assistant';
}

export function resolveModel(model: string | undefined): string {
  return model?.trim() || 'lobechat';
}

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
