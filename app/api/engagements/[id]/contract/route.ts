import { cookies } from "next/headers";
import { ADMIN_COOKIE, canAccessEngagementDocument } from "@/lib/auth";
import { asArrayBuffer } from "@/lib/http";
import { generateContractPdf } from "@/lib/pdf";
import { getEngagement } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token");
  const jar = await cookies();
  if (
    !(await canAccessEngagementDocument({
      adminToken: jar.get(ADMIN_COOKIE)?.value,
      downloadToken: token,
      engagementId: id,
      kind: "contract",
    }))
  ) {
    return new Response("Authentication required.", { status: 401 });
  }

  const engagement = await getEngagement(id);
  if (!engagement) {
    return new Response("Engagement not found.", { status: 404 });
  }

  const bytes = await generateContractPdf(engagement);
  return new Response(asArrayBuffer(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${engagement.reference}-canaan-preserve-agreement.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
