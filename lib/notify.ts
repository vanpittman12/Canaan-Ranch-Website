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
import {
  buyerNoticeAddress,
  displayValue,
  formatAuthorizedAgent,
  type Engagement,
  type IntakeFields,
} from "./types";

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
  buyerAttention: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerStreet: string;
  buyerCity: string;
  buyerState: string;
  buyerPostalCode: string;
  tortoiseCount: number;
  relocationCounty: string;
  authorizedAgentName: string;
  authorizedAgentCompany: string;
  donorCompanyAffiliation: string;
  projectName: string;
  projectDescription: string;
  buyerWitnessName: string;
  buyerWitnessEmail: string;
};

export type EmailAttachment = {
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type NewEngagementEmail = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
};

export const RESERVATION_LETTER_NOTIFY_TO = "vpittman@beachparkcap.com";
const MIXED_BOUNDARY = "canaan-preserve-mixed";

export type NotifyResult = {
  mode: NotifyMode;
  sent: boolean;
  error?: string;
};

export type EngagementLike = Pick<Engagement, "id" | "reference"> & {
  intake: Pick<
    IntakeFields,
    | "buyerLegalName"
    | "buyerAttention"
    | "buyerEmail"
    | "buyerPhone"
    | "buyerStreet"
    | "buyerCity"
    | "buyerState"
    | "buyerPostalCode"
    | "relocationCounty"
    | "tortoiseCount"
    | "authorizedAgentName"
    | "authorizedAgentCompany"
    | "donorCompanyAffiliation"
    | "donorSiteName"
    | "donorSiteDescription"
    | "buyerWitnessName"
    | "buyerWitnessEmail"
  >;
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

/** Van plus the buyer notice email. Dedupes if they are the same mailbox. */
export function reservationLetterRecipients(buyerNoticeEmail: string) {
  const recipients = [RESERVATION_LETTER_NOTIFY_TO];
  const buyer = buyerNoticeEmail.trim();
  if (buyer && buyer.toLowerCase() !== RESERVATION_LETTER_NOTIFY_TO.toLowerCase()) {
    recipients.push(buyer);
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
  const { intake } = engagement;
  return {
    id: engagement.id,
    reference: engagement.reference,
    buyerLegalName: intake.buyerLegalName,
    buyerAttention: intake.buyerAttention,
    buyerEmail: intake.buyerEmail,
    buyerPhone: intake.buyerPhone,
    buyerStreet: intake.buyerStreet,
    buyerCity: intake.buyerCity,
    buyerState: intake.buyerState,
    buyerPostalCode: intake.buyerPostalCode,
    tortoiseCount: intake.tortoiseCount,
    relocationCounty: intake.relocationCounty,
    authorizedAgentName: intake.authorizedAgentName,
    authorizedAgentCompany: intake.authorizedAgentCompany,
    donorCompanyAffiliation: intake.donorCompanyAffiliation,
    projectName: intake.donorSiteName,
    projectDescription: intake.donorSiteDescription,
    buyerWitnessName: intake.buyerWitnessName,
    buyerWitnessEmail: intake.buyerWitnessEmail,
  };
}

export function buildNewEngagementEmail(notice: NewEngagementNotice): NewEngagementEmail {
  const reviewUrl = adminReviewUrl(notice.id);
  const subject = `New Canaan Preserve intake — ${notice.reference}`;
  const noticeAddress = displayValue(buyerNoticeAddress(notice));
  const agent = displayValue(formatAuthorizedAgent(notice));
  const text = [
    "A public intake engagement was created.",
    "",
    `Reference: ${notice.reference}`,
    `Project name: ${notice.projectName}`,
    `Buyer legal name: ${notice.buyerLegalName}`,
    `Buyer attention: ${notice.buyerAttention}`,
    `Buyer email: ${notice.buyerEmail}`,
    `Buyer phone: ${notice.buyerPhone}`,
    `Buyer notice address: ${noticeAddress}`,
    `Relocation county: ${notice.relocationCounty}`,
    `Tortoise count: ${notice.tortoiseCount}`,
    `Authorized agent: ${agent}`,
    `Donor company affiliation: ${notice.donorCompanyAffiliation}`,
    `Project description: ${notice.projectDescription || "—"}`,
    `Buyer witness: ${notice.buyerWitnessName} <${notice.buyerWitnessEmail}>`,
    "",
    `Review: ${reviewUrl}`,
  ].join("\n");
  const html = [
    "<p>A public intake engagement was created. Operational fields below are for review — they are not rewritten into the Word agreement unless Van’s file already has a blank.</p>",
    "<ul>",
    `<li><strong>Reference:</strong> ${escapeHtml(notice.reference)}</li>`,
    `<li><strong>Project name:</strong> ${escapeHtml(notice.projectName)}</li>`,
    `<li><strong>Buyer legal name:</strong> ${escapeHtml(notice.buyerLegalName)}</li>`,
    `<li><strong>Buyer attention:</strong> ${escapeHtml(notice.buyerAttention)}</li>`,
    `<li><strong>Buyer email:</strong> ${escapeHtml(notice.buyerEmail)}</li>`,
    `<li><strong>Buyer phone:</strong> ${escapeHtml(notice.buyerPhone)}</li>`,
    `<li><strong>Buyer notice address:</strong> ${escapeHtml(noticeAddress)}</li>`,
    `<li><strong>Relocation county:</strong> ${escapeHtml(notice.relocationCounty)}</li>`,
    `<li><strong>Tortoise count:</strong> ${escapeHtml(String(notice.tortoiseCount))}</li>`,
    `<li><strong>Authorized agent:</strong> ${escapeHtml(agent)}</li>`,
    `<li><strong>Donor company affiliation:</strong> ${escapeHtml(notice.donorCompanyAffiliation)}</li>`,
    `<li><strong>Project description:</strong> ${escapeHtml(notice.projectDescription || "—")}</li>`,
    `<li><strong>Buyer witness:</strong> ${escapeHtml(`${notice.buyerWitnessName} <${notice.buyerWitnessEmail}>`)}</li>`,
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

export function buildReservationLetterEmail(input: {
  reference: string;
  buyerLegalName: string;
  buyerEmail: string;
  donorProjectName: string;
  attachment: EmailAttachment;
}): NewEngagementEmail {
  const subject = `Canaan Preserve reservation letter — ${input.reference}`;
  const text = [
    `The Gopher Tortoise Acceptance Letter for ${input.reference} is attached.`,
    "",
    `Buyer: ${input.buyerLegalName}`,
    `Buyer notice email: ${input.buyerEmail}`,
    `Donor project: ${input.donorProjectName || "—"}`,
    "",
    "This email was sent after admin send approval. Generation does not send mail.",
  ].join("\n");
  const html = [
    `<p>The Gopher Tortoise Acceptance Letter for <strong>${escapeHtml(input.reference)}</strong> is attached.</p>`,
    "<ul>",
    `<li><strong>Buyer:</strong> ${escapeHtml(input.buyerLegalName)}</li>`,
    `<li><strong>Buyer notice email:</strong> ${escapeHtml(input.buyerEmail)}</li>`,
    `<li><strong>Donor project:</strong> ${escapeHtml(input.donorProjectName || "—")}</li>`,
    "</ul>",
    "<p>This email was sent after admin send approval.</p>",
  ].join("");

  return {
    from: notifyFromAddress(),
    to: reservationLetterRecipients(input.buyerEmail),
    subject,
    text,
    html,
    attachments: [input.attachment],
  };
}

export function buildRfc2822Message(email: NewEngagementEmail): string {
  const alternative = [
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
  ].join("\r\n");

  const hasAttachments = Boolean(email.attachments?.length);
  const headers = [
    `From: ${email.from}`,
    `To: ${email.to.join(", ")}`,
    `Subject: ${encodeMimeHeader(email.subject)}`,
    "MIME-Version: 1.0",
  ];

  if (!hasAttachments) {
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${MIME_BOUNDARY}"`,
      "",
      alternative,
      "",
    ].join("\r\n");
  }

  const parts = [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${MIXED_BOUNDARY}"`,
    "",
    `--${MIXED_BOUNDARY}`,
    `Content-Type: multipart/alternative; boundary="${MIME_BOUNDARY}"`,
    "",
    alternative,
  ];
  for (const attachment of email.attachments ?? []) {
    parts.push(
      `--${MIXED_BOUNDARY}`,
      `Content-Type: ${attachment.mimeType}; name="${sanitizeFilename(attachment.filename)}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${sanitizeFilename(attachment.filename)}"`,
      "",
      wrapBase64(bytesToBase64(attachment.bytes)),
    );
  }
  parts.push(`--${MIXED_BOUNDARY}--`, "");
  return parts.join("\r\n");
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
    await sendNotifyEmail(email, http);
    return { mode: "gmail", sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    console.error("[notify] new engagement email failed", error);
    return { mode: "gmail", sent: false, error: message };
  }
}

/**
 * Send the reservation letter after admin send approval. Stub when Gmail
 * secrets are unset (local). Live Gmail failures are returned, not thrown.
 */
export async function notifyReservationLetter(
  email: NewEngagementEmail,
  http: NotifyHttp = defaultHttp(),
): Promise<NotifyResult> {
  if (!isEmailNotifyEnabled()) {
    console.info("[notify] stub: reservation letter email (Gmail OAuth secrets unset)", {
      to: email.to,
      subject: email.subject,
      filename: email.attachments?.[0]?.filename,
    });
    return { mode: "stub", sent: true };
  }

  try {
    await sendNotifyEmail(email, http);
    return { mode: "gmail", sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    console.error("[notify] reservation letter email failed", error);
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

export async function sendNotifyEmail(email: NewEngagementEmail, http: NotifyHttp) {
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

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function wrapBase64(value: string) {
  return value.replace(/(.{76})/g, "$1\r\n").trim();
}

function sanitizeFilename(value: string) {
  return value.replace(/["\r\n]/g, "");
}
