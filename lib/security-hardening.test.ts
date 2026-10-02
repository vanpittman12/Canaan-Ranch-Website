import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canAccessEngagementDocument,
  createAdminSession,
  createDocumentToken,
  verifyAdminSession,
  verifyDocumentToken,
} from "./auth";
import { attachmentDisposition, hasPdfMagicBytes } from "./http";
import { verifyTurnstile, TURNSTILE_SITEVERIFY_URL } from "./turnstile";
import { intakeSchema } from "./validation";

const engagementId = "34cb532f-d3ca-4e6b-9657-d2beef2faef3";

describe("malformed session and document tokens", () => {
  const malformed = [
    "garbage",
    "123.%%%",
    "123.A",
    "abc.def",
    "1.2.3",
    ".",
    "123.!!!!",
    "123.\u00ff\u00fe",
  ];

  it.each(malformed)("treats admin cookie %j as unauthenticated", async (token) => {
    await expect(verifyAdminSession(token)).resolves.toBe(false);
  });

  it.each(malformed)("treats download token %j as unauthenticated", async (token) => {
    await expect(verifyDocumentToken(token, engagementId, "contract")).resolves.toBe(false);
    await expect(
      canAccessEngagementDocument({
        adminToken: token,
        downloadToken: token,
        engagementId,
        kind: "signed",
      }),
    ).resolves.toBe(false);
  });

  it("still accepts valid tokens", async () => {
    await expect(verifyAdminSession(await createAdminSession())).resolves.toBe(true);
    const token = await createDocumentToken(engagementId, "letter");
    await expect(verifyDocumentToken(token, engagementId, "letter")).resolves.toBe(true);
    await expect(verifyDocumentToken(`${token}A`, engagementId, "letter")).resolves.toBe(false);
  });
});

describe("upload hardening", () => {
  it("checks the %PDF- magic bytes", () => {
    expect(hasPdfMagicBytes(new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
    expect(hasPdfMagicBytes(new TextEncoder().encode("<html>"))).toBe(false);
    expect(hasPdfMagicBytes(new Uint8Array([0x25, 0x50]))).toBe(false);
  });

  it("sanitizes Content-Disposition filenames", () => {
    expect(attachmentDisposition("signed.pdf")).toBe(
      `attachment; filename="signed.pdf"; filename*=UTF-8''signed.pdf`,
    );
    const nasty = attachmentDisposition('a"b\r\nSet-Cookie: x=1;\\..\\evil.pdf');
    expect(nasty).not.toMatch(/[\r\n]/);
    expect(nasty.split("filename*=")[0]).not.toContain('a"b');
    expect(attachmentDisposition("../../etc/passwd")).toContain('filename="passwd"');
    expect(attachmentDisposition("Résumé.pdf")).toContain('filename="R_sum_.pdf"');
    expect(attachmentDisposition("", "fallback.pdf")).toContain('filename="fallback.pdf"');
  });

  it("signed, contract, and letter routes use the sanitized header", () => {
    for (const kind of ["signed", "contract", "letter"]) {
      const src = readFileSync(`app/api/engagements/[id]/${kind}/route.ts`, "utf8");
      expect(src).toContain("attachmentDisposition(");
      expect(src).not.toContain('attachment; filename="${');
    }
  });
});

describe("intake length limits", () => {
  it("rejects oversized text fields", () => {
    const result = intakeSchema.safeParse({ buyerLegalName: "x".repeat(201) });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((item) => item.path[0] === "buyerLegalName");
    expect(issue?.message).toContain("200");
    const notes = intakeSchema.safeParse({ donorSiteDescription: "x".repeat(5001) });
    expect(
      notes.error?.issues.some((item) => item.path[0] === "donorSiteDescription"),
    ).toBe(true);
  });
});

describe("turnstile siteverify", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function form(token?: string) {
    const data = new FormData();
    if (token !== undefined) {
      data.set("cf-turnstile-response", token);
    }
    return data;
  }

  it("fails open with a warning when the secret is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await verifyTurnstile(form(), { secret: "", siteKey: "site" });
    expect(result).toEqual({ ok: true, skipped: "unconfigured" });
    expect(warn).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails open when the site key is missing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await verifyTurnstile(form(), { secret: "secret", siteKey: "" });
    expect(result.ok).toBe(true);
  });

  it("rejects a missing token when configured", async () => {
    const result = await verifyTurnstile(form(), { secret: "secret", siteKey: "site" });
    expect(result.ok).toBe(false);
  });

  it("verifies the token server-side", async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await verifyTurnstile(form("tok"), {
      secret: "secret",
      siteKey: "site",
      remoteIp: "203.0.113.5",
    });
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(TURNSTILE_SITEVERIFY_URL);
    const body = init.body as URLSearchParams;
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("203.0.113.5");
  });

  it("rejects a token Cloudflare rejects", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ success: false, "error-codes": ["invalid-input-response"] })),
    );
    const result = await verifyTurnstile(form("bad"), { secret: "secret", siteKey: "site" });
    expect(result.ok).toBe(false);
  });

  it("fails open when siteverify is unreachable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    const result = await verifyTurnstile(form("tok"), { secret: "secret", siteKey: "site" });
    expect(result.ok).toBe(true);
  });
});

describe("worker config hardening", () => {
  it("disables workers.dev and preview URLs", () => {
    const wrangler = readFileSync("wrangler.jsonc", "utf8");
    expect(wrangler).toContain('"workers_dev": false');
    expect(wrangler).toContain('"preview_urls": false');
  });

  it("sends security headers from next.config and _headers", () => {
    for (const file of ["next.config.ts", "public/_headers"]) {
      const src = readFileSync(file, "utf8");
      expect(src).toContain("X-Frame-Options");
      expect(src).toContain("frame-ancestors 'none'");
      expect(src).toContain("nosniff");
      expect(src).toContain("strict-origin-when-cross-origin");
      expect(src).toContain("camera=(), microphone=(), geolocation=()");
    }
  });
});
