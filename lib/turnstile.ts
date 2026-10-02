import { TURNSTILE_RESPONSE_FIELD, TURNSTILE_SITE_KEY } from "./turnstile-config";

export const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; skipped?: "unconfigured" | "unavailable" }
  | { ok: false; error: string };

const FAILED_MESSAGE = "Please complete the “verify you’re human” check and try again.";

/**
 * Server-side Siteverify. Fails open (with a logged warning) when Turnstile is
 * not configured or Cloudflare cannot be reached, so the site never breaks.
 * A token Cloudflare explicitly rejects fails closed.
 */
export async function verifyTurnstile(
  formData: FormData,
  options: { remoteIp?: string | null; siteKey?: string; secret?: string } = {},
): Promise<TurnstileResult> {
  const secret = (options.secret ?? process.env.TURNSTILE_SECRET_KEY ?? "").trim();
  const siteKey = (options.siteKey ?? TURNSTILE_SITE_KEY).trim();
  if (!secret || !siteKey) {
    console.warn(
      `[turnstile] verification skipped: ${!secret ? "TURNSTILE_SECRET_KEY" : "site key"} is not configured`,
    );
    return { ok: true, skipped: "unconfigured" };
  }

  const token = formData.get(TURNSTILE_RESPONSE_FIELD);
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, error: FAILED_MESSAGE };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (options.remoteIp) {
    body.set("remoteip", options.remoteIp);
  }

  let outcome: { success?: boolean; "error-codes"?: string[] };
  try {
    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      body,
    });
    if (!response.ok) {
      console.warn(`[turnstile] siteverify returned HTTP ${response.status}; failing open`);
      return { ok: true, skipped: "unavailable" };
    }
    outcome = (await response.json()) as typeof outcome;
  } catch (error) {
    console.warn(
      "[turnstile] siteverify request failed; failing open",
      error instanceof Error ? error.message : error,
    );
    return { ok: true, skipped: "unavailable" };
  }

  if (outcome.success === true) {
    return { ok: true };
  }
  const codes = outcome["error-codes"] ?? [];
  if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
    console.warn("[turnstile] secret rejected by siteverify; failing open", codes);
    return { ok: true, skipped: "unconfigured" };
  }
  console.warn("[turnstile] token rejected", codes);
  return { ok: false, error: FAILED_MESSAGE };
}
