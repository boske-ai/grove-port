import { canonicalManifestUint8Array } from './canonical.js';

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }
  return btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function sha256HexBytes(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface WebEd25519KeyPair {
  privateKey: CryptoKey;
  publicKeyBase64: string;
}

export async function generateEd25519KeyPair(): Promise<WebEd25519KeyPair> {
  const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  return {
    privateKey: keyPair.privateKey,
    publicKeyBase64: bytesToBase64(new Uint8Array(publicKeySpki)),
  };
}

export async function signManifestWeb(
  manifest: Record<string, unknown>,
  privateKey: CryptoKey,
): Promise<string> {
  const bytes = canonicalManifestUint8Array(manifest);
  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    toArrayBuffer(bytes),
  );
  return bytesToBase64(new Uint8Array(signature));
}
