import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "cr_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;
const DOCUMENT_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

export type DocumentKind = "contract" | "signed";

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET is required in production.");
  }
  return "canaan-preserve-dev-session-secret";
}

export function adminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    return password;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD is required in production.");
  }
  return "canaan-admin";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createAdminSession() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifyAdminSession(token: string | undefined | null) {
  if (!token) {
    return false;
  }
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) {
    return false;
  }
  const expected = sign(issuedAt);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }
  const ageMs = Date.now() - Number(issuedAt);
  return Number.isFinite(ageMs) && ageMs >= 0 && ageMs < MAX_AGE_SECONDS * 1000;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function createDocumentToken(engagementId: string, kind: DocumentKind) {
  const expiresAt = Date.now() + DOCUMENT_TOKEN_TTL_MS;
  const payload = `${kind}:${engagementId}:${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyDocumentToken(
  token: string | undefined | null,
  engagementId: string,
  kind: DocumentKind,
) {
  if (!token) {
    return false;
  }
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) {
    return false;
  }
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }
  const [doc, id, expiresAt] = payload.split(":");
  if (doc !== kind || id !== engagementId) {
    return false;
  }
  const exp = Number(expiresAt);
  return Number.isFinite(exp) && exp > Date.now();
}

export function canAccessEngagementDocument(input: {
  adminToken?: string | null;
  downloadToken?: string | null;
  engagementId: string;
  kind: DocumentKind;
}) {
  if (verifyAdminSession(input.adminToken)) {
    return true;
  }
  return verifyDocumentToken(input.downloadToken, input.engagementId, input.kind);
}

export function documentDownloadPath(engagementId: string, kind: DocumentKind) {
  const token = createDocumentToken(engagementId, kind);
  return `/api/engagements/${engagementId}/${kind}?token=${encodeURIComponent(token)}`;
}

export function passwordsMatch(provided: string) {
  const expected = adminPassword();
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
