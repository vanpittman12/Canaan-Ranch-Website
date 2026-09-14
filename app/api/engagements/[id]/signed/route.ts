import { cookies } from "next/headers";
import { ADMIN_COOKIE, canAccessEngagementDocument } from "@/lib/auth";
import { asArrayBuffer } from "@/lib/http";
import { getEngagement, getUpload } from "@/lib/store";

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
      kind: "signed",
    }))
  ) {
    return new Response("Authentication required.", { status: 401 });
  }

  const engagement = await getEngagement(id);
  if (!engagement?.signedArtifact) {
    return new Response("No signed copy is on file.", { status: 404 });
  }

  const bytes = await getUpload(engagement.signedArtifact.storedName);
  if (!bytes) {
    return new Response("Signed file is missing from storage.", { status: 404 });
  }

  return new Response(asArrayBuffer(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${engagement.signedArtifact.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
