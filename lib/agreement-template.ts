/**
 * Van’s blank Word agreement. Blank download 307s to the public file.
 * Populated download + DocuSign fill a copy of these same bytes.
 *
 * Workers note: inflate once per isolate and reuse the unzipped parts. The
 * contract route previously blew Cloudflare Error 1102 (exceededCpu) by
 * unzipSync + zipSync(level 6) on every request against a 424KB document.xml.
 */
export const BLANK_AGREEMENT_PUBLIC_PATH =
  "/agreements/Canaan-Preserve-Relocation-Agreement-template.docx";
export const BLANK_AGREEMENT_PUBLIC_FILE =
  "public/agreements/Canaan-Preserve-Relocation-Agreement-template.docx";
export const BLANK_AGREEMENT_DOCX_SHA256 =
  "0623705bb9686076b14f91bea1ec9ec2d0819d02a343e00680b6dc0923f5f174";
export const BLANK_AGREEMENT_DOCX_SIZE = 66609;
export const POPULATED_AGREEMENT_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Store-only zip level — avoids deflate CPU on Workers (Error 1102). */
export const POPULATED_ZIP_LEVEL = 0 as const;

let cachedTemplateBytes: Uint8Array | null = null;
let cachedUnzippedParts: Record<string, Uint8Array> | null = null;

export function populatedAgreementFilename(reference: string) {
  return `${reference}-canaan-preserve-agreement.docx`;
}

/**
 * Load Van’s blank DOCX. Workers use the static ASSETS binding.
 * Node (vitest / `next dev`) reads the public file. The blank download
 * route never goes through this loader — it 307s to the static asset.
 */
export async function loadBlankAgreementTemplate(): Promise<Uint8Array> {
  if (cachedTemplateBytes) {
    return cachedTemplateBytes.slice();
  }
  const fromAssets = await readFromCloudflareAssets();
  const bytes = fromAssets ?? (await readBlankAgreementFromDisk());
  cachedTemplateBytes = bytes;
  return bytes.slice();
}

/**
 * Inflate Van’s blank DOCX once per isolate. Callers must treat returned
 * entries other than the one they replace as immutable (shared cache).
 */
export async function loadBlankAgreementParts(): Promise<Record<string, Uint8Array>> {
  if (cachedUnzippedParts) {
    return cachedUnzippedParts;
  }
  const { unzipSync } = await import("fflate");
  const bytes = cachedTemplateBytes ?? (await loadBlankAgreementTemplate());
  // Keep the cached raw bytes without an extra slice copy when we already have it.
  if (!cachedTemplateBytes) {
    cachedTemplateBytes = bytes;
  }
  cachedUnzippedParts = unzipSync(cachedTemplateBytes);
  return cachedUnzippedParts;
}

export function resetBlankAgreementTemplateCache() {
  cachedTemplateBytes = null;
  cachedUnzippedParts = null;
}

async function readFromCloudflareAssets(): Promise<Uint8Array | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const assets = (env as { ASSETS?: { fetch: typeof fetch } }).ASSETS;
    if (!assets) {
      return null;
    }
    const response = await assets.fetch(
      new Request(`https://assets.local${BLANK_AGREEMENT_PUBLIC_PATH}`),
    );
    if (!response.ok) {
      return null;
    }
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function readBlankAgreementFromDisk(): Promise<Uint8Array> {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  return new Uint8Array(await readFile(resolve(process.cwd(), BLANK_AGREEMENT_PUBLIC_FILE)));
}
