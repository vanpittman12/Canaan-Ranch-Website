/**
 * Worker-safe DOCX ZIP helpers.
 * Inflate only word/document.xml; copy every other entry as already-compressed bytes.
 */
import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";

export const DOCUMENT_XML = "word/document.xml";

/** Van’s blank file is 66_615 bytes. Reject zip bombs before inflate. */
export const MAX_TEMPLATE_ZIP_BYTES = 120_000;
/** Uncompressed document.xml is ~425 KB. Leave room for filled fields + anchors. */
export const MAX_DOCUMENT_XML_BYTES = 768_000;
/** Populated ZIP after a level-1 recompress of document.xml only. */
export const MAX_POPULATED_AGREEMENT_BYTES = 750_000;

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const DEFLATE = 8;

export type DocxZipEntry = {
  name: string;
  localRecord: Uint8Array;
  centralRecord: Uint8Array;
};

export type DocxZipArchive = {
  entries: DocxZipEntry[];
  documentXml: string;
};

export function parseDocxZip(
  bytes: Uint8Array,
  maxZipBytes = MAX_POPULATED_AGREEMENT_BYTES,
): DocxZipArchive {
  if (bytes.byteLength > maxZipBytes) {
    throw new Error(
      `Agreement ZIP is ${bytes.byteLength} bytes; exceeds the ${maxZipBytes}-byte Worker guard.`,
    );
  }
  if (bytes.byteLength < 22) {
    throw new Error("Agreement template is not a ZIP.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEocd(view, bytes.byteLength);
  const entryCount = u16(view, eocd + 10);
  const cdSize = u32(view, eocd + 12);
  const cdOffset = u32(view, eocd + 16);
  if (cdOffset === 0xffffffff || cdSize === 0xffffffff) {
    throw new Error("ZIP64 agreement templates are not supported on the Worker populate path.");
  }

  const entries: DocxZipEntry[] = [];
  let cursor = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (u32(view, cursor) !== CENTRAL_SIG) {
      throw new Error("Agreement template ZIP central directory is corrupt.");
    }
    const nameLen = u16(view, cursor + 28);
    const extraLen = u16(view, cursor + 30);
    const commentLen = u16(view, cursor + 32);
    const localOffset = u32(view, cursor + 42);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen));
    const centralLen = 46 + nameLen + extraLen + commentLen;
    const compressedSize = u32(view, cursor + 20);
    const local = readLocalRecord(bytes, view, localOffset, compressedSize);
    entries.push({
      name,
      localRecord: local,
      centralRecord: bytes.subarray(cursor, cursor + centralLen),
    });
    cursor += centralLen;
  }

  const document = entries.find((entry) => entry.name === DOCUMENT_XML);
  if (!document) {
    throw new Error("Van’s agreement template is missing word/document.xml.");
  }

  return {
    entries,
    documentXml: inflateDocumentXml(document.localRecord),
  };
}

export function rebuildDocxZip(archive: DocxZipArchive, documentXml: string): Uint8Array {
  const xmlBytes = strToU8(documentXml);
  if (xmlBytes.byteLength > MAX_DOCUMENT_XML_BYTES) {
    throw new Error(
      `Populated document.xml is ${xmlBytes.byteLength} bytes; exceeds the ${MAX_DOCUMENT_XML_BYTES}-byte Worker guard.`,
    );
  }

  const parts: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of archive.entries) {
    if (entry.name === DOCUMENT_XML) {
      const local = buildDocumentXmlLocal(entry.localRecord, xmlBytes);
      const central = patchCentral(entry.centralRecord, local, offset, xmlBytes.byteLength);
      parts.push(local);
      centrals.push(central);
      offset += local.byteLength;
      continue;
    }
    parts.push(entry.localRecord);
    centrals.push(withLocalOffset(entry.centralRecord, offset));
    offset += entry.localRecord.byteLength;
  }

  const cdOffset = offset;
  for (const central of centrals) {
    parts.push(central);
    offset += central.byteLength;
  }
  parts.push(buildEocd(centrals.length, offset - cdOffset, cdOffset));

  const out = concatBytes(parts);
  if (out.byteLength > MAX_POPULATED_AGREEMENT_BYTES) {
    throw new Error(
      `Populated agreement is ${out.byteLength} bytes; exceeds the ${MAX_POPULATED_AGREEMENT_BYTES}-byte Worker guard.`,
    );
  }
  return out;
}

export function inflateDocumentXml(localRecord: Uint8Array): string {
  const view = new DataView(
    localRecord.buffer,
    localRecord.byteOffset,
    localRecord.byteLength,
  );
  if (u32(view, 0) !== LOCAL_SIG) {
    throw new Error("word/document.xml local header is corrupt.");
  }
  const method = u16(view, 8);
  const compressedSize = u32(view, 18);
  const uncompressedSize = u32(view, 22);
  const nameLen = u16(view, 26);
  const extraLen = u16(view, 28);
  if (uncompressedSize > MAX_DOCUMENT_XML_BYTES) {
    throw new Error(
      `word/document.xml uncompressed size ${uncompressedSize} exceeds the ${MAX_DOCUMENT_XML_BYTES}-byte Worker guard.`,
    );
  }
  const dataStart = 30 + nameLen + extraLen;
  const compressed = localRecord.subarray(dataStart, dataStart + compressedSize);
  if (method === 0) {
    return strFromU8(compressed);
  }
  if (method !== DEFLATE) {
    throw new Error(`Unsupported ZIP compression method ${method} for word/document.xml.`);
  }
  const inflated = inflateSync(compressed, { out: new Uint8Array(uncompressedSize) });
  return strFromU8(inflated);
}

function readLocalRecord(
  bytes: Uint8Array,
  view: DataView,
  localOffset: number,
  compressedSize: number,
): Uint8Array {
  if (u32(view, localOffset) !== LOCAL_SIG) {
    throw new Error("Agreement template ZIP local header is corrupt.");
  }
  const flags = u16(view, localOffset + 6);
  if (flags & 0x8) {
    throw new Error("Data-descriptor ZIP entries are not supported on the Worker populate path.");
  }
  const nameLen = u16(view, localOffset + 26);
  const extraLen = u16(view, localOffset + 28);
  const recordLen = 30 + nameLen + extraLen + compressedSize;
  return bytes.subarray(localOffset, localOffset + recordLen);
}

function buildDocumentXmlLocal(originalLocal: Uint8Array, xmlBytes: Uint8Array): Uint8Array {
  const src = new DataView(
    originalLocal.buffer,
    originalLocal.byteOffset,
    originalLocal.byteLength,
  );
  const nameLen = u16(src, 26);
  const extraLen = u16(src, 28);
  const prefixLen = 30 + nameLen + extraLen;
  const prefix = originalLocal.subarray(0, prefixLen);
  // Fast deflate: level 1, modest window. Do not re-zip the rest of the package.
  const compressed = deflateSync(xmlBytes, { level: 1, mem: 4 });
  const local = new Uint8Array(prefixLen + compressed.byteLength);
  local.set(prefix);
  local.set(compressed, prefixLen);
  const view = new DataView(local.buffer);
  view.setUint16(8, DEFLATE, true);
  view.setUint32(14, crc32(xmlBytes), true);
  view.setUint32(18, compressed.byteLength, true);
  view.setUint32(22, xmlBytes.byteLength, true);
  return local;
}

function patchCentral(
  original: Uint8Array,
  local: Uint8Array,
  localOffset: number,
  uncompressedSize: number,
): Uint8Array {
  const next = original.slice();
  const view = new DataView(next.buffer);
  const localView = new DataView(local.buffer, local.byteOffset, local.byteLength);
  view.setUint16(10, DEFLATE, true);
  view.setUint32(16, localView.getUint32(14, true), true);
  view.setUint32(20, localView.getUint32(18, true), true);
  view.setUint32(24, uncompressedSize, true);
  view.setUint32(42, localOffset, true);
  return next;
}

function withLocalOffset(central: Uint8Array, localOffset: number): Uint8Array {
  const next = central.slice();
  new DataView(next.buffer).setUint32(42, localOffset, true);
  return next;
}

function buildEocd(entryCount: number, cdSize: number, cdOffset: number): Uint8Array {
  const out = new Uint8Array(22);
  const view = new DataView(out.buffer);
  view.setUint32(0, EOCD_SIG, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, cdSize, true);
  view.setUint32(16, cdOffset, true);
  return out;
}

function findEocd(view: DataView, length: number): number {
  const min = Math.max(0, length - 22 - 0xffff);
  for (let i = length - 22; i >= min; i--) {
    if (u32(view, i) === EOCD_SIG) {
      return i;
    }
  }
  throw new Error("Agreement template is not a ZIP (missing EOCD).");
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const part of parts) {
    total += part.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

function u16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function u32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

const decoder = new TextDecoder();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
