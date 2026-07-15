import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildChatGptGrovePortBundle as buildChatGptGrovePortBundleBytes,
  previewChatGptExport as previewChatGptExportBytes,
  type ChatGptExportStats,
  type ConvertChatGptBytesOptions,
} from './convert-bytes.js';

export type {
  ChatGptExportStats,
  ConvertChatGptBytesResult,
  ConvertChatGptBytesOptions,
} from './convert-bytes.js';
export { convertChatGptExportToBytes } from './convert-bytes.js';

export type ChatGptExportBuildResult = Awaited<
  ReturnType<typeof buildChatGptGrovePortBundleBytes>
>;

export interface ConvertChatGptOptions extends Partial<ConvertChatGptBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertChatGptResult extends ChatGptExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertChatGptOptions,
): Promise<ConvertChatGptBytesOptions> {
  if (options.fileName && options.bytes) {
    return {
      fileName: options.fileName,
      bytes: options.bytes,
      userId: options.userId,
      userEmail: options.userEmail,
      label: options.label,
    };
  }

  if (options.inputPath) {
    const bytes = new Uint8Array(await readFile(options.inputPath));
    return {
      fileName: path.basename(options.inputPath),
      bytes,
      userId: options.userId,
      userEmail: options.userEmail,
      label: options.label,
    };
  }

  throw new Error('ChatGPT convert requires inputPath or fileName+bytes');
}

export async function buildChatGptGrovePortBundle(
  options: ConvertChatGptOptions,
): Promise<ChatGptExportBuildResult> {
  return buildChatGptGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewChatGptExport(
  options: Omit<ConvertChatGptOptions, 'outputPath'>,
): Promise<ChatGptExportStats> {
  return previewChatGptExportBytes(await resolveBytesOptions(options));
}

export async function convertChatGptExport(
  options: ConvertChatGptOptions & { outputPath: string },
): Promise<ConvertChatGptResult> {
  const built = await buildChatGptGrovePortBundleBytes(await resolveBytesOptions(options));

  const { manifest: finalManifest, outputPath } = await packEnvelope({
    outputPath: options.outputPath,
    manifest: built.manifest,
    data: built.data,
    attachments: built.packAttachments,
  });

  return {
    outputPath,
    manifest: finalManifest,
    ...built.stats,
  };
}

export { flattenConversationMapping } from './flatten-mapping.js';
export { formatMessageText, processAssistantMessage } from './format-message.js';
export {
  loadChatGptConversations,
  loadChatGptExport,
  loadChatGptExportFromBytes,
} from './load-input.js';
