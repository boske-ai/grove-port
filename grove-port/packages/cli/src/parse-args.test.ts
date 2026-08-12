import { describe, expect, test } from 'bun:test';
import { parseConvertArgs, parseVerifyArgs } from './parse-args.js';

describe('parseConvertArgs', () => {
  test('parses the documented form', () => {
    const options = parseConvertArgs([
      '--from',
      'chatgpt',
      'conversations.json',
      '-o',
      'out.grove-port',
      '--email',
      'you@example.com',
    ]);

    expect(options).toEqual({
      from: 'chatgpt',
      inputPath: 'conversations.json',
      outputPath: 'out.grove-port',
      preview: false,
      userEmail: 'you@example.com',
      label: undefined,
    });
  });

  test('accepts the input path before the flags', () => {
    // Previously required the input to sit at exactly `--from` + 2.
    const options = parseConvertArgs(['input.json', '--from', 'claude', '--preview']);

    expect(options?.inputPath).toBe('input.json');
    expect(options?.from).toBe('claude');
    expect(options?.preview).toBe(true);
  });

  test('accepts --output as an alias for -o', () => {
    const options = parseConvertArgs(['--from', 'claude', 'in.json', '--output', 'out.grove-port']);
    expect(options?.outputPath).toBe('out.grove-port');
  });

  test('rejects a flag used as another flag value', () => {
    // Previously `--email` swallowed `--label` as the address.
    expect(parseConvertArgs(['--from', 'chatgpt', 'in.json', '--preview', '--email', '--label'])).toBeNull();
  });

  test('rejects a trailing flag with no value', () => {
    expect(parseConvertArgs(['--from', 'chatgpt', 'in.json', '--preview', '--email'])).toBeNull();
  });

  test('rejects unknown flags instead of ignoring them', () => {
    expect(parseConvertArgs(['--from', 'chatgpt', 'in.json', '--preview', '--typo'])).toBeNull();
  });

  test('rejects extra positional arguments', () => {
    expect(parseConvertArgs(['--from', 'chatgpt', 'a.json', 'b.json', '--preview'])).toBeNull();
  });

  test('requires --from', () => {
    expect(parseConvertArgs(['in.json', '--preview'])).toBeNull();
  });

  test('requires an input path', () => {
    expect(parseConvertArgs(['--from', 'chatgpt', '--preview'])).toBeNull();
  });

  test('requires -o unless --preview is set', () => {
    expect(parseConvertArgs(['--from', 'chatgpt', 'in.json'])).toBeNull();
  });
});

describe('parseVerifyArgs', () => {
  test('parses a bare path', () => {
    expect(parseVerifyArgs(['out.grove-port'])).toEqual({
      tarballPath: 'out.grove-port',
      expectedPublicKeys: [],
    });
  });

  test('collects repeated --expect-key values for key rotation', () => {
    const options = parseVerifyArgs([
      'out.grove-port',
      '--expect-key',
      'AAAA',
      '--expect-key',
      'BBBB',
    ]);

    expect(options?.expectedPublicKeys).toEqual(['AAAA', 'BBBB']);
  });

  test('accepts the path after the flags', () => {
    const options = parseVerifyArgs(['--expect-key', 'AAAA', 'out.grove-port']);
    expect(options?.tarballPath).toBe('out.grove-port');
  });

  test('rejects --expect-key with no value', () => {
    expect(parseVerifyArgs(['out.grove-port', '--expect-key'])).toBeNull();
  });

  test('rejects a flag used as the key value', () => {
    expect(parseVerifyArgs(['out.grove-port', '--expect-key', '--verbose'])).toBeNull();
  });

  test('rejects unknown flags', () => {
    expect(parseVerifyArgs(['out.grove-port', '--typo'])).toBeNull();
  });

  test('rejects extra positionals', () => {
    expect(parseVerifyArgs(['a.grove-port', 'b.grove-port'])).toBeNull();
  });

  test('requires a path', () => {
    expect(parseVerifyArgs(['--expect-key', 'AAAA'])).toBeNull();
  });
});
