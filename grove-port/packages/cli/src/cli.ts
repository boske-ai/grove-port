#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inspectEnvelope, unpackAndVerifyEnvelope } from '@grove-port/core';
import {
  parseConvertArgs,
  parseVerifyArgs,
  type ConvertOptions,
  type VerifyOptions,
} from './parse-args.js';
import {
  convertAdapterExport,
  isConvertAdapterName,
  previewAdapterExport,
  SUPPORTED_CONVERT_ADAPTERS,
} from './adapters.js';

const USAGE = `grove-port — verify, inspect, and convert Grove Port v1 packages

Usage:
  grove-port verify <path.grove-port> [--expect-key <base64> ...]
  grove-port inspect <path.grove-port> [--expect-key <base64> ...]
  grove-port convert --from <chatgpt|claude|openwebui|librechat|gemini|doubao|deepseek|lobechat|anythingllm> <input> [--preview] [-o <out.grove-port>] [--email user@example.com]

Commands:
  verify   Check checksums and signature integrity (exit 0 on success)
  inspect  Print JSON summary of manifest + actual data.json counts
  convert  Run an IN adapter and write a signed .grove-port package

Note on trust:
  A Grove Port package carries the public key that verifies it, so by default
  'verify' proves the package is INTERNALLY CONSISTENT — unaltered since
  signing — not that it came from any particular person or product.

  Pass --expect-key <base64> (repeatable, for key rotation) to require a
  specific signing key. Verification then also proves ORIGIN: a package signed
  by any other key is rejected. You need the expected key out of band — from
  the instance that produced the export, not from the package itself.

  Packages written by 'convert' are signed with a throwaway key generated on
  the spot and never recorded, so --expect-key does not apply to them.

Limits (verify/inspect refuse anything larger):
  archive 512 MiB · 20,000 tar entries · 512 MiB extracted · data.json 128 MiB
`;


function printUsage(): void {
  console.error(USAGE.trimEnd());
}


async function runVerify({ tarballPath, expectedPublicKeys }: VerifyOptions): Promise<number> {
  const extractDir = await mkdtemp(path.join(tmpdir(), 'grove-port-verify-'));

  try {
    const { manifest, signatureTrust, unverifiedMembers } = await unpackAndVerifyEnvelope({
      tarballPath,
      extractDir,
      expectedPublicKeys,
    });

    if (signatureTrust === 'trusted-key') {
      console.log('OK — envelope is intact and signed by a trusted key.');
      console.log('');
      console.log('  Checksums match, the signature verifies, and the signing key is one');
      console.log('  you supplied via --expect-key. This package came from a holder of');
      console.log('  that key.');
      console.log('');
    } else {
      console.log('OK — envelope is internally consistent.');
      console.log('');
      console.log('  Checksums match and the signature verifies against the key the');
      console.log('  manifest carries. That proves the package has not been altered');
      console.log('  since it was signed — it does NOT prove who produced it, because');
      console.log('  the package supplies its own verification key. Pass --expect-key');
      console.log('  <base64> to require a specific signing key and get proof of origin.');
      console.log('');
    }
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
    console.log(
      signatureTrust === 'trusted-key'
        ? 'Signature:    valid (signing key matched --expect-key)'
        : 'Signature:    valid (self-signed — key is not checked against any trust anchor)',
    );
    console.log('');
    console.log('Counts:');
    for (const [key, value] of Object.entries(manifest.counts)) {
      console.log(`  ${key.padEnd(22)} ${value}`);
    }

    if (unverifiedMembers.length > 0) {
      console.log('');
      console.log('WARNING — these envelope members are not covered by any checksum:');
      for (const member of unverifiedMembers) {
        console.log(`  ${member}`);
      }
      console.log('  Their contents are NOT protected by the signature.');
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

async function runInspect({ tarballPath, expectedPublicKeys }: VerifyOptions): Promise<number> {
  try {
    const summary = await inspectEnvelope(tarballPath, { expectedPublicKeys });
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
    case 'verify':
    case 'inspect': {
      const options = parseVerifyArgs(rest);
      if (!options) {
        printUsage();
        break;
      }
      if (!existsSync(options.tarballPath)) {
        console.error(`File not found: ${options.tarballPath}`);
        process.exit(2);
      }
      exitCode =
        command === 'verify' ? await runVerify(options) : await runInspect(options);
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
