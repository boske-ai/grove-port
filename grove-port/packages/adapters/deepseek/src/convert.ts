import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildDeepSeekGrovePortBundle as buildDeepSeekGrovePortBundleBytes,
  previewDeepSeekExport as previewDeepSeekExportBytes,
  type ConvertDeepSeekBytesOptions,
  type DeepSeekExportStats,
} from './convert-bytes.js';

export type {
  ConvertDeepSeekBytesOptions,
  ConvertDeepSeekBytesResult,
  DeepSeekExportBuildResult,
  DeepSeekExportStats,
} from './convert-bytes.js';
export { convertDeepSeekExportToBytes } from './convert-bytes.js';

export interface ConvertDeepSeekOptions extends Partial<ConvertDeepSeekBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertDeepSeekResult extends DeepSeekExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertDeepSeekOptions,
): Promise<ConvertDeepSeekBytesOptions> {
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

  throw new Error('DeepSeek convert requires inputPath or fileName+bytes');
}

export async function buildDeepSeekGrovePortBundle(options: ConvertDeepSeekOptions) {
  return buildDeepSeekGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewDeepSeekExport(
  options: Omit<ConvertDeepSeekOptions, 'outputPath'>,
): Promise<DeepSeekExportStats> {
  return previewDeepSeekExportBytes(await resolveBytesOptions(options));
}

export async function convertDeepSeekExport(
  options: ConvertDeepSeekOptions & { outputPath: string },
): Promise<ConvertDeepSeekResult> {
  const built = await buildDeepSeekGrovePortBundleBytes(await resolveBytesOptions(options));

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

export { loadDeepSeekExportFromBytes, type DeepSeekExportBundle } from './load-input-bytes.js';
