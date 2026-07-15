import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildMistralGrovePortBundle as buildMistralGrovePortBundleBytes,
  previewMistralExport as previewMistralExportBytes,
  type ConvertMistralBytesOptions,
  type MistralExportStats,
} from './convert-bytes.js';

export type {
  ConvertMistralBytesOptions,
  ConvertMistralBytesResult,
  MistralExportBuildResult,
  MistralExportStats,
} from './convert-bytes.js';
export { convertMistralExportToBytes } from './convert-bytes.js';

export interface ConvertMistralOptions extends Partial<ConvertMistralBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertMistralResult extends MistralExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertMistralOptions,
): Promise<ConvertMistralBytesOptions> {
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

  throw new Error('Mistral convert requires inputPath or fileName+bytes');
}

export async function buildMistralGrovePortBundle(options: ConvertMistralOptions) {
  return buildMistralGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewMistralExport(
  options: Omit<ConvertMistralOptions, 'outputPath'>,
): Promise<MistralExportStats> {
  return previewMistralExportBytes(await resolveBytesOptions(options));
}

export async function convertMistralExport(
  options: ConvertMistralOptions & { outputPath: string },
): Promise<ConvertMistralResult> {
  const built = await buildMistralGrovePortBundleBytes(await resolveBytesOptions(options));

  const { manifest: finalManifest, outputPath } = await packEnvelope({
    outputPath: options.outputPath,
    manifest: built.manifest,
    data: built.data,
    attachments: [],
  });

  return {
    outputPath,
    manifest: finalManifest,
    ...built.stats,
  };
}

export { loadMistralConversations, loadMistralExport, loadMistralExportFromBytes } from './load-input.js';
export { formatMessageText, sortMessagesByTimestamp } from './format-message.js';
