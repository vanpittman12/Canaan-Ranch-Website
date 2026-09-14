import { afterEach, describe, expect, it, vi } from "vitest";
import { brand } from "./brand";
import {
  adminReviewUrl,
  buildNewEngagementEmail,
  NEW_ENGAGEMENT_NOTIFY_TO,
  newEngagementRecipients,
  notifyFromAddress,
  notifyNewEngagement,
  persistAndNotifyNewEngagement,
  publicAppOrigin,
  RESEND_EMAILS_URL,
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

afterEach(() => {
  process.env = { ...originalEnv };
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  delete process.env.NOTIFY_NEW_ENGAGEMENT_TO;
  delete process.env.APP_URL;
  delete process.env.DOCUSIGN_RETURN_URL;
  vi.restoreAllMocks();
});

describe("new engagement notify seam", () => {
  it("stubs when RESEND_API_KEY is missing and does not call fetch", async () => {
    delete process.env.RESEND_API_KEY;
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const fetchMock = vi.fn();

    const result = await notifyNewEngagement(notice, { fetch: fetchMock });

    expect(result).toEqual({ mode: "stub", sent: false });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      "[notify] stub: new engagement email (RESEND_API_KEY unset)",
      expect.objectContaining({
        to: [NEW_ENGAGEMENT_NOTIFY_TO, brand.email],
        subject: "New Canaan Preserve intake — CP-2026-TEST",
      }),
    );
  });

  it("sends through Resend when the API key is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.APP_URL = "https://canaanpreserve.com";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email_123" }), { status: 200 }),
    );

    const result = await notifyNewEngagement(notice, { fetch: fetchMock });

    expect(result).toEqual({ mode: "resend", sent: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(RESEND_EMAILS_URL);
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer re_test_key",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(init.body)) as {
      from: string;
      to: string[];
      subject: string;
      text: string;
      html: string;
    };
    expect(body.from).toBe(`${brand.name} <${brand.email}>`);
    expect(body.to).toEqual([NEW_ENGAGEMENT_NOTIFY_TO, brand.email]);
    expect(body.subject).toContain("CP-2026-TEST");
    expect(body.text).toContain("Suncoast Land Partners LLC");
    expect(body.text).toContain("Hillsborough");
    expect(body.text).toContain("Tortoise count: 10");
    expect(body.text).toContain(
      "https://canaanpreserve.com/admin/engagements/34cb532f-d3ca-4e6b-9657-d2beef2faef3",
    );
    expect(body.html).toContain("Open admin review");
  });

  it("does not fail create when notify send fails", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
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
    process.env.RESEND_API_KEY = "re_test_key";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const persist = vi.fn().mockResolvedValue(engagement());
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      persistAndNotifyNewEngagement(persist, { fetch: fetchMock }),
    ).resolves.toEqual(engagement());
  });

  it("emails Van and the brand inbox", () => {
    expect(newEngagementRecipients()).toEqual([
      NEW_ENGAGEMENT_NOTIFY_TO,
      "engagements@canaanpreserve.com",
    ]);
    expect(brand.email).toBe("engagements@canaanpreserve.com");
  });

  it("honors NOTIFY_NEW_ENGAGEMENT_TO and RESEND_FROM_EMAIL", () => {
    process.env.NOTIFY_NEW_ENGAGEMENT_TO = "ops@example.com";
    process.env.RESEND_FROM_EMAIL = "Canaan Preserve <alerts@example.com>";
    expect(newEngagementRecipients()).toEqual([
      "ops@example.com",
      brand.email,
    ]);
    expect(notifyFromAddress()).toBe("Canaan Preserve <alerts@example.com>");
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
    expect(email.text).toMatch(/Reference: CP-2026-TEST/);
  });
});
