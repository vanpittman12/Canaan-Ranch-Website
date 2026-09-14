import { afterEach, describe, expect, it, vi } from "vitest";
import { brand } from "./brand";
import {
  adminReviewUrl,
  buildNewEngagementEmail,
  DEFAULT_GMAIL_USER,
  GMAIL_OAUTH_TOKEN_URL,
  GMAIL_SEND_URL,
  NEW_ENGAGEMENT_NOTIFY_TO,
  newEngagementRecipients,
  notifyFromAddress,
  notifyNewEngagement,
  persistAndNotifyNewEngagement,
  publicAppOrigin,
  toNewEngagementNotice,
} from "./notify";

const originalEnv = { ...process.env };

const notice = {
  id: "34cb532f-d3ca-4e6b-9657-d2beef2faef3",
  reference: "CP-2026-TEST",
  buyerLegalName: "Suncoast Land Partners LLC",
  relocationCounty: "Hillsborough",
  tortoiseCount: 10,
};

function engagement() {
  return {
    id: notice.id,
    reference: notice.reference,
    intake: {
      buyerLegalName: notice.buyerLegalName,
      relocationCounty: notice.relocationCounty,
      tortoiseCount: notice.tortoiseCount,
    },
  };
}

function setGmailSecrets() {
  process.env.GMAIL_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
  process.env.GMAIL_CLIENT_SECRET = "test-client-secret";
  process.env.GMAIL_REFRESH_TOKEN = "test-refresh-token";
}

function clearGmailSecrets() {
  delete process.env.GMAIL_CLIENT_ID;
  delete process.env.GMAIL_CLIENT_SECRET;
  delete process.env.GMAIL_REFRESH_TOKEN;
  delete process.env.GMAIL_USER;
}

function decodeGmailRaw(raw: string) {
  const padded = raw.replaceAll("-", "+").replaceAll("_", "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64").toString("utf8");
}

function mockGmailSendSuccess() {
  return vi.fn().mockImplementation(async (url: string) => {
    if (url === GMAIL_OAUTH_TOKEN_URL) {
      return new Response(JSON.stringify({ access_token: "ya29.test-token" }), {
        status: 200,
      });
    }
    if (url === GMAIL_SEND_URL) {
      return new Response(JSON.stringify({ id: "msg_123" }), { status: 200 });
    }
    return new Response("unexpected url", { status: 500 });
  });
}

afterEach(() => {
  process.env = { ...originalEnv };
  clearGmailSecrets();
  delete process.env.NOTIFY_NEW_ENGAGEMENT_TO;
  delete process.env.APP_URL;
  delete process.env.DOCUSIGN_RETURN_URL;
  vi.restoreAllMocks();
});

describe("new engagement notify seam", () => {
  it("stubs when Gmail OAuth secrets are missing and does not call fetch", async () => {
    clearGmailSecrets();
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchMock = vi.fn();

    const result = await notifyNewEngagement(notice, { fetch: fetchMock });

    expect(result).toEqual({ mode: "stub", sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      "[notify] stub: new engagement email (Gmail OAuth secrets unset)",
      expect.objectContaining({
        to: [NEW_ENGAGEMENT_NOTIFY_TO, brand.email],
        subject: "New Canaan Preserve intake — CP-2026-TEST",
      }),
    );
  });

  it("stubs when only some Gmail secrets are set", async () => {
    process.env.GMAIL_CLIENT_ID = "partial-client";
    process.env.GMAIL_USER = DEFAULT_GMAIL_USER;
    vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchMock = vi.fn();

    const result = await notifyNewEngagement(notice, { fetch: fetchMock });

    expect(result).toEqual({ mode: "stub", sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends through Gmail API when OAuth secrets are set", async () => {
    setGmailSecrets();
    process.env.APP_URL = "https://canaanpreserve.com";
    const fetchMock = mockGmailSendSuccess();

    const result = await notifyNewEngagement(notice, { fetch: fetchMock });

    expect(result).toEqual({ mode: "gmail", sent: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(tokenUrl).toBe(GMAIL_OAUTH_TOKEN_URL);
    expect(tokenInit.method).toBe("POST");
    expect(tokenInit.headers).toMatchObject({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const tokenBody = new URLSearchParams(String(tokenInit.body));
    expect(tokenBody.get("grant_type")).toBe("refresh_token");
    expect(tokenBody.get("client_id")).toBe("test-client-id.apps.googleusercontent.com");
    expect(tokenBody.get("client_secret")).toBe("test-client-secret");
    expect(tokenBody.get("refresh_token")).toBe("test-refresh-token");

    const [sendUrl, sendInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(sendUrl).toBe(GMAIL_SEND_URL);
    expect(sendInit.method).toBe("POST");
    expect(sendInit.headers).toMatchObject({
      Authorization: "Bearer ya29.test-token",
      "Content-Type": "application/json",
    });
    const sendBody = JSON.parse(String(sendInit.body)) as { raw: string };
    const rfc2822 = decodeGmailRaw(sendBody.raw);
    expect(rfc2822).toContain(`From: ${brand.name} <${DEFAULT_GMAIL_USER}>`);
    expect(rfc2822).toContain(
      `To: ${NEW_ENGAGEMENT_NOTIFY_TO}, ${brand.email}`,
    );
    expect(rfc2822).toContain("CP-2026-TEST");
    expect(rfc2822).toContain("Suncoast Land Partners LLC");
    expect(rfc2822).toContain("Hillsborough");
    expect(rfc2822).toContain("Tortoise count: 10");
    expect(rfc2822).toContain(
      "https://canaanpreserve.com/admin/engagements/34cb532f-d3ca-4e6b-9657-d2beef2faef3",
    );
    expect(rfc2822).toContain("Open admin review");
  });

  it("does not fail create when notify send fails", async () => {
    setGmailSecrets();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const persist = vi.fn().mockResolvedValue(engagement());
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("provider unavailable", { status: 503 }),
    );

    const created = await persistAndNotifyNewEngagement(persist, { fetch: fetchMock });

    expect(persist).toHaveBeenCalledTimes(1);
    expect(created).toEqual(engagement());
    expect(error).toHaveBeenCalledWith(
      "[notify] new engagement email failed",
      expect.any(Error),
    );
  });

  it("still fails create when persist throws (notify is not the cause)", async () => {
    const persist = vi.fn().mockRejectedValue(new Error("store down"));
    const fetchMock = vi.fn();
    await expect(
      persistAndNotifyNewEngagement(persist, { fetch: fetchMock }),
    ).rejects.toThrow("store down");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not fail create when the provider throws", async () => {
    setGmailSecrets();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const persist = vi.fn().mockResolvedValue(engagement());
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      persistAndNotifyNewEngagement(persist, { fetch: fetchMock }),
    ).resolves.toEqual(engagement());
  });

  it("does not fail create when Gmail send fails after a token", async () => {
    setGmailSecrets();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const persist = vi.fn().mockResolvedValue(engagement());
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === GMAIL_OAUTH_TOKEN_URL) {
        return new Response(JSON.stringify({ access_token: "ya29.test-token" }), {
          status: 200,
        });
      }
      return new Response("quota exceeded", { status: 429 });
    });

    await expect(
      persistAndNotifyNewEngagement(persist, { fetch: fetchMock }),
    ).resolves.toEqual(engagement());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("emails Van and the brand inbox", () => {
    expect(newEngagementRecipients()).toEqual([
      NEW_ENGAGEMENT_NOTIFY_TO,
      "engagements@canaanpreserve.com",
    ]);
    expect(brand.email).toBe("engagements@canaanpreserve.com");
  });

  it("honors NOTIFY_NEW_ENGAGEMENT_TO and GMAIL_USER", () => {
    process.env.NOTIFY_NEW_ENGAGEMENT_TO = "ops@example.com";
    process.env.GMAIL_USER = "vpittman@beachparkcap.com";
    expect(newEngagementRecipients()).toEqual([
      "ops@example.com",
      brand.email,
    ]);
    expect(notifyFromAddress()).toBe(`${brand.name} <vpittman@beachparkcap.com>`);
  });

  it("defaults From to Van's Gmail when GMAIL_USER is unset", () => {
    expect(notifyFromAddress()).toBe(`${brand.name} <${DEFAULT_GMAIL_USER}>`);
  });

  it("builds the admin review URL from APP_URL, then DocuSign origin", () => {
    process.env.APP_URL = "https://preview.example/";
    expect(adminReviewUrl(notice.id)).toBe(
      `https://preview.example/admin/engagements/${notice.id}`,
    );

    delete process.env.APP_URL;
    process.env.DOCUSIGN_RETURN_URL = "https://canaanpreserve.com/api/docusign/return";
    expect(publicAppOrigin()).toBe("https://canaanpreserve.com");
  });

  it("maps an engagement record onto the notice payload", () => {
    expect(toNewEngagementNotice(engagement())).toEqual(notice);
    const email = buildNewEngagementEmail(notice);
    expect(email.to[0]).toBe(NEW_ENGAGEMENT_NOTIFY_TO);
    expect(email.from).toBe(`${brand.name} <${DEFAULT_GMAIL_USER}>`);
    expect(email.text).toMatch(/Reference: CP-2026-TEST/);
  });
});
