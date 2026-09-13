import { describe, expect, it } from "vitest";
import {
  canAccessEngagementDocument,
  createAdminSession,
  createDocumentToken,
  verifyDocumentToken,
} from "./auth";

const engagementId = "34cb532f-d3ca-4e6b-9657-d2beef2faef3";

describe("document download access", () => {
  it("rejects a UUID-only request with no session or token", () => {
    expect(
      canAccessEngagementDocument({
        engagementId,
        kind: "contract",
      }),
    ).toBe(false);
  });

  it("accepts a short-lived token issued for that engagement and document", () => {
    const token = createDocumentToken(engagementId, "contract");
    expect(verifyDocumentToken(token, engagementId, "contract")).toBe(true);
    expect(verifyDocumentToken(token, engagementId, "signed")).toBe(false);
    expect(verifyDocumentToken(token, "other-id", "contract")).toBe(false);
    expect(
      canAccessEngagementDocument({
        downloadToken: token,
        engagementId,
        kind: "contract",
      }),
    ).toBe(true);
  });

  it("accepts an admin session without a download token", () => {
    expect(
      canAccessEngagementDocument({
        adminToken: createAdminSession(),
        engagementId,
        kind: "signed",
      }),
    ).toBe(true);
  });
});
