/* global ReadableStream, Uint8Array */
// Byte-level gzip / base64url helpers. Uses the WHATWG CompressionStream / DecompressionStream
// (native in browsers and Node >= 18) rather than Node's zlib, so the same code runs in the
// TradeTrust website's browser bundle without a polyfill, and adds no dependency.

/** Default cap on decompressed output: 4 MB (ADR 4.1). Closes the decompression-bomb vector. */
export const INLINE_TEMPLATE_MAX_DECOMPRESSED_BYTES = 4 * 1024 * 1024;

const concat = (chunks: Uint8Array[], total: number): Uint8Array => {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
};

/**
 * Drains a stream, optionally aborting as soon as the running byte count exceeds `maxBytes`.
 * The cap is enforced while streaming -- a post-hoc length check would already have paid the
 * memory cost, and the size in the gzip footer is attacker-written and never trusted.
 * @param {ReadableStream<Uint8Array>} stream - Stream to read to completion.
 * @param {number} [maxBytes] - Abort once more than this many bytes have been read.
 * @returns {Promise<Uint8Array>} Everything the stream produced.
 */
const readAll = async (
  stream: ReadableStream<Uint8Array>,
  maxBytes?: number,
): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (maxBytes !== undefined && total > maxBytes) {
      await reader.cancel();
      throw new Error(`Inline template exceeds the decompressed size limit of ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  return concat(chunks, total);
};

const pipe = (bytes: Uint8Array, transform: CompressionStream | DecompressionStream) =>
  new Blob([bytes as BlobPart]).stream().pipeThrough(transform) as ReadableStream<Uint8Array>;

export const gzip = (bytes: Uint8Array): Promise<Uint8Array> =>
  readAll(pipe(bytes, new CompressionStream('gzip')));

export const gunzip = (bytes: Uint8Array, maxBytes: number): Promise<Uint8Array> =>
  readAll(pipe(bytes, new DecompressionStream('gzip')), maxBytes);

// btoa/atob work on "binary strings"; build them in chunks so large templates don't overflow
// the argument limit of String.fromCharCode.
export const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const fromBase64Url = (value: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error('Inline template is not valid base64url');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};
