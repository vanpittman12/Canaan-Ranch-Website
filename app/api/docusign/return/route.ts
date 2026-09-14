import { getLiveEnvelopeStatus, isDocuSignEnabled } from "@/lib/docusign";
import { syncLiveEnvelope } from "@/lib/docusign-complete";
import { getEngagement } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const engagementId = url.searchParams.get("engagementId");
  if (!engagementId) {
    return Response.redirect(new URL("/", request.url), 302);
  }

  if (isDocuSignEnabled()) {
    const engagement = await getEngagement(engagementId);
    if (engagement?.docusign.envelopeId && engagement.docusign.mode === "live") {
      try {
        const snapshot = await getLiveEnvelopeStatus(engagement.docusign.envelopeId);
        await syncLiveEnvelope(
          engagement,
          snapshot.status,
          undefined,
          snapshot.buyerSignedDateTime ?? snapshot.completedDateTime,
        );
      } catch {
        // Still return the buyer to the engagement page if polling fails.
      }
    }
  }

  return Response.redirect(new URL(`/engagements/${engagementId}`, request.url), 302);
}
