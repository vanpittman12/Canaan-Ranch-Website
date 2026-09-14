import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { BLANK_AGREEMENT_PUBLIC_FILE } from "./agreement-template";
import {
  DOCUMENT_XML,
  MAX_DOCUMENT_XML_BYTES,
  MAX_POPULATED_AGREEMENT_BYTES,
  MAX_TEMPLATE_ZIP_BYTES,
  parseDocxZip,
  rebuildDocxZip,
} from "./docx-zip";

const TEMPLATE_DOCX = resolve(process.cwd(), BLANK_AGREEMENT_PUBLIC_FILE);

describe("Worker-safe DOCX ZIP", () => {
  it("inflates only word/document.xml and keeps other entries compressed", () => {
    const bytes = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const archive = parseDocxZip(bytes, MAX_TEMPLATE_ZIP_BYTES);

    expect(bytes.byteLength).toBeLessThanOrEqual(MAX_TEMPLATE_ZIP_BYTES);
    expect(archive.documentXml).toContain("GOPHER TORTOISE RELOCATION AGREEMENT");
    expect(archive.documentXml.length).toBeGreaterThan(100_000);
    expect(archive.documentXml.length).toBeLessThan(MAX_DOCUMENT_XML_BYTES);

    const styles = archive.entries.find((entry) => entry.name === "word/styles.xml");
    expect(styles).toBeDefined();
    expect(styles!.localRecord.byteLength).toBeLessThan(8_000);
    expect(archive.entries.every((entry) => entry.localRecord.byteLength < 80_000)).toBe(true);
  });

  it("rebuilds a valid DOCX without unzipping the whole package", () => {
    const bytes = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const archive = parseDocxZip(bytes, MAX_TEMPLATE_ZIP_BYTES);
    const marker = "<!--canaan-worker-zip-->";
    const rebuilt = rebuildDocxZip(archive, `${archive.documentXml}${marker}`);

    expect(rebuilt[0]).toBe(0x50);
    expect(rebuilt[1]).toBe(0x4b);
    expect(rebuilt.byteLength).toBeLessThan(MAX_POPULATED_AGREEMENT_BYTES);
    expect(rebuilt.byteLength).toBeLessThan(120_000);

    const files = unzipSync(rebuilt);
    expect(Object.keys(files).sort()).toEqual(
      [...archive.entries.map((entry) => entry.name)].sort(),
    );
    const xml = new TextDecoder().decode(files[DOCUMENT_XML]);
    expect(xml.endsWith(marker)).toBe(true);
    expect(xml.startsWith(archive.documentXml)).toBe(true);
  });

  it("refuses a zip-bomb document.xml size before inflate", () => {
    const bomb = fakeZipWithClaimedXmlSize(MAX_DOCUMENT_XML_BYTES + 1);
    expect(() => parseDocxZip(bomb)).toThrow(/Worker guard/);
  });

  it("refuses an oversized ZIP before walking entries", () => {
    const huge = new Uint8Array(MAX_POPULATED_AGREEMENT_BYTES + 1);
    huge.set([0x50, 0x4b, 0x05, 0x06], huge.byteLength - 22);
    expect(() => parseDocxZip(huge)).toThrow(/Worker guard/);
  });
});

function fakeZipWithClaimedXmlSize(uncompressedSize: number) {
  const name = new TextEncoder().encode(DOCUMENT_XML);
  const stored = new Uint8Array([0x3c, 0x61, 0x2f, 0x3e]); // "<a/>"
  const local = new Uint8Array(30 + name.byteLength + stored.byteLength);
  const localView = new DataView(local.buffer);
  localView.setUint32(0, 0x04034b50, true);
  localView.setUint16(8, 0, true);
  localView.setUint32(18, stored.byteLength, true);
  localView.setUint32(22, uncompressedSize, true);
  localView.setUint16(26, name.byteLength, true);
  local.set(name, 30);
  local.set(stored, 30 + name.byteLength);

  const central = new Uint8Array(46 + name.byteLength);
  const centralView = new DataView(central.buffer);
  centralView.setUint32(0, 0x02014b50, true);
  centralView.setUint16(10, 0, true);
  centralView.setUint32(20, stored.byteLength, true);
  centralView.setUint32(24, uncompressedSize, true);
  centralView.setUint16(28, name.byteLength, true);
  central.set(name, 46);

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, 1, true);
  eocdView.setUint16(10, 1, true);
  eocdView.setUint32(12, central.byteLength, true);
  eocdView.setUint32(16, local.byteLength, true);

  const out = new Uint8Array(local.byteLength + central.byteLength + eocd.byteLength);
  out.set(local);
  out.set(central, local.byteLength);
  out.set(eocd, local.byteLength + central.byteLength);
  return out;
}
