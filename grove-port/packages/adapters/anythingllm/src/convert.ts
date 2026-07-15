import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildAnythingLlmGrovePortBundle as buildAnythingLlmGrovePortBundleBytes,
  previewAnythingLlmExport as previewAnythingLlmExportBytes,
  type ConvertAnythingLlmBytesOptions,
  type AnythingLlmExportStats,
} from './convert-bytes.js';

export type {
  ConvertAnythingLlmBytesOptions,
  ConvertAnythingLlmBytesResult,
  AnythingLlmExportBuildResult,
  AnythingLlmExportStats,
} from './convert-bytes.js';
export { convertAnythingLlmExportToBytes } from './convert-bytes.js';

export interface ConvertAnythingLlmOptions extends Partial<ConvertAnythingLlmBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertAnythingLlmResult extends AnythingLlmExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertAnythingLlmOptions,
): Promise<ConvertAnythingLlmBytesOptions> {
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

  throw new Error('AnythingLLM convert requires inputPath or fileName+bytes');
}

export async function buildAnythingLlmGrovePortBundle(options: ConvertAnythingLlmOptions) {
  return buildAnythingLlmGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewAnythingLlmExport(
  options: Omit<ConvertAnythingLlmOptions, 'outputPath'>,
): Promise<AnythingLlmExportStats> {
  return previewAnythingLlmExportBytes(await resolveBytesOptions(options));
}

export async function convertAnythingLlmExport(
  options: ConvertAnythingLlmOptions & { outputPath: string },
): Promise<ConvertAnythingLlmResult> {
  const built = await buildAnythingLlmGrovePortBundleBytes(await resolveBytesOptions(options));

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

export {
  loadAnythingLlmExportFromBytes,
  type AnythingLlmExportBundle,
} from './load-input-bytes.js';
