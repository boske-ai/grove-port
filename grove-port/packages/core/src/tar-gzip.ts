import { gzipSync } from 'fflate';

export interface TarEntry {
  /** Path inside the archive, e.g. grove-port-v1/manifest.json */
  path: string;
  data: Uint8Array;
}

function pad512(size: number): number {
  const remainder = size % 512;
  return remainder === 0 ? 0 : 512 - remainder;
}

function writeString(view: DataView, offset: number, value: string, maxLength: number): void {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value.slice(0, maxLength));
  for (let index = 0; index < bytes.length; index += 1) {
    view.setUint8(offset + index, bytes[index]!);
  }
}

function writeOctal(view: DataView, offset: number, value: number, length: number): void {
  const octal = value.toString(8).padStart(length - 1, '0');
  writeString(view, offset, `${octal}\0`, length);
}

function createTarHeader(entryPath: string, size: number): Uint8Array {
  const header = new Uint8Array(512);
  const view = new DataView(header.buffer);

  writeString(view, 0, entryPath, 100);
  writeOctal(view, 100, 0o644, 8);
  writeOctal(view, 108, 0, 8);
  writeOctal(view, 116, 0, 8);
  writeOctal(view, 124, size, 12);
  writeOctal(view, 136, Math.floor(Date.now() / 1000), 12);

  for (let index = 148; index < 156; index += 1) {
    header[index] = 0x20;
  }

  header[156] = 0x30; // '0' = regular file
  writeString(view, 257, 'ustar', 6);
  writeString(view, 263, '00', 2);

  let checksum = 0;
  for (let index = 0; index < 512; index += 1) {
    checksum += header[index]!;
  }
  writeOctal(view, 148, checksum, 8);

  return header;
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

/** Build a gzip-compressed tar archive (same wire format as Node `tar.create({ gzip: true })`). */
export function createTarGzip(entries: TarEntry[]): Uint8Array {
  const chunks: Uint8Array[] = [];

  for (const entry of entries) {
    chunks.push(createTarHeader(entry.path, entry.data.length));
    chunks.push(entry.data);
    const padding = pad512(entry.data.length);
    if (padding > 0) {
      chunks.push(new Uint8Array(padding));
    }
  }

  chunks.push(new Uint8Array(512));
  return gzipSync(concatChunks(chunks));
}
