import { generateContractPdf } from "@/lib/pdf";
import { getEngagement } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const engagement = await getEngagement(id);
  if (!engagement) {
    return new Response("Engagement not found.", { status: 404 });
  }

  const bytes = await generateContractPdf(engagement);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${engagement.reference}-canaan-ranch-agreement.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
