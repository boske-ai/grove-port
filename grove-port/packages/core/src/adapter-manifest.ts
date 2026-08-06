import type { ExportManifestV1 } from '@grove-port/schema';

/**
 * The manifest scaffold every IN adapter produces.
 *
 * This block used to be copy-pasted into all nine `convert-bytes.ts` files.
 * Adding `counts.workspace_items` therefore meant ten separate edits — the same
 * change that shipped a signature-verification break. Keeping it in one place is
 * the point: a new `counts` field is now a single edit here.
 */

/** Manifest fields the packer fills in once it has hashed the payload. */
export type AdapterManifest = Omit<
  ExportManifestV1,
  'checksums' | 'signature_alg' | 'signature_public_key'
>;

/**
 * Placeholder deployment identity for adapter-produced packages.
 *
 * Converted packages did not come from a Boske instance, so there is no real
 * `instance_id` to report. The nil-ish UUID says "synthesized by an adapter"
 * rather than inventing a plausible-looking one.
 */
export const ADAPTER_INSTANCE_ID = '00000000-0000-4000-8000-000000000000' as const;

/** Per-collection counts an adapter actually produced. Everything else is 0. */
export interface AdapterCounts {
  conversations: number;
  messages: number;
  files?: number;
  presets?: number;
  agents?: number;
  memories?: number;
  tool_calls?: number;
  transcript_sessions?: number;
  workspace_items?: number;
  shares?: number;
}

export interface BuildAdapterManifestInput {
  adapterId: string;
  adapterVersion: string;
  sourceFormat: string;
  userId: string;
  userEmail: string;
  label?: string;
  counts: AdapterCounts;
  /** Overridable so tests can pin a deterministic timestamp. */
  createdAt?: string;
}

export function buildAdapterManifest({
  adapterId,
  adapterVersion,
  sourceFormat,
  userId,
  userEmail,
  label,
  counts,
  createdAt,
}: BuildAdapterManifestInput): AdapterManifest {
  return {
    version: 'v1',
    label,
    created_at: createdAt ?? new Date().toISOString(),
    source: {
      app_version: adapterVersion,
      deployment: 'web-saas',
      tier: 'free',
      instance_id: ADAPTER_INSTANCE_ID,
      adapter: adapterId,
      adapter_version: adapterVersion,
      source_format: sourceFormat,
    },
    user_id: userId,
    user_email: userEmail,
    counts: {
      conversations: counts.conversations,
      messages: counts.messages,
      files: counts.files ?? 0,
      presets: counts.presets ?? 0,
      agents: counts.agents ?? 0,
      memories: counts.memories ?? 0,
      tool_calls: counts.tool_calls ?? 0,
      transcript_sessions: counts.transcript_sessions ?? 0,
      workspace_items: counts.workspace_items ?? 0,
      shares: counts.shares ?? 0,
    },
  };
}

/** Empty `data.json` collections, so adapters only spell out what they fill. */
export function emptyDataCollections() {
  return {
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
  };
}

/** Stats shape shared by every adapter's preview/convert result. */
export interface AdapterExportStats {
  conversationCount: number;
  messageCount: number;
  forkedConversations: number;
  attachmentCount: number;
  fileCount: number;
  sourceFormat: string;
  userId: string;
  userEmail: string;
}
