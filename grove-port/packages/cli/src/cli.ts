#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inspectEnvelope, unpackAndVerifyEnvelope } from '@grove-port/core';
import {
  convertAdapterExport,
  isConvertAdapterName,
  previewAdapterExport,
  SUPPORTED_CONVERT_ADAPTERS,
} from './adapters.js';

const USAGE = `grove-port — verify, inspect, and convert Grove Port v1 packages

Usage:
  grove-port verify <path.grove-port>
  grove-port inspect <path.grove-port>
  grove-port convert --from <chatgpt|claude|openwebui|librechat|gemini|doubao|deepseek|lobechat|anythingllm> <input> [--preview] [-o <out.grove-port>] [--email user@example.com]

Commands:
  verify   Check signature and checksums (exit 0 on success)
  inspect  Print JSON summary of manifest + actual data.json counts
  convert  Run an IN adapter and write a signed .grove-port package
`;

interface ConvertOptions {
  from: string;
  inputPath: string;
  outputPath?: string;
  preview: boolean;
  userEmail?: string;
  label?: string;
}

function printUsage(): void {
  console.error(USAGE.trimEnd());
}

function parseConvertArgs(argv: string[]): ConvertOptions | null {
  const fromIndex = argv.indexOf('--from');
  const outputIndex = argv.indexOf('-o');
  const preview = argv.includes('--preview');

  if (fromIndex === -1) {
    return null;
  }

  const from = argv[fromIndex + 1];
  const inputPath = argv[fromIndex + 2];
  const outputPath = outputIndex === -1 ? undefined : argv[outputIndex + 1];

  if (!from || !inputPath) {
    return null;
  }

  if (!preview && !outputPath) {
    return null;
  }

  let userEmail: string | undefined;
  let label: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--email') {
      userEmail = argv[index + 1];
    }
    if (argv[index] === '--label') {
      label = argv[index + 1];
    }
  }

  return { from, inputPath, outputPath, preview, userEmail, label };
}

async function runVerify(tarballPath: string): Promise<number> {
  const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-verify-'));

  try {
    const { manifest } = await unpackAndVerifyEnvelope({ tarballPath, extractDir });

    console.log('OK — envelope is intact and signature is valid.');
    console.log('');
    console.log(`Version:      ${manifest.version}`);
    console.log(`Created:      ${manifest.created_at}`);
    console.log(`User:         ${manifest.user_email} (${manifest.user_id})`);
    console.log(
      `Source:       ${manifest.source.deployment} / ${manifest.source.tier} / ${manifest.source.app_version}`,
    );
    if (manifest.source.adapter) {
      console.log(`Adapter:      ${manifest.source.adapter} (${manifest.source.source_format ?? 'n/a'})`);
    }
    console.log(`Public key:   ${manifest.signature_public_key.slice(0, 32)}...`);
    console.log('');
    console.log('Counts:');
    for (const [key, value] of Object.entries(manifest.counts)) {
      console.log(`  ${key.padEnd(22)} ${value}`);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('FAIL — envelope verification failed:');
    console.error(`  ${message}`);
    return 1;
  } finally {
    await rm(extractDir, { recursive: true, force: true });
  }
}

async function runInspect(tarballPath: string): Promise<number> {
  try {
    const summary = await inspectEnvelope(tarballPath);
    console.log(JSON.stringify(summary, null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('FAIL — inspect failed:');
    console.error(`  ${message}`);
    return 1;
  }
}

async function runConvert(options: ConvertOptions): Promise<number> {
  if (!existsSync(options.inputPath)) {
    console.error(`File not found: ${options.inputPath}`);
    return 2;
  }

  if (options.from === 'mistral') {
    console.error('FAIL — Mistral Le Chat is not supported by Grove Port (ADR 0001).');
    return 1;
  }

  if (!isConvertAdapterName(options.from)) {
    console.error(`Unsupported adapter: ${options.from}`);
    console.error(`Supported: ${SUPPORTED_CONVERT_ADAPTERS.join(', ')}`);
    return 2;
  }

  try {
    if (options.preview) {
      const preview = await previewAdapterExport(options.from, {
        inputPath: options.inputPath,
        userEmail: options.userEmail,
        label: options.label,
      });
      console.log(JSON.stringify(preview, null, 2));
      return 0;
    }

    if (!options.outputPath) {
      console.error('FAIL — convert requires -o <out.grove-port> unless --preview is set');
      return 2;
    }

    const result = await convertAdapterExport(options.from, {
      inputPath: options.inputPath,
      outputPath: options.outputPath,
      userEmail: options.userEmail,
      label: options.label,
    });

    console.log(`Wrote ${result.outputPath}`);
    console.log(
      `  ${result.conversationCount} conversations · ${result.messageCount} messages · ${result.forkedConversations} with forks`,
    );
    console.log(
      `  ${result.fileCount} files · ${result.attachmentCount} attachment refs · source ${result.sourceFormat}`,
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('FAIL — convert failed:');
    console.error(`  ${message}`);
    return 1;
  }
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(command ? 0 : 2);
  }

  let exitCode = 2;

  switch (command) {
    case 'verify': {
      const tarballPath = rest[0];
      if (!tarballPath) {
        printUsage();
        break;
      }
      if (!existsSync(tarballPath)) {
        console.error(`File not found: ${tarballPath}`);
        process.exit(2);
      }
      exitCode = await runVerify(tarballPath);
      break;
    }
    case 'inspect': {
      const tarballPath = rest[0];
      if (!tarballPath) {
        printUsage();
        break;
      }
      if (!existsSync(tarballPath)) {
        console.error(`File not found: ${tarballPath}`);
        process.exit(2);
      }
      exitCode = await runInspect(tarballPath);
      break;
    }
    case 'convert': {
      const options = parseConvertArgs(rest);
      if (!options) {
        printUsage();
        break;
      }
      exitCode = await runConvert(options);
      break;
    }
    default:
      printUsage();
      break;
  }

  process.exit(exitCode);
}

await main();
