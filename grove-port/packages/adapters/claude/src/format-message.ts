import type { ClaudeContentBlock, ClaudeMessage } from './types.js';

function renderContentBlock(block: ClaudeContentBlock): string | null {
  switch (block.type) {
    case 'text':
      return block.text?.trim() ? block.text : null;
    case 'thinking':
      return null;
    case 'tool_use':
      return block.name ? `[tool: ${block.name}]` : null;
    case 'tool_result':
      return null;
    default:
      return block.text?.trim() ? block.text : null;
  }
}

export function formatMessageText(message: ClaudeMessage): string {
  if (message.text?.trim()) {
    return message.text.trim();
  }

  if (!message.content?.length) {
    return '';
  }

  const parts = message.content
    .map(renderContentBlock)
    .filter((part): part is string => Boolean(part?.trim()));

  return parts.join('\n\n').trim();
}

export function resolveSender(sender: string): string {
  if (sender === 'human') {
    return 'user';
  }
  if (sender === 'assistant') {
    return 'Claude';
  }
  return sender;
}

export function resolveModel(modelSlug: string | undefined): string {
  return modelSlug?.trim() || 'claude';
}

export function toIsoTimestamp(isoTimestamp: string | undefined): string {
  if (!isoTimestamp) {
    throw new Error('Claude message is missing created_at timestamp');
  }
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid Claude timestamp: ${isoTimestamp}`);
  }
  return parsed.toISOString();
}
