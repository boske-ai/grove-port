import type { ChatGptCitation, ChatGptMessage } from './types.js';
import { pointerToDatName } from './assets.js';

const TETHER_RESULT_MAX_CHARS = 8_000;

function resolveAssetLabel(
  assetPointer: string,
  assetFileNames: Record<string, string>,
): string {
  const fileKey = assetPointer.split('://').pop() ?? assetPointer;
  const datName = fileKey.endsWith('.dat') ? fileKey : `${fileKey}.dat`;
  return assetFileNames[datName] ?? assetFileNames[fileKey] ?? fileKey;
}

function formatAssetPart(
  part: Record<string, unknown>,
  assetFileNames: Record<string, string>,
  embeddedAssets: Set<string>,
): string {
  const pointer = typeof part.asset_pointer === 'string' ? part.asset_pointer : 'unknown';
  const datName = pointerToDatName(pointer);
  const label = resolveAssetLabel(pointer, assetFileNames);

  if (embeddedAssets.has(datName)) {
    return `[Image: ${label}]`;
  }

  return `[Image attachment: ${label} — not included in export; re-upload in Boske Sources]`;
}

function formatParts(
  parts: unknown[],
  assetFileNames: Record<string, string>,
  embeddedAssets: Set<string> = new Set(),
): string {
  const chunks: string[] = [];

  for (const part of parts) {
    if (typeof part === 'string') {
      if (part.trim()) {
        chunks.push(part.trim());
      }
      continue;
    }

    if (typeof part === 'object' && part !== null) {
      const record = part as Record<string, unknown>;
      if (typeof record.asset_pointer === 'string') {
        chunks.push(formatAssetPart(record, assetFileNames, embeddedAssets));
      } else {
        chunks.push(`\`\`\`json\n${JSON.stringify(part, null, 2)}\n\`\`\``);
      }
    }
  }

  return chunks.join('\n\n');
}

function formatTetherResult(result: string | undefined): string {
  if (!result) {
    return '';
  }

  if (result.length <= TETHER_RESULT_MAX_CHARS) {
    return result;
  }

  return `${result.slice(0, TETHER_RESULT_MAX_CHARS)}\n\n[… browsing results truncated …]`;
}

/**
 * Format ChatGPT message content to plain/markdown text.
 * Ported from Boske import/importers.js (MIT-compatible reimplementation).
 */
export function formatMessageText(
  messageData: ChatGptMessage,
  assetFileNames: Record<string, string> = {},
  embeddedAssets: Set<string> = new Set(),
): string {
  const contentType = messageData.content.content_type;
  const isPlainText = contentType === 'text';
  let messageText = '';

  if ((isPlainText || contentType === 'multimodal_text') && messageData.content.parts) {
    messageText = formatParts(messageData.content.parts, assetFileNames, embeddedAssets);
  } else if (contentType === 'code') {
    messageText = `\`\`\`${messageData.content.language ?? ''}\n${messageData.content.text ?? ''}\n\`\`\``;
  } else if (contentType === 'execution_output') {
    messageText = `Execution Output:\n> ${messageData.content.text ?? ''}`;
  } else if (
    contentType === 'tether_browsing_display' ||
    contentType === 'tether_quote'
  ) {
    messageText = formatTetherResult(messageData.content.result ?? messageData.content.text);
  } else if (messageData.content.parts) {
    messageText = formatParts(messageData.content.parts, assetFileNames, embeddedAssets);
  } else if (messageData.content.text) {
    messageText = messageData.content.text;
  } else {
    messageText = `\`\`\`json\n${JSON.stringify(messageData.content, null, 2)}\n\`\`\``;
  }

  if (isPlainText && messageData.author.role !== 'user') {
    messageText = processAssistantMessage(messageData, messageText);
  }

  return messageText;
}

export function processAssistantMessage(messageData: ChatGptMessage, messageText: string): string {
  if (!messageText) {
    return messageText;
  }

  const citations = messageData.metadata?.citations ?? [];
  const sortedCitations = [...citations].sort(
    (a: ChatGptCitation, b: ChatGptCitation) => (b.start_ix ?? 0) - (a.start_ix ?? 0),
  );

  let result = messageText;
  for (const citation of sortedCitations) {
    if (
      citation.metadata?.type !== 'webpage' ||
      typeof citation.start_ix !== 'number' ||
      typeof citation.end_ix !== 'number' ||
      citation.start_ix >= citation.end_ix
    ) {
      continue;
    }

    const replacement = ` ([${citation.metadata.title ?? 'source'}](${citation.metadata.url ?? ''}))`;
    result = result.slice(0, citation.start_ix) + replacement + result.slice(citation.end_ix);
  }

  return result;
}

export function resolveSender(role: string, modelSlug: string | undefined): string {
  if (role === 'user') {
    return 'user';
  }
  if (role === 'tool') {
    return 'tool';
  }
  if (modelSlug?.includes('gpt-4')) {
    return 'GPT-4';
  }
  return 'GPT-3.5';
}

export function resolveModel(modelSlug: string | undefined): string {
  if (modelSlug?.includes('gpt-4')) {
    return 'gpt-4';
  }
  if (modelSlug?.includes('gpt-3.5')) {
    return 'gpt-3.5-turbo';
  }
  return modelSlug ?? 'gpt-3.5-turbo';
}

export function toIsoTimestamp(unixSeconds: number | null | undefined): string {
  if (typeof unixSeconds !== 'number' || Number.isNaN(unixSeconds)) {
    return new Date().toISOString();
  }
  return new Date(unixSeconds * 1000).toISOString();
}
