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
      kind: "letter",
    }))
  ) {
    return new Response("Authentication required.", { status: 401 });
  }

  const engagement = await getEngagement(id);
  if (!engagement?.reservationLetter.storedName) {
    return new Response("No reservation letter is on file.", { status: 404 });
  }

  const bytes = await getUpload(engagement.reservationLetter.storedName);
  if (!bytes) {
    return new Response("Reservation letter is missing from storage.", { status: 404 });
  }

  const filename =
    engagement.reservationLetter.filename ??
    `${engagement.reference}-gopher-tortoise-acceptance-letter.pdf`;
  return new Response(asArrayBuffer(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
