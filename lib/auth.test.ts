import { describe, expect, it } from "vitest";
import {
  canAccessEngagementDocument,
  createAdminSession,
  createDocumentToken,
  verifyDocumentToken,
} from "./auth";

const engagementId = "34cb532f-d3ca-4e6b-9657-d2beef2faef3";

describe("document download access", () => {
  it("rejects a UUID-only request with no session or token", async () => {
    expect(
      await canAccessEngagementDocument({
        engagementId,
        kind: "contract",
      }),
    ).toBe(false);
  });

  it("accepts a short-lived token issued for that engagement and document", async () => {
    const token = await createDocumentToken(engagementId, "contract");
    expect(await verifyDocumentToken(token, engagementId, "contract")).toBe(true);
    expect(await verifyDocumentToken(token, engagementId, "signed")).toBe(false);
    expect(await verifyDocumentToken(token, engagementId, "letter")).toBe(false);
    expect(await verifyDocumentToken(token, "other-id", "contract")).toBe(false);
    expect(
      await canAccessEngagementDocument({
        downloadToken: token,
        engagementId,
        kind: "contract",
      }),
    ).toBe(true);
  });

  it("accepts an admin session without a download token", async () => {
    expect(
      await canAccessEngagementDocument({
        adminToken: await createAdminSession(),
        engagementId,
        kind: "signed",
      }),
    ).toBe(true);
  });
});
