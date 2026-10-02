import {
  isDocuSignEnabled,
  parseConnectPayload,
  verifyConnectSignature,
} from "@/lib/docusign";
import { syncLiveEnvelope } from "@/lib/docusign-complete";
import { refreshEngagementFromDocuSign } from "@/lib/docusign-refresh";
import { getEngagementByEnvelopeId } from "@/lib/store";
import { nudgedRecently } from "@/lib/webhook-dedupe";

export const runtime = "nodejs";

const MAX_BODY_CHARS = 2 * 1024 * 1024;
const ENVELOPE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ok(note = "ok") {
  return new Response(note, { status: 200 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_CHARS) {
    return new Response("Payload too large.", { status: 413 });
  }

  const secret = process.env.DOCUSIGN_WEBHOOK_SECRET?.trim();
  const signature =
    request.headers.get("x-docusign-signature-1") ??
    request.headers.get("X-DocuSign-Signature-1");
  const signed = Boolean(secret) && verifyConnectSignature(rawBody, signature, secret);

  let event: ReturnType<typeof parseConnectPayload>;
  try {
    event = parseConnectPayload(rawBody);
  } catch {
    return ok("ignored: unreadable payload");
  }
  const envelopeId = event.envelopeId?.trim() ?? "";
  if (!ENVELOPE_ID_PATTERN.test(envelopeId)) {
    return ok("ignored: no envelope id");
  }

  if (!signed) {
    // Unsigned or bad signature: never trust the payload. Treat it only as a
    // nudge to re-fetch this envelope from the DocuSign API (admin Refresh path).
    const reason = !secret ? "no secret configured" : signature ? "signature mismatch" : "no signature header";
    if (nudgedRecently(envelopeId)) {
      return ok("ok: recently refreshed");
    }
    const engagement = await getEngagementByEnvelopeId(envelopeId);
    if (!engagement) {
      return ok("ignored: unknown envelope");
    }
    console.log(`[docusign-webhook] unsigned nudge (${reason}) for ${engagement.reference}; re-fetching from DocuSign`);
    try {
      const outcome = await refreshEngagementFromDocuSign(engagement);
      if (!outcome.refreshed) {
        return ok("ignored: not refreshable");
      }
    } catch (error) {
      console.warn(
        `[docusign-webhook] refresh failed for ${engagement.reference}`,
        error instanceof Error ? error.message : error,
      );
      // 500 lets DocuSign retry later; the 15-minute cron is the backstop too.
      return new Response("Unable to refresh DocuSign status.", { status: 500 });
    }
    return ok();
  }

  const engagement = await getEngagementByEnvelopeId(envelopeId);
  if (!engagement) {
    return ok("ignored: unknown envelope");
  }

  if (!isDocuSignEnabled() && engagement.docusign.mode !== "live") {
    return ok();
  }

  try {
    await syncLiveEnvelope(engagement, event.status ?? event.event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply DocuSign status.";
    return new Response(message, { status: 500 });
  }

  return ok();
}
