import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildLibreChatGrovePortBundle as buildLibreChatGrovePortBundleBytes,
  previewLibreChatExport as previewLibreChatExportBytes,
  type ConvertLibreChatBytesOptions,
  type LibreChatExportStats,
} from './convert-bytes.js';

export type {
  ConvertLibreChatBytesOptions,
  ConvertLibreChatBytesResult,
  LibreChatExportBuildResult,
  LibreChatExportStats,
} from './convert-bytes.js';
export { convertLibreChatExportToBytes } from './convert-bytes.js';

export interface ConvertLibreChatOptions extends Partial<ConvertLibreChatBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertLibreChatResult extends LibreChatExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertLibreChatOptions,
): Promise<ConvertLibreChatBytesOptions> {
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

  throw new Error('LibreChat convert requires inputPath or fileName+bytes');
}

export async function buildLibreChatGrovePortBundle(options: ConvertLibreChatOptions) {
  return buildLibreChatGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewLibreChatExport(
  options: Omit<ConvertLibreChatOptions, 'outputPath'>,
): Promise<LibreChatExportStats> {
  return previewLibreChatExportBytes(await resolveBytesOptions(options));
}

export async function convertLibreChatExport(
  options: ConvertLibreChatOptions & { outputPath: string },
): Promise<ConvertLibreChatResult> {
  const built = await buildLibreChatGrovePortBundleBytes(await resolveBytesOptions(options));

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

export { loadLibreChatExportFromBytes, type LibreChatExportBundle } from './load-input-bytes.js';
