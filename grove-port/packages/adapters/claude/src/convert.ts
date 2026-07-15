import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildClaudeGrovePortBundle as buildClaudeGrovePortBundleBytes,
  previewClaudeExport as previewClaudeExportBytes,
  type ClaudeExportStats,
  type ConvertClaudeBytesOptions,
} from './convert-bytes.js';

export type {
  ClaudeExportBuildResult,
  ClaudeExportStats,
  ConvertClaudeBytesResult,
  ConvertClaudeBytesOptions,
} from './convert-bytes.js';
export { convertClaudeExportToBytes } from './convert-bytes.js';

export interface ConvertClaudeOptions extends Partial<ConvertClaudeBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertClaudeResult extends ClaudeExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertClaudeOptions,
): Promise<ConvertClaudeBytesOptions> {
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

  throw new Error('Claude convert requires inputPath or fileName+bytes');
}

export async function buildClaudeGrovePortBundle(options: ConvertClaudeOptions) {
  return buildClaudeGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewClaudeExport(
  options: Omit<ConvertClaudeOptions, 'outputPath'>,
): Promise<ClaudeExportStats> {
  return previewClaudeExportBytes(await resolveBytesOptions(options));
}

export async function convertClaudeExport(
  options: ConvertClaudeOptions & { outputPath: string },
): Promise<ConvertClaudeResult> {
  const built = await buildClaudeGrovePortBundleBytes(await resolveBytesOptions(options));

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

export { loadClaudeConversations, loadClaudeExport, loadClaudeExportFromBytes } from './load-input.js';
export { selectActiveLineage } from './select-lineage.js';
export { formatMessageText } from './format-message.js';
