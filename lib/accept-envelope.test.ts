import { describe, expect, it, vi } from "vitest";
import {
  applyReviewAndSendEnvelope,
  canRetryDocuSignSend,
  sendPopulatedEnvelope,
  shouldSendEnvelopeAfterAccept,
} from "./accept-envelope";
import { applyReview, applySubmit } from "./engagement";
import type { Engagement, IntakeFields } from "./types";

const intake: IntakeFields = {
  buyerLegalName: "Suncoast Land Partners LLC",
  buyerAttention: "Morgan Hale",
  buyerEmail: "morgan@suncoast.example",
  buyerStreet: "400 Harbour Island Boulevard",
  buyerCity: "Tampa",
  buyerState: "FL",
  buyerPostalCode: "33602",
  buyerPhone: "813-555-0190",
  tortoiseCount: 10,
  perGtRate: 6000,
  relocationCounty: "Hillsborough",
  authorizedAgentName: "Casey Nguyen",
  authorizedAgentCompany: "Suncoast Permitting",
  donorCompanyAffiliation: "Lennar",
  donorSiteName: "Harbour tract",
  donorSiteDescription: "",
  buyerWitnessName: "Riley Chen",
  buyerWitnessEmail: "riley@suncoast.example",
  sellerWitnessName: "Andrew Fuddy",
  sellerWitnessEmail: "witness@canaanpreserve.com",
};

function draft(): Engagement {
  return {
    id: "23869552-7acd-4940-a0e4-0954214237cf",
    reference: "CP-2026-DCA6",
    status: "draft",
    effectiveDate: null,
    intake,
    signingMethod: null,
    signedArtifact: null,
    docusign: {
      mode: "stub",
      envelopeId: null,
      status: "not_sent",
      sentAt: null,
      completedAt: null,
      lastMessage: null,
      recipients: [],
    },
    reviews: [],
    changeRequestNote: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    submittedAt: null,
    acceptedAt: null,
    executedAt: null,
  };
}

function pendingDocuSign() {
  return applySubmit(draft(), "docusign");
}

describe("Accept then DocuSign", () => {
  it("persists Accept before populate so a Worker OOM cannot leave status pending", async () => {
    const saved: Engagement[] = [];
    const result = await applyReviewAndSendEnvelope(
      pendingDocuSign(),
      "accept",
      "",
      async (next) => {
        saved.push(next);
      },
      {
        populate: async () => {
          throw new Error("Worker exceeded resource limits");
        },
      },
    );

    expect(saved[0]?.status).toBe("accepted");
    expect(saved[0]?.docusign.status).toBe("not_sent");
    expect(saved[1]?.status).toBe("accepted");
    expect(saved[1]?.docusign.status).toBe("not_sent");
    expect(saved[1]?.docusign.lastMessage).toMatch(/Accepted\. DocuSign was not sent/);
    expect(saved[1]?.docusign.lastMessage).toMatch(/Worker exceeded resource limits/);
    expect(result.engagement.status).toBe("accepted");
    expect(result.error).toMatch(/Accepted\. DocuSign was not sent/);
    expect(canRetryDocuSignSend(result.engagement)).toBe(true);
  });

  it("sends the populated DOCX after Accept and records the envelope", async () => {
    const saved: Engagement[] = [];
    const populate = vi.fn(async () => ({
      bytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      filename: "CP-2026-DCA6-canaan-preserve-agreement.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileExtension: "docx" as const,
    }));
    const send = vi.fn(async () => ({
      mode: "stub" as const,
      envelopeId: "stub-23869552-aaaaaaaa",
      status: "sent" as const,
      message: "DocuSign stub: envelope queued locally.",
      recipients: [],
    }));

    const result = await applyReviewAndSendEnvelope(
      pendingDocuSign(),
      "accept",
      "",
      async (next) => {
        saved.push(next);
      },
      { populate, send },
    );

    expect(saved[0]?.status).toBe("accepted");
    expect(saved[0]?.docusign.envelopeId).toBeNull();
    expect(populate).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledOnce();
    expect(JSON.stringify(send.mock.calls)).toContain('"fileExtension":"docx"');
    expect(result.engagement.docusign.status).toBe("sent");
    expect(result.engagement.docusign.envelopeId).toBe("stub-23869552-aaaaaaaa");
    expect(result.error).toBeUndefined();
    expect(canRetryDocuSignSend(result.engagement)).toBe(false);
  });

  it("does not send DocuSign for decline or request-changes", async () => {
    const populate = vi.fn();
    const declined = await applyReviewAndSendEnvelope(
      pendingDocuSign(),
      "decline",
      "",
      async () => undefined,
      { populate },
    );
    expect(declined.engagement.status).toBe("declined");
    expect(populate).not.toHaveBeenCalled();

    const changes = await applyReviewAndSendEnvelope(
      pendingDocuSign(),
      "request_changes",
      "Fix the county.",
      async () => undefined,
      { populate },
    );
    expect(changes.engagement.status).toBe("changes_requested");
    expect(populate).not.toHaveBeenCalled();
  });

  it("retries send only after Accept with no envelope", async () => {
    const accepted = applyReview(pendingDocuSign(), "accept", "");
    expect(shouldSendEnvelopeAfterAccept(accepted)).toBe(true);
    expect(canRetryDocuSignSend(accepted)).toBe(true);

    const sent = await sendPopulatedEnvelope(accepted, {
      populate: async () => ({
        bytes: new Uint8Array([0x50, 0x4b]),
        filename: "ok.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileExtension: "docx",
      }),
      send: async () => ({
        mode: "stub",
        envelopeId: "stub-retry",
        status: "sent",
        message: "queued",
        recipients: [],
      }),
    });
    expect(sent.docusign.envelopeId).toBe("stub-retry");
    expect(canRetryDocuSignSend(sent)).toBe(false);
  });
});
