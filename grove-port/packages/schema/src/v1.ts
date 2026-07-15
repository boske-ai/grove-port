/**
 * Grove Port Envelope v1 — schema contract.
 *
 * Extracted from Boske `@boske/data-provider` `export-v1.ts` (ADR 0009).
 * Wire-compatible with `boske-export-v1`; public name: Grove Port v1.
 *
 * The envelope is a tarball with this layout:
 *
 *   boske-export-v1/  or  grove-port-v1/
 *     manifest.json     ← `ExportManifestV1Schema`
 *     data.json         ← `ExportDataV1Schema`
 *     attachments/      ← raw file bytes, names listed in manifest.checksums
 *     README.md         ← human-readable explainer (not validated)
 *     signature.sig     ← Ed25519 over canonical manifest bytes
 *
 * Versioning: every envelope carries `manifest.version` (currently the literal
 * 'v1'). Future versions add fields; readers MUST reject envelopes whose
 * version they don't understand rather than silently best-effort-import.
 *
 * Pure types + Zod. No I/O, no Node API. Safe for browser validation.
 */

import { z } from 'zod';

/** SHA-256 hex digest, 64 lower-case hex chars. */
export const Sha256HexSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, 'must be a lower-case sha256 hex digest');

/** Ed25519 signature, base64-encoded (88 chars w/ padding for 64 bytes). */
export const Ed25519SignatureBase64Schema = z
  .string()
  .regex(/^[A-Za-z0-9+/]+=*$/, 'must be base64')
  .min(86)
  .max(88);

/** ISO-8601 timestamp. */
export const IsoTimestampSchema = z.string().datetime();

/**
 * What the envelope was exported from. Lets a target instance reason about
 * source/target compatibility (e.g. SQLite-only fields when going Local→Cloud).
 */
export const ExportSourceSchema = z.object({
  app_version: z.string().min(1),
  deployment: z.enum([
    'electron-local',
    'electron-hybrid',
    'web-saas',
    'private-cloud',
    'on-premise',
  ]),
  tier: z.enum(['free', 'trial', 'local', 'cloud', 'enterprise', 'developer', 'admin']),
  instance_id: z.string().uuid(),
  /** IN adapter id, e.g. grove-port-adapter-chatgpt */
  adapter: z.string().min(1).optional(),
  adapter_version: z.string().min(1).optional(),
  source_format: z.string().min(1).optional(),
});

/**
 * Per-collection record counts. Used to populate the dry-run preview UI
 * without parsing the full data.json.
 */
export const ExportCountsSchema = z.object({
  conversations: z.number().int().nonnegative(),
  messages: z.number().int().nonnegative(),
  files: z.number().int().nonnegative(),
  presets: z.number().int().nonnegative(),
  agents: z.number().int().nonnegative(),
  memories: z.number().int().nonnegative(),
  tool_calls: z.number().int().nonnegative(),
  transcript_sessions: z.number().int().nonnegative(),
  /**
   * Boske wire parity — workspace tree nodes (0 for vendor IN adapters).
   * Default keeps pre-change v1 packages valid without a version bump.
   */
  workspace_items: z.number().int().nonnegative().default(0),
  shares: z.number().int().nonnegative(),
});

export const ExportManifestV1Schema = z.object({
  version: z.literal('v1'),
  label: z.string().max(200).optional(),
  created_at: IsoTimestampSchema,
  source: ExportSourceSchema,
  user_id: z.string().min(1),
  user_email: z.string().email(),
  counts: ExportCountsSchema,
  checksums: z.record(z.string().min(1), Sha256HexSchema),
  signature_alg: z.literal('ed25519'),
  signature_public_key: z.string().min(1),
});

export type ExportManifestV1 = z.infer<typeof ExportManifestV1Schema>;
export type ExportSource = z.infer<typeof ExportSourceSchema>;
export type ExportCounts = z.infer<typeof ExportCountsSchema>;

const RecordArraySchema = z.array(z.record(z.string(), z.unknown()));

export const ExportAttachmentRefSchema = z.object({
  file_id: z.string().min(1),
  storage_name: z.string().min(1),
  original_name: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  mime_type: z.string().optional(),
  sha256: Sha256HexSchema,
});

export type ExportAttachmentRef = z.infer<typeof ExportAttachmentRefSchema>;

export const ExportDataV1Schema = z.object({
  user: z.record(z.string(), z.unknown()),
  conversations: RecordArraySchema,
  messages: RecordArraySchema,
  files: RecordArraySchema,
  presets: RecordArraySchema,
  agents: RecordArraySchema,
  memories: RecordArraySchema,
  tool_calls: RecordArraySchema,
  transcript_sessions: RecordArraySchema,
  /**
   * Boske wire parity — empty for vendor IN adapters.
   * Default keeps pre-change v1 packages valid without a version bump.
   */
  workspace_items: RecordArraySchema.default([]),
  shares: RecordArraySchema,
  attachments: z.array(ExportAttachmentRefSchema),
});

export type ExportDataV1 = z.infer<typeof ExportDataV1Schema>;

/** Boske wire name (v1 compatibility). */
export const BOSKE_EXPORT_ENVELOPE_ROOT = 'boske-export-v1' as const;

/** Grove Port public wire name (alias, same layout). */
export const GROVE_PORT_ENVELOPE_ROOT = 'grove-port-v1' as const;

/** Accepted tarball root directory names for v1. */
export const ENVELOPE_ROOT_NAMES = [
  BOSKE_EXPORT_ENVELOPE_ROOT,
  GROVE_PORT_ENVELOPE_ROOT,
] as const;

export type EnvelopeRootName = (typeof ENVELOPE_ROOT_NAMES)[number];

/** @deprecated Prefer `BOSKE_EXPORT_ENVELOPE_ROOT` or `GROVE_PORT_ENVELOPE_ROOT`. */
export const EXPORT_ENVELOPE_ROOT = BOSKE_EXPORT_ENVELOPE_ROOT;

export const EXPORT_MANIFEST_FILENAME = 'manifest.json' as const;
export const EXPORT_DATA_FILENAME = 'data.json' as const;
export const EXPORT_README_FILENAME = 'README.md' as const;
export const EXPORT_SIGNATURE_FILENAME = 'signature.sig' as const;
export const EXPORT_ATTACHMENTS_DIR = 'attachments' as const;

/** Wire format id shared with Boske export-v1. */
export const GROVE_PORT_WIRE_ID = 'boske-export-v1' as const;

export const DATA_COLLECTION_KEYS = [
  'conversations',
  'messages',
  'files',
  'presets',
  'agents',
  'memories',
  'tool_calls',
  'transcript_sessions',
  'workspace_items',
  'shares',
] as const;

export type DataCollectionKey = (typeof DATA_COLLECTION_KEYS)[number];
