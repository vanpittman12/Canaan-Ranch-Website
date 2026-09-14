import { cookies } from "next/headers";
import { generatePopulatedAgreement } from "@/lib/agreement-populate";
import { ADMIN_COOKIE, canAccessEngagementDocument } from "@/lib/auth";
import { asArrayBuffer } from "@/lib/http";
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

  const populated = await generatePopulatedAgreement(engagement);
  return new Response(asArrayBuffer(populated.bytes), {
    headers: {
      "Content-Type": populated.mimeType,
      "Content-Disposition": `attachment; filename="${populated.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
