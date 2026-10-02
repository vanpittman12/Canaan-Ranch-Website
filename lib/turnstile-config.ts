/**
 * Cloudflare Turnstile site key (public). Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
 * at build time, or paste the key here once the widget exists. While this is
 * empty the widget does not render and the server skips verification, so the
 * intake and admin login keep working. Turnstile is enforced only when this
 * key AND the Worker secret `TURNSTILE_SECRET_KEY` are both set.
 */
export const TURNSTILE_SITE_KEY: string =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

/** Form field the Turnstile widget writes its token into. */
export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";
