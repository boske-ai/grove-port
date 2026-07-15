import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'bun:test';
import { zipSync } from 'fflate';
import { loadChatGptExportFromBytes } from './load-input-bytes.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

function buildShardedExportZip(): Uint8Array {
  const conversations = JSON.parse(
    readFileSync(path.join(fixturesDir, 'chatgpt-export.json'), 'utf8'),
  ) as unknown[];

  return zipSync({
    'conversations-000.json': new TextEncoder().encode(JSON.stringify(conversations.slice(0, 1))),
    'conversations-001.json': new TextEncoder().encode(JSON.stringify(conversations.slice(1, 2))),
    'shared_conversations.json': new TextEncoder().encode(
      JSON.stringify([
        {
          conversation_id: 'shared-1',
          id: 'shared-1',
          is_anonymous: true,
          title: 'Shared link summary only',
        },
      ]),
    ),
    'user.json': new TextEncoder().encode(
      JSON.stringify({ email: 'traveler@example.com', id: 'user-1' }),
    ),
    'conversation_asset_file_names.json': new TextEncoder().encode(JSON.stringify({})),
  });
}

describe('loadChatGptExportFromBytes', () => {
  test('loads and merges sharded conversations-NNN.json exports', () => {
    const bundle = loadChatGptExportFromBytes('chatgpt-export.zip', buildShardedExportZip());

    expect(bundle.conversations).toHaveLength(2);
    expect(bundle.conversations.every((conversation) => 'mapping' in conversation)).toBe(true);
    expect(bundle.user?.email).toBe('traveler@example.com');
  });

  test('prefers conversations.json over shards when both are present', () => {
    const conversations = JSON.parse(
      readFileSync(path.join(fixturesDir, 'chatgpt-export.json'), 'utf8'),
    ) as unknown[];

    const zipBytes = zipSync({
      'conversations.json': new TextEncoder().encode(JSON.stringify(conversations.slice(0, 1))),
      'conversations-000.json': new TextEncoder().encode(JSON.stringify(conversations.slice(1, 2))),
    });

    const bundle = loadChatGptExportFromBytes('chatgpt-export.zip', zipBytes);
    expect(bundle.conversations).toHaveLength(1);
  });

  test('ignores shared_conversations.json when shards are absent', () => {
    const zipBytes = zipSync({
      'shared_conversations.json': new TextEncoder().encode(
        JSON.stringify([{ conversation_id: 'x', id: 'x', title: 'Shared only' }]),
      ),
    });

    expect(() => loadChatGptExportFromBytes('chatgpt-export.zip', zipBytes)).toThrow(
      'ChatGPT export ZIP must contain conversations.json or conversations-*.json shards',
    );
  });
});
