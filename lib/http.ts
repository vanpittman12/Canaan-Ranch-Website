/** Copy bytes into a standalone ArrayBuffer so Response/Blob accept them. */
export function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/**
 * Build an `attachment` Content-Disposition with a header-safe filename.
 * Strips path parts, quotes, backslashes, control characters, and non-ASCII
 * from the plain `filename=`; the original name rides in RFC 5987 `filename*`.
 */
export function attachmentDisposition(filename: string | null | undefined, fallback = "download.pdf") {
  const base = String(filename ?? "")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.trim() ?? "";
  const withoutControls = base.replace(/[\u0000-\u001f\u007f]/g, "");
  const ascii = withoutControls
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\;]/g, "_")
    .slice(0, 200)
    .trim();
  const safe = ascii && ascii !== "." && ascii !== ".." ? ascii : fallback;
  const encoded = encodeURIComponent(withoutControls.slice(0, 200) || safe).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

/** True when the bytes start with the `%PDF-` magic header. */
export function hasPdfMagicBytes(bytes: Uint8Array) {
  const magic = [0x25, 0x50, 0x44, 0x46, 0x2d];
  if (bytes.length < magic.length) {
    return false;
  }
  return magic.every((value, index) => bytes[index] === value);
}
