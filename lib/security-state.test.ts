import { beforeEach, describe, expect, it } from "vitest";
import { createAdminSession, verifyAdminSession, verifyAdminSessionSignature } from "./auth";
import { honeypotTripped, INTAKE_HONEYPOT_FIELD } from "./intake-spam";
import {
  ADMIN_LOGIN_RULE,
  bumpAdminSessionVersion,
  clearRateLimit,
  rateLimitStatus,
  recordRateLimitHit,
  resetSecurityStateForTests,
} from "./security-state";

beforeEach(() => resetSecurityStateForTests());

describe("rate limits", () => {
  it("blocks after 5 failures in 15 minutes and resets after the window", async () => {
    const key = "admin-login:203.0.113.9";
    const t0 = 1_000_000;
    for (let i = 0; i < 4; i += 1) {
      expect((await recordRateLimitHit(key, ADMIN_LOGIN_RULE, t0 + i)).blocked).toBe(false);
    }
    expect((await recordRateLimitHit(key, ADMIN_LOGIN_RULE, t0 + 5)).blocked).toBe(true);
    expect((await rateLimitStatus(key, ADMIN_LOGIN_RULE, t0 + 60_000)).blocked).toBe(true);
    expect(
      (await rateLimitStatus(key, ADMIN_LOGIN_RULE, t0 + ADMIN_LOGIN_RULE.windowMs + 1)).blocked,
    ).toBe(false);
    await clearRateLimit(key);
    expect((await rateLimitStatus(key, ADMIN_LOGIN_RULE, t0 + 10)).count).toBe(0);
  });
});

describe("admin session revocation", () => {
  it("revokes outstanding sessions when the version is bumped", async () => {
    const token = await createAdminSession();
    await expect(verifyAdminSession(token)).resolves.toBe(true);
    await bumpAdminSessionVersion();
    await expect(verifyAdminSession(token)).resolves.toBe(false);
    // Signature is still intact; only the revocation check fails.
    await expect(verifyAdminSessionSignature(token)).resolves.toBe(true);
    await expect(verifyAdminSession(await createAdminSession())).resolves.toBe(true);
  });

  it("rejects legacy two-part tokens", async () => {
    const token = await createAdminSession();
    const [, issuedAt, sig] = token.split(".");
    await expect(verifyAdminSession(`${issuedAt}.${sig}`)).resolves.toBe(false);
  });
});

describe("intake honeypot", () => {
  it("trips only when the hidden field has a value", () => {
    const form = new FormData();
    expect(honeypotTripped(form)).toBe(false);
    form.set(INTAKE_HONEYPOT_FIELD, "");
    expect(honeypotTripped(form)).toBe(false);
    form.set(INTAKE_HONEYPOT_FIELD, "http://spam.example");
    expect(honeypotTripped(form)).toBe(true);
  });
});
