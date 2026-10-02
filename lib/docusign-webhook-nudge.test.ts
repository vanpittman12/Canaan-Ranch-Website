import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Engagement } from "./types";

vi.mock("server-only", () => ({}));

const store = vi.hoisted(() => ({
  listEngagements: vi.fn(),
  getEngagementByEnvelopeId: vi.fn(),
}));
const docusign = vi.hoisted(() => ({
  getLiveEnvelopeStatus: vi.fn(),
  syncLiveEnvelope: vi.fn(),
}));

vi.mock("@/lib/store", () => store);
vi.mock("./store", () => store);
vi.mock("@/lib/docusign-complete", () => ({ syncLiveEnvelope: docusign.syncLiveEnvelope }));
vi.mock("./docusign-complete", () => ({ syncLiveEnvelope: docusign.syncLiveEnvelope }));
vi.mock("./docusign", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./docusign")>()),
  getLiveEnvelopeStatus: docusign.getLiveEnvelopeStatus,
}));
vi.mock("@/lib/docusign", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./docusign")>()),
  getLiveEnvelopeStatus: docusign.getLiveEnvelopeStatus,
}));

const { POST } = await import("@/app/api/docusign/webhook/route");
const { POST: POLL } = await import("@/app/api/docusign/poll/route");
const { pollOpenEnvelopes, hasOpenEnvelope, POLL_BATCH_LIMIT } = await import("./docusign-refresh");
const { resetNudgeDedupe } = await import("./webhook-dedupe");
const { cronAuthToken, isValidCronAuth, CRON_AUTH_HEADER } = await import("./cron-auth");
const { createHmac } = await import("node:crypto");

const ENVELOPE = "11111111-2222-4333-8444-555555555555";
const originalEnv = { ...process.env };

function engagement(overrides: Partial<Engagement> = {}, docusignOverrides = {}): Engagement {
  return {
    id: "eng-1",
    reference: "CP-2026-TEST",
    status: "accepted",
    signingMethod: "docusign",
    updatedAt: "2026-09-30T00:00:00.000Z",
    docusign: { mode: "live", envelopeId: ENVELOPE, status: "sent", ...docusignOverrides },
    ...overrides,
  } as unknown as Engagement;
}

function xmlBody(envelopeId = ENVELOPE, status = "Completed") {
  return `<?xml version="1.0"?><DocuSignEnvelopeInformation><EnvelopeStatus><EnvelopeID>${envelopeId}</EnvelopeID><Status>${status}</Status></EnvelopeStatus></DocuSignEnvelopeInformation>`;
}

function webhook(body: string, signature?: string) {
  const headers: Record<string, string> = { "content-type": "text/xml; charset=utf-8" };
  if (signature) {
    headers["x-docusign-signature-1"] = signature;
  }
  return new Request("https://canaanpreserve.com/api/docusign/webhook", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  process.env.DOCUSIGN_ENABLED = "true";
  process.env.DOCUSIGN_WEBHOOK_SECRET = "connect-secret";
  process.env.ADMIN_SESSION_SECRET = "session-secret";
  resetNudgeDedupe();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  docusign.getLiveEnvelopeStatus.mockResolvedValue({ envelopeId: ENVELOPE, status: "completed" });
  docusign.syncLiveEnvelope.mockImplementation(async (item: Engagement) => item);
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("DocuSign webhook", () => {
  it("unsigned call: ignores the payload, re-fetches from the DocuSign API, returns 200", async () => {
    const item = engagement();
    store.getEngagementByEnvelopeId.mockResolvedValue(item);
    // Payload claims "Completed" — must not be trusted.
    const response = await POST(webhook(xmlBody(ENVELOPE, "Completed")));
    expect(response.status).toBe(200);
    expect(docusign.getLiveEnvelopeStatus).toHaveBeenCalledWith(ENVELOPE, undefined);
    // Status applied is DocuSign's API answer, not the posted one.
    docusign.getLiveEnvelopeStatus.mockResolvedValue({ envelopeId: ENVELOPE, status: "delivered" });
    resetNudgeDedupe();
    await POST(webhook(xmlBody(ENVELOPE, "Completed")));
    expect(docusign.syncLiveEnvelope).toHaveBeenLastCalledWith(item, "delivered", undefined);
  });

  it("bad signature is treated the same as no signature", async () => {
    store.getEngagementByEnvelopeId.mockResolvedValue(engagement());
    const response = await POST(webhook(xmlBody(), "AAAA"));
    expect(response.status).toBe(200);
    expect(docusign.getLiveEnvelopeStatus).toHaveBeenCalledTimes(1);
    expect(docusign.syncLiveEnvelope).toHaveBeenCalledWith(expect.anything(), "completed", undefined);
  });

  it("works when the webhook secret is not configured", async () => {
    delete process.env.DOCUSIGN_WEBHOOK_SECRET;
    store.getEngagementByEnvelopeId.mockResolvedValue(engagement());
    const response = await POST(webhook(xmlBody()));
    expect(response.status).toBe(200);
    expect(docusign.getLiveEnvelopeStatus).toHaveBeenCalledTimes(1);
  });

  it("unknown envelope returns 200 and changes nothing", async () => {
    store.getEngagementByEnvelopeId.mockResolvedValue(null);
    const response = await POST(webhook(xmlBody("99999999-9999-4999-8999-999999999999")));
    expect(response.status).toBe(200);
    expect(docusign.getLiveEnvelopeStatus).not.toHaveBeenCalled();
    expect(docusign.syncLiveEnvelope).not.toHaveBeenCalled();
  });

  it("missing or malformed envelope id returns 200 without a lookup", async () => {
    for (const body of ["", "not xml", xmlBody("not-a-uuid"), "{\"envelopeId\":\"x\"}", "{bad json"]) {
      const response = await POST(webhook(body));
      expect(response.status).toBe(200);
    }
    expect(store.getEngagementByEnvelopeId).not.toHaveBeenCalled();
  });

  it("dedupes repeated unsigned nudges for the same envelope", async () => {
    store.getEngagementByEnvelopeId.mockResolvedValue(engagement());
    await POST(webhook(xmlBody()));
    await POST(webhook(xmlBody()));
    await POST(webhook(xmlBody()));
    expect(docusign.getLiveEnvelopeStatus).toHaveBeenCalledTimes(1);
  });

  it("does not refresh engagements that are not on the live DocuSign path", async () => {
    store.getEngagementByEnvelopeId.mockResolvedValue(engagement({ status: "draft" } as Partial<Engagement>));
    const response = await POST(webhook(xmlBody()));
    expect(response.status).toBe(200);
    expect(docusign.getLiveEnvelopeStatus).not.toHaveBeenCalled();
  });

  it("valid signature keeps the current path (payload status, no re-fetch)", async () => {
    const item = engagement();
    store.getEngagementByEnvelopeId.mockResolvedValue(item);
    const body = xmlBody(ENVELOPE, "Completed");
    const signature = createHmac("sha256", "connect-secret").update(body, "utf8").digest("base64");
    const response = await POST(webhook(body, signature));
    expect(response.status).toBe(200);
    expect(docusign.getLiveEnvelopeStatus).not.toHaveBeenCalled();
    expect(docusign.syncLiveEnvelope).toHaveBeenCalledWith(item, "Completed");
  });
});

describe("15-minute DocuSign poll", () => {
  it("only refreshes open live envelopes, capped per run", async () => {
    const open = Array.from({ length: POLL_BATCH_LIMIT + 5 }, (_, i) =>
      engagement({ id: `open-${i}`, updatedAt: `2026-09-${String(10 + (i % 18)).padStart(2, "0")}T00:00:00Z` } as Partial<Engagement>, { status: i % 2 ? "sent" : "delivered" }),
    );
    const closed = [
      engagement({ id: "done" } as Partial<Engagement>, { status: "completed" }),
      engagement({ id: "void" } as Partial<Engagement>, { status: "voided" }),
      engagement({ id: "stub" } as Partial<Engagement>, { mode: "stub" }),
      engagement({ id: "manual", signingMethod: "manual" } as Partial<Engagement>),
      engagement({ id: "noenv" } as Partial<Engagement>, { envelopeId: null }),
    ];
    expect(closed.some(hasOpenEnvelope)).toBe(false);
    store.listEngagements.mockResolvedValue([...closed, ...open]);
    const summary = await pollOpenEnvelopes();
    expect(summary.open).toBe(POLL_BATCH_LIMIT + 5);
    expect(summary.refreshed).toBe(POLL_BATCH_LIMIT);
    expect(summary.skippedOverLimit).toBe(5);
    expect(docusign.getLiveEnvelopeStatus).toHaveBeenCalledTimes(POLL_BATCH_LIMIT);
  });

  it("keeps going when one refresh fails", async () => {
    store.listEngagements.mockResolvedValue([
      engagement({ id: "a" } as Partial<Engagement>),
      engagement({ id: "b" } as Partial<Engagement>),
    ]);
    docusign.getLiveEnvelopeStatus
      .mockRejectedValueOnce(new Error("DocuSign 500"))
      .mockResolvedValueOnce({ envelopeId: ENVELOPE, status: "sent" });
    const summary = await pollOpenEnvelopes();
    expect(summary.failed).toBe(1);
    expect(summary.refreshed).toBe(1);
  });

  it("poll route requires the internal cron HMAC", async () => {
    store.listEngagements.mockResolvedValue([]);
    const anon = await POLL(new Request("https://canaanpreserve.com/api/docusign/poll", { method: "POST" }));
    expect(anon.status).toBe(404);
    const forged = await POLL(
      new Request("https://canaanpreserve.com/api/docusign/poll", {
        method: "POST",
        headers: { [CRON_AUTH_HEADER]: await cronAuthToken("wrong-secret") },
      }),
    );
    expect(forged.status).toBe(404);
    const authed = await POLL(
      new Request("https://canaanpreserve.com/api/docusign/poll", {
        method: "POST",
        headers: { [CRON_AUTH_HEADER]: await cronAuthToken("session-secret") },
      }),
    );
    expect(authed.status).toBe(200);
    expect(await isValidCronAuth(undefined, "session-secret")).toBe(false);
    expect(await isValidCronAuth("x", undefined)).toBe(false);
  });

  it("worker entry wires the cron to the poll route and wrangler registers it", () => {
    const worker = readFileSync("worker.ts", "utf8");
    expect(worker).toContain("async scheduled(");
    expect(worker).toContain("DOCUSIGN_POLL_PATH");
    expect(worker).toContain("DOQueueHandler");
    const wrangler = readFileSync("wrangler.jsonc", "utf8");
    expect(wrangler).toContain('"main": "worker.ts"');
    expect(wrangler).toContain('"crons": ["*/15 * * * *"]');
    expect(wrangler).toContain('"database_id": "6b019288-cb8a-432f-9d09-ef96265662e0"');
  });

  it("admin Refresh uses the shared refresh path", () => {
    const admin = readFileSync("app/actions/admin.ts", "utf8");
    expect(admin).toContain("refreshEngagementFromDocuSign(engagement)");
  });
});

describe("icons and share image", () => {
  it("ships favicon.ico, a 180px apple-touch-icon, and a 1200x630 og:image", () => {
    const ico = readFileSync("public/favicon.ico");
    expect([...ico.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
    const png = (file: string) => {
      const bytes = readFileSync(file);
      return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    };
    expect(png("public/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
    expect(png("public/og-image.png")).toEqual({ width: 1200, height: 630 });
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("/favicon.ico");
    expect(layout).toContain("/apple-touch-icon.png");
    expect(layout).toContain("OG_IMAGE");
  });
});
