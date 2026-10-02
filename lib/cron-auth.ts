/**
 * Internal auth for the cron → `/api/docusign/poll` hop. The scheduled handler
 * in `worker.ts` calls the Worker's own fetch handler in-process (the request
 * never leaves the isolate) with an HMAC derived from ADMIN_SESSION_SECRET, so
 * outside callers cannot trigger a poll. Dependency-free so `worker.ts` can
 * import it without pulling in Next.js.
 */
export const CRON_AUTH_HEADER = "x-canaan-cron-auth";
export const DOCUSIGN_POLL_PATH = "/api/docusign/poll";
const CRON_AUTH_LABEL = "canaan-preserve:docusign-poll:v1";

export async function cronAuthToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(CRON_AUTH_LABEL)),
  );
  let hex = "";
  for (const byte of signature) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

export async function isValidCronAuth(
  provided: string | null | undefined,
  secret: string | null | undefined,
): Promise<boolean> {
  if (!provided || !secret) {
    return false;
  }
  const expected = await cronAuthToken(secret);
  if (provided.length !== expected.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
