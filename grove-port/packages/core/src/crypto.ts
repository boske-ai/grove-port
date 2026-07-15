import { createHash, createPublicKey, verify } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { canonicalManifestBytes } from './canonical.js';

export function sha256Hex(buffer: Buffer | Uint8Array | string): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function sha256HexFile(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
}

export function verifyManifestSignature(
  manifest: Record<string, unknown>,
  signatureBase64: string,
  publicKeyBase64: string,
): boolean {
  const publicKey = createPublicKey({
    key: Buffer.from(publicKeyBase64, 'base64'),
    format: 'der',
    type: 'spki',
  });
  const bytes = canonicalManifestBytes(manifest);
  const signature = Buffer.from(signatureBase64, 'base64');
  return verify(null, bytes, publicKey, signature);
}
