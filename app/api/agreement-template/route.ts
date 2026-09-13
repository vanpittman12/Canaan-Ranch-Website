import { asArrayBuffer } from "@/lib/http";
import { generateTemplateAgreementPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET() {
  const bytes = await generateTemplateAgreementPdf();
  return new Response(asArrayBuffer(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="canaan-preserve-relocation-agreement-template.pdf"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
