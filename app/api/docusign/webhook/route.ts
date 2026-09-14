import {
  isDocuSignEnabled,
  parseConnectPayload,
  verifyConnectSignature,
} from "@/lib/docusign";
import { syncLiveEnvelope } from "@/lib/docusign-complete";
import { getEngagementByEnvelopeId } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.DOCUSIGN_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return new Response("Webhook secret is not configured.", { status: 401 });
  }

  const signature =
    request.headers.get("x-docusign-signature-1") ??
    request.headers.get("X-DocuSign-Signature-1");
  if (!verifyConnectSignature(rawBody, signature, secret)) {
    return new Response("Invalid signature.", { status: 401 });
  }

  const event = parseConnectPayload(rawBody);
  if (!event.envelopeId) {
    return new Response("Missing envelopeId.", { status: 400 });
  }

  const engagement = await getEngagementByEnvelopeId(event.envelopeId);
  if (!engagement) {
    return new Response("Engagement not found.", { status: 404 });
  }

  if (!isDocuSignEnabled() && engagement.docusign.mode !== "live") {
    return new Response("ok", { status: 200 });
  }

  try {
    await syncLiveEnvelope(engagement, event.status ?? event.event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply DocuSign status.";
    return new Response(message, { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
