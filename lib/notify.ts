/**
 * New-engagement email seam.
 *
 * After a public intake create succeeds, call notifyNewEngagement (via
 * persistAndNotifyNewEngagement). Missing Gmail OAuth secrets use a console stub.
 * A live Gmail failure is logged and never thrown to the intake caller.
 *
 * Provider is Gmail API over HTTPS (fetch). SMTP / nodemailer / App Passwords
 * are not used — Cloudflare Workers cannot open outbound SMTP sockets
 * (ports 25 / 465 / 587). The app already uses fetch for DocuSign.
 */
import { brand } from "./brand";
import type { Engagement, IntakeFields } from "./types";

export const NEW_ENGAGEMENT_NOTIFY_TO = "vpittman@beachparkcap.com";
export const DEFAULT_GMAIL_USER = "vpittman@beachparkcap.com";
export const GMAIL_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GMAIL_SEND_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const SEND_TIMEOUT_MS = 8_000;
const MIME_BOUNDARY = "canaan-preserve-notify";

export type NotifyMode = "stub" | "gmail";

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

export type GmailOAuthSecrets = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export function readGmailOAuthSecrets(): GmailOAuthSecrets | null {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }
  return { clientId, clientSecret, refreshToken };
}

export function isEmailNotifyEnabled() {
  return readGmailOAuthSecrets() !== null;
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
  const configured = process.env.GMAIL_USER?.trim();
  if (configured) {
    return configured.includes("<") ? configured : `${brand.name} <${configured}>`;
  }
  return `${brand.name} <${DEFAULT_GMAIL_USER}>`;
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

export function buildRfc2822Message(email: NewEngagementEmail): string {
  const lines = [
    `From: ${email.from}`,
    `To: ${email.to.join(", ")}`,
    `Subject: ${encodeMimeHeader(email.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${MIME_BOUNDARY}"`,
    "",
    `--${MIME_BOUNDARY}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    email.text,
    `--${MIME_BOUNDARY}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    email.html,
    `--${MIME_BOUNDARY}--`,
    "",
  ];
  return lines.join("\r\n");
}

export function toGmailRaw(rfc2822: string): string {
  return utf8ToBase64Url(rfc2822);
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
    console.info("[notify] stub: new engagement email (Gmail OAuth secrets unset)", {
      to: email.to,
      subject: email.subject,
      text: email.text,
    });
    return { mode: "stub", sent: false };
  }

  try {
    await sendViaGmail(email, http);
    return { mode: "gmail", sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    console.error("[notify] new engagement email failed", error);
    return { mode: "gmail", sent: false, error: message };
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

async function sendViaGmail(email: NewEngagementEmail, http: NotifyHttp) {
  const secrets = readGmailOAuthSecrets();
  if (!secrets) {
    throw new Error("Gmail OAuth secrets are not set.");
  }

  const accessToken = await refreshGmailAccessToken(secrets, http);
  const response = await http.fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toGmailRaw(buildRfc2822Message(email)) }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail send failed (${response.status}): ${body.slice(0, 240)}`);
  }
}

async function refreshGmailAccessToken(secrets: GmailOAuthSecrets, http: NotifyHttp) {
  const response = await http.fetch(GMAIL_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: secrets.clientId,
      client_secret: secrets.clientSecret,
      refresh_token: secrets.refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail OAuth token failed (${response.status}): ${body.slice(0, 240)}`);
  }

  let parsed: { access_token?: unknown };
  try {
    parsed = JSON.parse(body) as { access_token?: unknown };
  } catch {
    throw new Error("Gmail OAuth token response was not JSON.");
  }

  if (typeof parsed.access_token !== "string" || !parsed.access_token) {
    throw new Error("Gmail OAuth token response did not include access_token.");
  }

  return parsed.access_token;
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

function encodeMimeHeader(value: string) {
  if (/^[\x20-\x7E]*$/.test(value)) {
    return value;
  }
  return `=?UTF-8?B?${utf8ToBase64(value)}?=`;
}

function utf8ToBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function utf8ToBase64Url(value: string) {
  return utf8ToBase64(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}
