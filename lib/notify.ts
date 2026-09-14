/**
 * New-engagement email seam.
 *
 * After a public intake create succeeds, call notifyNewEngagement (via
 * persistAndNotifyNewEngagement). Missing RESEND_API_KEY uses a console stub.
 * A live Resend failure is logged and never thrown to the intake caller.
 *
 * Provider is Resend over HTTPS (fetch). SMTP is not used — Cloudflare Workers
 * have no reliable outbound SMTP, and the app already uses fetch for DocuSign.
 */
import { brand } from "./brand";
import type { Engagement, IntakeFields } from "./types";

export const NEW_ENGAGEMENT_NOTIFY_TO = "vpittman@beachparkcap.com";
export const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 8_000;

export type NotifyMode = "stub" | "resend";

export type NotifyHttp = {
  fetch: typeof fetch;
};

export type NewEngagementNotice = {
  id: string;
  reference: string;
  buyerLegalName: string;
  relocationCounty: string;
  tortoiseCount: number;
};

export type NewEngagementEmail = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
};

export type NotifyResult = {
  mode: NotifyMode;
  sent: boolean;
  error?: string;
};

export type EngagementLike = Pick<Engagement, "id" | "reference"> & {
  intake: Pick<IntakeFields, "buyerLegalName" | "relocationCounty" | "tortoiseCount">;
};

export function isEmailNotifyEnabled() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function newEngagementRecipients() {
  const primary =
    process.env.NOTIFY_NEW_ENGAGEMENT_TO?.trim() || NEW_ENGAGEMENT_NOTIFY_TO;
  const recipients = [primary];
  if (brand.email && brand.email !== primary) {
    recipients.push(brand.email);
  }
  return recipients;
}

export function notifyFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) {
    return configured;
  }
  return `${brand.name} <${brand.email}>`;
}

export function publicAppOrigin() {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) {
    return stripSlash(explicit);
  }
  const returnUrl = process.env.DOCUSIGN_RETURN_URL?.trim();
  if (returnUrl) {
    try {
      return new URL(returnUrl).origin;
    } catch {
      /* ignore invalid return URL */
    }
  }
  if (process.env.NODE_ENV === "production") {
    return "https://canaanpreserve.com";
  }
  return "http://localhost:3000";
}

export function adminReviewUrl(engagementId: string) {
  return `${publicAppOrigin()}/admin/engagements/${engagementId}`;
}

export function toNewEngagementNotice(engagement: EngagementLike): NewEngagementNotice {
  return {
    id: engagement.id,
    reference: engagement.reference,
    buyerLegalName: engagement.intake.buyerLegalName,
    relocationCounty: engagement.intake.relocationCounty,
    tortoiseCount: engagement.intake.tortoiseCount,
  };
}

export function buildNewEngagementEmail(notice: NewEngagementNotice): NewEngagementEmail {
  const reviewUrl = adminReviewUrl(notice.id);
  const subject = `New Canaan Preserve intake — ${notice.reference}`;
  const text = [
    "A public intake engagement was created.",
    "",
    `Reference: ${notice.reference}`,
    `Buyer legal name: ${notice.buyerLegalName}`,
    `Relocation county: ${notice.relocationCounty}`,
    `Tortoise count: ${notice.tortoiseCount}`,
    "",
    `Review: ${reviewUrl}`,
  ].join("\n");
  const html = [
    "<p>A public intake engagement was created.</p>",
    "<ul>",
    `<li><strong>Reference:</strong> ${escapeHtml(notice.reference)}</li>`,
    `<li><strong>Buyer legal name:</strong> ${escapeHtml(notice.buyerLegalName)}</li>`,
    `<li><strong>Relocation county:</strong> ${escapeHtml(notice.relocationCounty)}</li>`,
    `<li><strong>Tortoise count:</strong> ${escapeHtml(String(notice.tortoiseCount))}</li>`,
    "</ul>",
    `<p><a href="${escapeHtml(reviewUrl)}">Open admin review</a></p>`,
  ].join("");

  return {
    from: notifyFromAddress(),
    to: newEngagementRecipients(),
    subject,
    text,
    html,
  };
}

/**
 * Send (or stub) the new-engagement email. Never throws — intake must succeed
 * even when the provider is down or misconfigured.
 */
export async function notifyNewEngagement(
  notice: NewEngagementNotice,
  http: NotifyHttp = defaultHttp(),
): Promise<NotifyResult> {
  const email = buildNewEngagementEmail(notice);
  if (!isEmailNotifyEnabled()) {
    console.info("[notify] stub: new engagement email (RESEND_API_KEY unset)", {
      to: email.to,
      subject: email.subject,
      text: email.text,
    });
    return { mode: "stub", sent: false };
  }

  try {
    await sendViaResend(email, http);
    return { mode: "resend", sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    console.error("[notify] new engagement email failed", error);
    return { mode: "resend", sent: false, error: message };
  }
}

export async function persistAndNotifyNewEngagement<T extends EngagementLike>(
  persist: () => Promise<T>,
  http: NotifyHttp = defaultHttp(),
): Promise<T> {
  const engagement = await persist();
  await notifyNewEngagement(toNewEngagementNotice(engagement), http);
  return engagement;
}

async function sendViaResend(email: NewEngagementEmail, http: NotifyHttp) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set.");
  }

  const response = await http.fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Resend emails failed (${response.status}): ${body.slice(0, 240)}`);
  }
}

function defaultHttp(): NotifyHttp {
  return { fetch: globalThis.fetch.bind(globalThis) };
}

function stripSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
