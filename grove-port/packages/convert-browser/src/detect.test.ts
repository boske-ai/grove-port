import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { strToU8, zipSync } from 'fflate';
import { detectExportAdapter, MISTRAL_UNSUPPORTED_MESSAGE } from './detect.js';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function loadFixture(adapter: string, fileName: string): { fileName: string; bytes: Uint8Array } {
  const bytes = readFileSync(
    path.join(repoRoot, 'adapters', adapter, 'fixtures', fileName),
  );
  return { fileName, bytes: new Uint8Array(bytes) };
}

describe('detectExportAdapter', () => {
  test('detects ChatGPT JSON export with high confidence', () => {
    const { fileName, bytes } = loadFixture('chatgpt', 'chatgpt-export.json');
    const result = detectExportAdapter(fileName, bytes);
    expect(result.adapter).toBe('chatgpt');
    expect(result.confidence).toBe('high');
  });

  test('detects sharded ChatGPT ZIP and ignores shared_conversations.json', () => {
    const conversations = JSON.parse(
      readFileSync(
        path.join(repoRoot, 'adapters', 'chatgpt', 'fixtures', 'chatgpt-export.json'),
        'utf8',
      ),
    ) as unknown[];
    const zipBytes = zipSync({
      'conversations-000.json': new TextEncoder().encode(JSON.stringify(conversations.slice(0, 1))),
      'shared_conversations.json': new TextEncoder().encode(
        JSON.stringify([{ conversation_id: 'x', id: 'x', title: 'Shared only' }]),
      ),
      'conversation_asset_file_names.json': new TextEncoder().encode(JSON.stringify({})),
    });

    const result = detectExportAdapter('chatgpt-export.zip', zipBytes);
    expect(result.adapter).toBe('chatgpt');
    expect(result.confidence).toBe('high');
  });

  test('detects Claude JSON export with high confidence', () => {
    const { fileName, bytes } = loadFixture('claude', 'claude-export.json');
    const result = detectExportAdapter(fileName, bytes);
    expect(result.adapter).toBe('claude');
    expect(result.confidence).toBe('high');
  });

  test('rejects Mistral JSON export (ADR 0001)', () => {
    const fileName = 'mistral-export.json';
    const bytes = new TextEncoder().encode(
      JSON.stringify([
        {
          id: '1',
          chatId: 'chat-1',
          role: 'user',
          content: 'hello',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    );
    expect(() => detectExportAdapter(fileName, bytes)).toThrow(MISTRAL_UNSUPPORTED_MESSAGE);
  });

  test('does not reject google-chat filenames as Mistral (ADR 0001)', () => {
    const { fileName, bytes } = loadFixture('chatgpt', 'chatgpt-export.json');
    const result = detectExportAdapter('google-chat-export.json', bytes);
    expect(result.adapter).toBe('chatgpt');
  });

  test('rejects le-chat token filenames as Mistral (ADR 0001)', () => {
    const bytes = new TextEncoder().encode(JSON.stringify([{ foo: 'bar' }]));
    expect(() => detectExportAdapter('le-chat-export.json', bytes)).toThrow(
      MISTRAL_UNSUPPORTED_MESSAGE,
    );
  });

  test('detects LibreChat JSON export with high confidence', () => {
    const { fileName, bytes } = loadFixture('librechat', 'librechat-export.json');
    const result = detectExportAdapter(fileName, bytes);
    expect(result.adapter).toBe('librechat');
    expect(result.confidence).toBe('high');
  });

  test('detects Open WebUI JSON export with high confidence', () => {
    const { fileName, bytes } = loadFixture('openwebui', 'openwebui-export.json');
    const result = detectExportAdapter(fileName, bytes);
    expect(result.adapter).toBe('openwebui');
    expect(result.confidence).toBe('high');
  });

  test('detects AnythingLLM JSON export with high confidence', () => {
    const { fileName, bytes } = loadFixture('anythingllm', 'anythingllm-export.json');
    const result = detectExportAdapter(fileName, bytes);
    expect(result.adapter).toBe('anythingllm');
    expect(result.confidence).toBe('high');
  });

  test('detects LobeChat JSON export with high confidence', () => {
    const { fileName, bytes } = loadFixture('lobechat', 'lobechat-export.json');
    const result = detectExportAdapter(fileName, bytes);
    expect(result.adapter).toBe('lobechat');
    expect(result.confidence).toBe('high');
  });

  test('detects DeepSeek JSON export with high confidence', () => {
    const { fileName, bytes } = loadFixture('deepseek', 'conversations.json');
    const result = detectExportAdapter(fileName, bytes);
    expect(result.adapter).toBe('deepseek');
    expect(result.confidence).toBe('high');
  });

  test('detects single-object DeepSeek JSON export', () => {
    const array = JSON.parse(
      readFileSync(
        path.join(repoRoot, 'adapters', 'deepseek', 'fixtures', 'conversations.json'),
        'utf8',
      ),
    ) as unknown[];
    const bytes = new TextEncoder().encode(JSON.stringify(array[0]));
    const result = detectExportAdapter('deepseek-conversation.json', bytes);
    expect(result.adapter).toBe('deepseek');
    expect(result.confidence).toBe('high');
  });

  test('detects AnythingLLM JSON inside ZIP', () => {
    const exportJson = readFileSync(
      path.join(repoRoot, 'adapters', 'anythingllm', 'fixtures', 'anythingllm-export.json'),
    );
    const zipBytes = zipSync({
      'anythingllm/chats.json': new Uint8Array(exportJson),
    });

    const result = detectExportAdapter('anythingllm-export.zip', zipBytes);
    expect(result.adapter).toBe('anythingllm');
    expect(result.confidence).toBe('high');
  });

  test('detects AnythingLLM JSONL inside ZIP', () => {
    const exportJsonl = readFileSync(
      path.join(repoRoot, 'adapters', 'anythingllm', 'fixtures', 'anythingllm-export.jsonl'),
    );
    const zipBytes = zipSync({
      'anythingllm/chats.jsonl': new Uint8Array(exportJsonl),
    });

    const result = detectExportAdapter('anythingllm-export.zip', zipBytes);
    expect(result.adapter).toBe('anythingllm');
    expect(result.confidence).toBe('high');
  });

  test('does not label ChatGPT conversations.json under Gemini path as Gemini', () => {
    const chatgpt = readFileSync(
      path.join(repoRoot, 'adapters', 'chatgpt', 'fixtures', 'chatgpt-export.json'),
    );
    const zipBytes = zipSync({
      'Google Products/Gemini/conversations.json': new Uint8Array(chatgpt),
    });

    const result = detectExportAdapter('takeout.zip', zipBytes);
    expect(result.adapter).toBe('chatgpt');
    expect(result.confidence).toBe('high');
  });

  test('detects Doubao ZIP export with high confidence', () => {
    const metadata = readFileSync(
      path.join(repoRoot, 'adapters', 'doubao', 'fixtures', 'metadata.json'),
    );
    const conversation = readFileSync(
      path.join(repoRoot, 'adapters', 'doubao', 'fixtures', 'chat_2026-06-22', 'doubao-session-001.json'),
    );
    const zipBytes = zipSync({
      'metadata.json': new Uint8Array(metadata),
      'chat_2026-06-22/doubao-session-001.json': new Uint8Array(conversation),
    });

    const result = detectExportAdapter('doubao-export.zip', zipBytes);
    expect(result.adapter).toBe('doubao');
    expect(result.confidence).toBe('high');
  });

  test('detects Gemini Takeout ZIP with high confidence', () => {
    const activity = readFileSync(
      path.join(repoRoot, 'adapters', 'gemini', 'fixtures', 'MyActivity.json'),
    );
    const zipBytes = zipSync({
      'Takeout/My Activity/Gemini Apps/MyActivity.json': new Uint8Array(activity),
    });

    const result = detectExportAdapter('gemini-takeout.zip', zipBytes);
    expect(result.adapter).toBe('gemini');
    expect(result.confidence).toBe('high');
  });

  test('does not label generic Google Takeout MyActivity as Gemini', () => {
    const zipBytes = zipSync({
      'Takeout/My Activity/Search/MyActivity.json': strToU8(
        JSON.stringify([
          {
            header: 'Search',
            title: 'cats',
            time: '2026-06-21T09:00:00.000Z',
          },
        ]),
      ),
    });

    expect(() => detectExportAdapter('google-takeout.zip', zipBytes)).toThrow(
      'ZIP does not match a known export layout',
    );
  });

  test('detects Gemini when MyActivity.json is not the first activity log in ZIP', () => {
    const activity = readFileSync(
      path.join(repoRoot, 'adapters', 'gemini', 'fixtures', 'MyActivity.json'),
    );
    const zipBytes = zipSync({
      'Takeout/My Activity/Search/MyActivity.json': strToU8(
        JSON.stringify([{ header: 'Search', title: 'cats', time: '2026-06-21T09:00:00.000Z' }]),
      ),
      'Takeout/My Activity/Gemini Apps/MyActivity.json': new Uint8Array(activity),
    });

    const result = detectExportAdapter('takeout.zip', zipBytes);
    expect(result.adapter).toBe('gemini');
    expect(result.confidence).toBe('high');
  });

  test('detects Gemini conversations.json without gemini in ZIP path', () => {
    const conversations = readFileSync(
      path.join(repoRoot, 'adapters', 'gemini', 'fixtures', 'conversations.json'),
    );
    const zipBytes = zipSync({
      'Takeout/My Activity/Gemini Apps/conversations.json': new Uint8Array(conversations),
    });

    const result = detectExportAdapter('takeout.zip', zipBytes);
    expect(result.adapter).toBe('gemini');
    expect(result.confidence).toBe('high');
  });

  test('does not label generic metadata.json ZIP as Doubao', () => {
    const zipBytes = zipSync({
      'metadata.json': strToU8(JSON.stringify({ version: '1', items: [] })),
      'data/export.json': strToU8(JSON.stringify([{ foo: 'bar' }])),
    });

    expect(() => detectExportAdapter('generic-export.zip', zipBytes)).toThrow(
      'ZIP does not match a known export layout',
    );
  });

  test('marks ambiguous ZIP signals as low confidence', () => {
    const zipBytes = zipSync({
      'user.json': strToU8(JSON.stringify({ email: 'a@b.com', id: 'u1' })),
      'users.json': strToU8(JSON.stringify([{ uuid: 'u1', email_address: 'a@b.com' }])),
    });

    const result = detectExportAdapter('export.zip', zipBytes);
    expect(result.confidence).toBe('low');
    expect(result.alternatives.length).toBeGreaterThan(0);
  });

  test('throws for unsupported extension', () => {
    expect(() =>
      detectExportAdapter('notes.txt', new TextEncoder().encode('hello')),
    ).toThrow('Unsupported file type');
  });

  test('throws when JSON shape is unrecognized', () => {
    const bytes = new TextEncoder().encode(JSON.stringify([{ foo: 'bar' }]));
    expect(() => detectExportAdapter('unknown.json', bytes)).toThrow(
      'Could not detect export format',
    );
  });
});
