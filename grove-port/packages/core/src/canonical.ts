/**
 * Deterministic JSON serialization for Ed25519 manifest signatures.
 * Matches Boske Export/envelope.js stableStringify semantics.
 */

/**
 * Nesting limit for canonical serialization. Verify canonicalizes the *raw*
 * manifest as written on disk, so depth is attacker-controlled; recursing
 * without a bound turns a crafted manifest into a stack-overflow crash.
 * A v1 manifest is 3 levels deep — 64 is far beyond any legitimate package.
 */
export const MAX_CANONICAL_DEPTH = 64;

function stableStringifyAtDepth(value: unknown, depth: number): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (depth > MAX_CANONICAL_DEPTH) {
    throw new Error(
      `canonical serialization refused: nesting deeper than ${MAX_CANONICAL_DEPTH} levels`,
    );
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringifyAtDepth(item, depth + 1)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => typeof record[key] !== 'undefined' && typeof record[key] !== 'function')
    .sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringifyAtDepth(record[key], depth + 1)}`)
    .join(',')}}`;
}

export function stableStringify(value: unknown): string {
  return stableStringifyAtDepth(value, 0);
}

export function canonicalManifestBytes(manifest: Record<string, unknown>): Buffer {
  return Buffer.from(stableStringify(manifest), 'utf8');
}

export function canonicalManifestUint8Array(manifest: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(stableStringify(manifest));
}
