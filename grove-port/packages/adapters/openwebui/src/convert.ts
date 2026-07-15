import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildOpenWebUiGrovePortBundle as buildOpenWebUiGrovePortBundleBytes,
  previewOpenWebUiExport as previewOpenWebUiExportBytes,
  type ConvertOpenWebUiBytesOptions,
  type OpenWebUiExportStats,
} from './convert-bytes.js';

export type {
  ConvertOpenWebUiBytesOptions,
  ConvertOpenWebUiBytesResult,
  OpenWebUiExportBuildResult,
  OpenWebUiExportStats,
} from './convert-bytes.js';
export { convertOpenWebUiExportToBytes, flattenOpenWebUiHistory } from './convert-bytes.js';

export interface ConvertOpenWebUiOptions extends Partial<ConvertOpenWebUiBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertOpenWebUiResult extends OpenWebUiExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertOpenWebUiOptions,
): Promise<ConvertOpenWebUiBytesOptions> {
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

  throw new Error('Open WebUI convert requires inputPath or fileName+bytes');
}

export async function buildOpenWebUiGrovePortBundle(options: ConvertOpenWebUiOptions) {
  return buildOpenWebUiGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewOpenWebUiExport(
  options: Omit<ConvertOpenWebUiOptions, 'outputPath'>,
): Promise<OpenWebUiExportStats> {
  return previewOpenWebUiExportBytes(await resolveBytesOptions(options));
}

export async function convertOpenWebUiExport(
  options: ConvertOpenWebUiOptions & { outputPath: string },
): Promise<ConvertOpenWebUiResult> {
  const built = await buildOpenWebUiGrovePortBundleBytes(await resolveBytesOptions(options));

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

export { loadOpenWebUiExport, loadOpenWebUiExportFromBytes } from './load-input.js';
