/**
 * Deterministic JSON serialization for Ed25519 manifest signatures.
 * Matches Boske Export/envelope.js stableStringify semantics.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => typeof record[key] !== 'undefined' && typeof record[key] !== 'function')
    .sort();

  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

export function canonicalManifestBytes(manifest: Record<string, unknown>): Buffer {
  return Buffer.from(stableStringify(manifest), 'utf8');
}

export function canonicalManifestUint8Array(manifest: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(stableStringify(manifest));
}
