/**
 * Van’s blank Word agreement. Blank download 307s to the public file.
 * Populated download + DocuSign fill a copy of these same bytes.
 */
export const BLANK_AGREEMENT_PUBLIC_PATH =
  "/agreements/Canaan-Preserve-Relocation-Agreement-template.docx";
export const BLANK_AGREEMENT_PUBLIC_FILE =
  "public/agreements/Canaan-Preserve-Relocation-Agreement-template.docx";
export const BLANK_AGREEMENT_DOCX_SHA256 =
  "0eb11197f8e2097ca18bab315ba557e4a3939d6eab20e354b9357aa7af0c362f";
export const BLANK_AGREEMENT_DOCX_SIZE = 66615;
export const POPULATED_AGREEMENT_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

let cachedTemplate: Uint8Array | null = null;

export function populatedAgreementFilename(reference: string) {
  return `${reference}-canaan-preserve-agreement.docx`;
}

/**
 * Load Van’s blank DOCX. Workers use the static ASSETS binding.
 * Node (vitest / `next dev`) reads the public file. The blank download
 * route never goes through this loader — it 307s to the static asset.
 */
export async function loadBlankAgreementTemplate(): Promise<Uint8Array> {
  if (cachedTemplate) {
    return cachedTemplate.slice();
  }
  const fromAssets = await readFromCloudflareAssets();
  const bytes = fromAssets ?? (await readBlankAgreementFromDisk());
  cachedTemplate = bytes;
  return bytes.slice();
}

export function resetBlankAgreementTemplateCache() {
  cachedTemplate = null;
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
