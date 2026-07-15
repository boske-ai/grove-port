import { describe, expect, test } from 'bun:test';
import {
  BOSKE_EXPORT_ENVELOPE_ROOT,
  ExportDataV1Schema,
  ExportManifestV1Schema,
} from '@grove-port/schema';
describe('@grove-port/schema', () => {
  test('accepts a minimal valid manifest', () => {
    const manifest = ExportManifestV1Schema.parse({
      version: 'v1',
      created_at: '2026-06-18T12:00:00.000Z',
      source: {
        app_version: '0.7.903',
        deployment: 'electron-local',
        tier: 'local',
        instance_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      user_id: 'user-1',
      user_email: 'user@example.com',
      counts: {
        conversations: 0,
        messages: 0,
        files: 0,
        presets: 0,
        agents: 0,
        memories: 0,
        tool_calls: 0,
        transcript_sessions: 0,
        workspace_items: 0,
        shares: 0,
      },
      checksums: {
        'data.json':
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      signature_alg: 'ed25519',
      signature_public_key: 'MCowBQYDK2VwAyEA',
    });

    expect(manifest.version).toBe('v1');
  });

  test('accepts empty data collections', () => {
    const data = ExportDataV1Schema.parse({
      user: { id: 'user-1' },
      conversations: [],
      messages: [],
      files: [],
      presets: [],
      agents: [],
      memories: [],
      tool_calls: [],
      transcript_sessions: [],
      workspace_items: [],
      shares: [],
      attachments: [],
    });

    expect(data.conversations).toEqual([]);
  });

  test('defaults workspace_items for pre-change v1 packages', () => {
    const data = ExportDataV1Schema.parse({
      user: { id: 'user-1' },
      conversations: [],
      messages: [],
      files: [],
      presets: [],
      agents: [],
      memories: [],
      tool_calls: [],
      transcript_sessions: [],
      shares: [],
      attachments: [],
    });
    expect(data.workspace_items).toEqual([]);

    const manifest = ExportManifestV1Schema.parse({
      version: 'v1',
      created_at: '2026-06-18T12:00:00.000Z',
      source: {
        app_version: '0.7.903',
        deployment: 'electron-local',
        tier: 'local',
        instance_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      user_id: 'user-1',
      user_email: 'user@example.com',
      counts: {
        conversations: 0,
        messages: 0,
        files: 0,
        presets: 0,
        agents: 0,
        memories: 0,
        tool_calls: 0,
        transcript_sessions: 0,
        shares: 0,
      },
      checksums: {
        'data.json':
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      signature_alg: 'ed25519',
      signature_public_key: 'MCowBQYDK2VwAyEA',
    });
    expect(manifest.counts.workspace_items).toBe(0);
  });
});

describe('envelope root names', () => {
  test('keeps Boske wire root for compatibility', () => {
    expect(BOSKE_EXPORT_ENVELOPE_ROOT).toBe('boske-export-v1');
  });
});
