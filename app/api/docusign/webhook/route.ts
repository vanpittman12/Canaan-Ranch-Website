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

/**
 * Always the same plain body so a caller cannot probe why a request was
 * ignored. The specific reason goes to server logs only.
 */
function ok(reason?: string) {
  if (reason) {
    console.log(`[docusign-webhook] ${reason}`);
  }
  return new Response("ok", { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_CHARS) {
    return ok(`ignored: payload too large (${rawBody.length} chars)`);
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
    return ok(`ignored: unreadable payload (signed=${signed})`);
  }
  const envelopeId = event.envelopeId?.trim() ?? "";
  if (!ENVELOPE_ID_PATTERN.test(envelopeId)) {
    return ok(`ignored: no envelope id (signed=${signed})`);
  }

  if (!signed) {
    // Unsigned or bad signature: never trust the payload. Treat it only as a
    // nudge to re-fetch this envelope from the DocuSign API (admin Refresh path).
    const reason = !secret ? "no secret configured" : signature ? "signature mismatch" : "no signature header";
    if (nudgedRecently(envelopeId)) {
      return ok(`unsigned nudge (${reason}) for ${envelopeId}: recently refreshed`);
    }
    const engagement = await getEngagementByEnvelopeId(envelopeId);
    if (!engagement) {
      return ok(`ignored: unsigned (${reason}), unknown envelope ${envelopeId}`);
    }
    console.log(`[docusign-webhook] unsigned nudge (${reason}) for ${engagement.reference}; re-fetching from DocuSign`);
    try {
      const outcome = await refreshEngagementFromDocuSign(engagement);
      if (!outcome.refreshed) {
        return ok(`unsigned nudge for ${engagement.reference}: not refreshable`);
      }
    } catch (error) {
      console.warn(
        `[docusign-webhook] refresh failed for ${engagement.reference}`,
        error instanceof Error ? error.message : error,
      );
      // Unsigned callers always get 200 ok; the 15-minute cron poll retries.
      return ok(`unsigned nudge for ${engagement.reference}: refresh failed, cron will retry`);
    }
    return ok();
  }

  const engagement = await getEngagementByEnvelopeId(envelopeId);
  if (!engagement) {
    return ok(`ignored: signed, unknown envelope ${envelopeId}`);
  }

  if (!isDocuSignEnabled() && engagement.docusign.mode !== "live") {
    return ok();
  }

  try {
    await syncLiveEnvelope(engagement, event.status ?? event.event);
  } catch (error) {
    // Signed + verified only: 500 so DocuSign Connect retries. Detail stays in logs.
    console.warn(
      `[docusign-webhook] apply failed for ${engagement.reference}`,
      error instanceof Error ? error.message : error,
    );
    return new Response("error", { status: 500, headers: { "Content-Type": "text/plain" } });
  }

  return ok();
}
