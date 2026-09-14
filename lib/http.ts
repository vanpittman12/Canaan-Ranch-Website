/** Standalone ArrayBuffer for Response/Blob. Reuse the view when it already is one. */
export function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (
    bytes.byteOffset === 0 &&
    bytes.buffer instanceof ArrayBuffer &&
    bytes.buffer.byteLength === bytes.byteLength
  ) {
    return bytes.buffer;
  }
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
