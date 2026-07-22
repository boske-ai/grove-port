import { gzipSync } from 'fflate';

export interface TarEntry {
  /** Path inside the archive, e.g. grove-port-v1/manifest.json */
  path: string;
  data: Uint8Array;
}

const USTAR_NAME_MAX = 100;
const USTAR_PREFIX_MAX = 155;
const textEncoder = new TextEncoder();

function pad512(size: number): number {
  const remainder = size % 512;
  return remainder === 0 ? 0 : 512 - remainder;
}

/** Write at most `maxLength` bytes (never char-sliced). Does not split mid-field past maxLength. */
function writeBytes(view: DataView, offset: number, bytes: Uint8Array, maxLength: number): void {
  const length = Math.min(bytes.length, maxLength);
  for (let index = 0; index < length; index += 1) {
    view.setUint8(offset + index, bytes[index]!);
  }
}

function writeString(view: DataView, offset: number, value: string, maxLength: number): void {
  writeBytes(view, offset, textEncoder.encode(value), maxLength);
}

function writeOctal(view: DataView, offset: number, value: number, length: number): void {
  const octal = value.toString(8).padStart(length - 1, '0');
  writeString(view, offset, `${octal}\0`, length);
}

function utf8ByteLength(value: string): number {
  return textEncoder.encode(value).length;
}

/**
 * Split a path into ustar name (≤100 bytes) + prefix (≤155 bytes).
 * Returns null when the path cannot fit (caller should use PAX).
 */
function splitUstarPath(entryPath: string): { name: string; prefix: string } | null {
  if (utf8ByteLength(entryPath) <= USTAR_NAME_MAX) {
    return { name: entryPath, prefix: '' };
  }

  let best: { name: string; prefix: string } | null = null;
  for (let index = 0; index < entryPath.length; index += 1) {
    if (entryPath[index] !== '/') {
      continue;
    }
    const prefix = entryPath.slice(0, index);
    const name = entryPath.slice(index + 1);
    if (name.length === 0) {
      continue;
    }
    if (utf8ByteLength(name) <= USTAR_NAME_MAX && utf8ByteLength(prefix) <= USTAR_PREFIX_MAX) {
      best = { name, prefix };
    }
  }
  return best;
}

/** POSIX pax extended header record for `path=` (length is byte-based). */
function createPaxPathRecord(entryPath: string): Uint8Array {
  const keywordAndValue = textEncoder.encode(`path=${entryPath}\n`);
  let size = String(1 + 1 + keywordAndValue.length).length + 1 + keywordAndValue.length;
  for (;;) {
    const digits = String(size);
    const total = digits.length + 1 + keywordAndValue.length;
    if (total === size) {
      const out = new Uint8Array(total);
      const digitBytes = textEncoder.encode(digits);
      out.set(digitBytes, 0);
      out[digitBytes.length] = 0x20;
      out.set(keywordAndValue, digitBytes.length + 1);
      return out;
    }
    size = total;
  }
}

function finalizeHeader(header: Uint8Array): void {
  for (let index = 148; index < 156; index += 1) {
    header[index] = 0x20;
  }
  let checksum = 0;
  for (let index = 0; index < 512; index += 1) {
    checksum += header[index]!;
  }
  writeOctal(new DataView(header.buffer), 148, checksum, 8);
}

function createUstarHeader(name: string, prefix: string, size: number, typeflag: number): Uint8Array {
  const header = new Uint8Array(512);
  const view = new DataView(header.buffer);

  writeString(view, 0, name, USTAR_NAME_MAX);
  writeOctal(view, 100, 0o644, 8);
  writeOctal(view, 108, 0, 8);
  writeOctal(view, 116, 0, 8);
  writeOctal(view, 124, size, 12);
  writeOctal(view, 136, Math.floor(Date.now() / 1000), 12);

  header[156] = typeflag;
  writeString(view, 257, 'ustar', 6);
  writeString(view, 263, '00', 2);
  if (prefix.length > 0) {
    writeString(view, 345, prefix, USTAR_PREFIX_MAX);
  }

  finalizeHeader(header);
  return header;
}

/** Headers (and optional PAX body) for one file entry — before file data. */
function createTarEntryPrefix(entryPath: string, size: number): Uint8Array[] {
  const split = splitUstarPath(entryPath);
  if (split) {
    return [createUstarHeader(split.name, split.prefix, size, 0x30)];
  }

  // Path does not fit ustar name+prefix — emit POSIX PAX extended header, then a stub file header.
  const paxBody = createPaxPathRecord(entryPath);
  const chunks: Uint8Array[] = [
    createUstarHeader('PaxHeader', '', paxBody.length, 0x78), // 'x'
    paxBody,
  ];
  const paxPad = pad512(paxBody.length);
  if (paxPad > 0) {
    chunks.push(new Uint8Array(paxPad));
  }
  // Stub name for readers that ignore PAX; Node tar v7 uses the PAX path.
  const stubName = entryPath.length <= USTAR_NAME_MAX ? entryPath : entryPath.slice(0, USTAR_NAME_MAX);
  chunks.push(createUstarHeader(stubName, '', size, 0x30));
  return chunks;
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
    chunks.push(...createTarEntryPrefix(entry.path, entry.data.length));
    chunks.push(entry.data);
    const padding = pad512(entry.data.length);
    if (padding > 0) {
      chunks.push(new Uint8Array(padding));
    }
  }

  chunks.push(new Uint8Array(512));
  return gzipSync(concatChunks(chunks));
}
