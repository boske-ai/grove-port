import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildGeminiGrovePortBundle as buildGeminiGrovePortBundleBytes,
  previewGeminiExport as previewGeminiExportBytes,
  type ConvertGeminiBytesOptions,
  type GeminiExportStats,
} from './convert-bytes.js';

export type {
  ConvertGeminiBytesOptions,
  ConvertGeminiBytesResult,
  GeminiExportBuildResult,
  GeminiExportStats,
} from './convert-bytes.js';
export { convertGeminiExportToBytes } from './convert-bytes.js';

export interface ConvertGeminiOptions extends Partial<ConvertGeminiBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertGeminiResult extends GeminiExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertGeminiOptions,
): Promise<ConvertGeminiBytesOptions> {
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

  throw new Error('Gemini convert requires inputPath or fileName+bytes');
}

export async function buildGeminiGrovePortBundle(options: ConvertGeminiOptions) {
  return buildGeminiGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewGeminiExport(
  options: Omit<ConvertGeminiOptions, 'outputPath'>,
): Promise<GeminiExportStats> {
  return previewGeminiExportBytes(await resolveBytesOptions(options));
}

export async function convertGeminiExport(
  options: ConvertGeminiOptions & { outputPath: string },
): Promise<ConvertGeminiResult> {
  const built = await buildGeminiGrovePortBundleBytes(await resolveBytesOptions(options));

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

export { loadGeminiExportFromBytes, type GeminiExportBundle } from './load-input-bytes.js';
