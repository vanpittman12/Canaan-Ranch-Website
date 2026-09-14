import { readFileSync } from "node:fs";
import path from "node:path";

const FILENAME = "Canaan-Preserve-Relocation-Agreement-template.docx";
const MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Serves Van’s uploaded blank agreement as a Word attachment.
 * Populated engagement PDFs still come from generateContractPdf.
 */
export async function GET() {
  const body = readFileSync(
    path.join(process.cwd(), "public/agreements", FILENAME),
  );
  return new Response(body, {
    headers: {
      "Content-Type": MIME,
      "Content-Disposition": `attachment; filename="${FILENAME}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
