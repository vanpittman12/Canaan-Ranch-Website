import { readFile } from "node:fs/promises";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";
import { getEngagement, getStoredUploadPath } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const engagement = await getEngagement(id);
  if (!engagement?.signedArtifact) {
    return new Response("No signed copy is on file.", { status: 404 });
  }

  const jar = await cookies();
  const isAdmin = verifyAdminSession(jar.get(ADMIN_COOKIE)?.value);
  if (!isAdmin && engagement.status === "declined") {
    return new Response("Not available.", { status: 403 });
  }

  try {
    const bytes = await readFile(getStoredUploadPath(engagement.signedArtifact.storedName));
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${engagement.signedArtifact.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Signed file is missing from storage.", { status: 404 });
  }
}
