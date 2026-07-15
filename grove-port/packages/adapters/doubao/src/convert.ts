import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packEnvelope } from '@grove-port/core';
import type { ExportManifestV1 } from '@grove-port/schema';
import {
  buildDoubaoGrovePortBundle as buildDoubaoGrovePortBundleBytes,
  previewDoubaoExport as previewDoubaoExportBytes,
  type ConvertDoubaoBytesOptions,
  type DoubaoExportStats,
} from './convert-bytes.js';

export type {
  ConvertDoubaoBytesOptions,
  ConvertDoubaoBytesResult,
  DoubaoExportBuildResult,
  DoubaoExportStats,
} from './convert-bytes.js';
export { convertDoubaoExportToBytes } from './convert-bytes.js';

export interface ConvertDoubaoOptions extends Partial<ConvertDoubaoBytesOptions> {
  inputPath?: string;
  outputPath?: string;
}

export interface ConvertDoubaoResult extends DoubaoExportStats {
  outputPath: string;
  manifest: ExportManifestV1;
}

async function resolveBytesOptions(
  options: ConvertDoubaoOptions,
): Promise<ConvertDoubaoBytesOptions> {
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

  throw new Error('Doubao convert requires inputPath or fileName+bytes');
}

export async function buildDoubaoGrovePortBundle(options: ConvertDoubaoOptions) {
  return buildDoubaoGrovePortBundleBytes(await resolveBytesOptions(options));
}

export async function previewDoubaoExport(
  options: Omit<ConvertDoubaoOptions, 'outputPath'>,
): Promise<DoubaoExportStats> {
  return previewDoubaoExportBytes(await resolveBytesOptions(options));
}

export async function convertDoubaoExport(
  options: ConvertDoubaoOptions & { outputPath: string },
): Promise<ConvertDoubaoResult> {
  const built = await buildDoubaoGrovePortBundleBytes(await resolveBytesOptions(options));

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

export { loadDoubaoExportFromBytes, type DoubaoExportBundle } from './load-input-bytes.js';
