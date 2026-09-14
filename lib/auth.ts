export const ADMIN_COOKIE = "cr_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;
const DOCUMENT_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const encoder = new TextEncoder();

export type DocumentKind = "contract" | "signed" | "letter";

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

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const value of view) {
    binary += String.fromCharCode(value);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i] ^ right[i];
  }
  return diff === 0;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(value: string) {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(value));
  return bytesToBase64Url(signature);
}

export async function createAdminSession() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${await sign(issuedAt)}`;
}

export async function verifyAdminSession(token: string | undefined | null) {
  if (!token) {
    return false;
  }
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) {
    return false;
  }
  const expected = await sign(issuedAt);
  if (!timingSafeEqual(base64UrlToBytes(signature), base64UrlToBytes(expected))) {
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

export async function createDocumentToken(engagementId: string, kind: DocumentKind) {
  const expiresAt = Date.now() + DOCUMENT_TOKEN_TTL_MS;
  const payload = `${kind}:${engagementId}:${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyDocumentToken(
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
  const expected = await sign(payload);
  if (!timingSafeEqual(base64UrlToBytes(signature), base64UrlToBytes(expected))) {
    return false;
  }
  const [doc, id, expiresAt] = payload.split(":");
  if (doc !== kind || id !== engagementId) {
    return false;
  }
  const exp = Number(expiresAt);
  return Number.isFinite(exp) && exp > Date.now();
}

export async function canAccessEngagementDocument(input: {
  adminToken?: string | null;
  downloadToken?: string | null;
  engagementId: string;
  kind: DocumentKind;
}) {
  if (await verifyAdminSession(input.adminToken)) {
    return true;
  }
  return verifyDocumentToken(input.downloadToken, input.engagementId, input.kind);
}

export async function documentDownloadPath(engagementId: string, kind: DocumentKind) {
  const token = await createDocumentToken(engagementId, kind);
  return `/api/engagements/${engagementId}/${kind}?token=${encodeURIComponent(token)}`;
}

export function passwordsMatch(provided: string) {
  const expected = adminPassword();
  const left = encoder.encode(provided);
  const right = encoder.encode(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
