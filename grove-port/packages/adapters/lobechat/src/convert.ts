import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildLobeChatGrovePortBundle as buildLobeChatGrovePortBundleBytes,
  previewLobeChatExport as previewLobeChatExportBytes,
  type ConvertLobeChatBytesOptions,
  type LobeChatExportStats,
} from './convert-bytes.js';

export type {
  ConvertLobeChatBytesOptions,
  ConvertLobeChatBytesResult,
  LobeChatExportBuildResult,
  LobeChatExportStats,
} from './convert-bytes.js';
export { convertLobeChatExportToBytes } from './convert-bytes.js';

export interface ConvertLobeChatOptions extends Partial<ConvertLobeChatBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertLobeChatResult extends LobeChatExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertLobeChatOptions,
): Promise<ConvertLobeChatBytesOptions> {
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

  throw new Error('LobeChat convert requires inputPath or fileName+bytes');
}

export async function buildLobeChatGrovePortBundle(options: ConvertLobeChatOptions) {
  return buildLobeChatGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewLobeChatExport(
  options: Omit<ConvertLobeChatOptions, 'outputPath'>,
): Promise<LobeChatExportStats> {
  return previewLobeChatExportBytes(await resolveBytesOptions(options));
}

export async function convertLobeChatExport(
  options: ConvertLobeChatOptions & { outputPath: string },
): Promise<ConvertLobeChatResult> {
  const built = await buildLobeChatGrovePortBundleBytes(await resolveBytesOptions(options));

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

export { loadLobeChatExportFromBytes, type LobeChatExportBundle } from './load-input-bytes.js';
