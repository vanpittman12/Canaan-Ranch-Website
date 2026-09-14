import { describe, expect, it } from "vitest";
import {
  applyDocuSignCompleted,
  applyReview,
  applySignedArtifact,
  applySubmit,
  artifactFromUpload,
  canSubmitForReview,
  nextStatusAfterAccept,
} from "./engagement";
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
  sellerWitnessName: "Pat Morales",
  sellerWitnessEmail: "pat@canaanpreserve.example",
};

function draft(): Engagement {
  return {
    id: "eng-1",
    reference: "CP-2026-TEST",
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

function artifact() {
  return artifactFromUpload({
    filename: "signed.pdf",
    storedName: "eng-1-signed.pdf",
    source: "manual_upload",
    mimeType: "application/pdf",
    sizeBytes: 1200,
  });
}

describe("engagement status machine", () => {
  it("keeps drafts editable and submittable", () => {
    expect(canSubmitForReview("draft")).toBe(true);
    expect(canSubmitForReview("pending_review")).toBe(false);
  });

  it("moves draft to pending_review on submit", () => {
    const next = applySubmit(draft(), "manual");
    expect(next.status).toBe("pending_review");
    expect(next.signingMethod).toBe("manual");
    expect(next.submittedAt).toBeTruthy();
  });

  it("does not execute on accept without a signed artifact", () => {
    const pending = applySubmit(draft(), "docusign");
    const accepted = applyReview(pending, "accept", "");
    expect(accepted.status).toBe("accepted");
    expect(accepted.executedAt).toBeNull();
    expect(accepted.effectiveDate).toBeNull();
    expect(nextStatusAfterAccept(false)).toBe("accepted");
  });

  it("executes on accept when a signed artifact is already present", () => {
    const pending = applySubmit(draft(), "manual");
    const withSignature = applySignedArtifact(pending, artifact());
    expect(withSignature.status).toBe("pending_review");
    expect(withSignature.effectiveDate).toBe(withSignature.signedArtifact?.uploadedAt.slice(0, 10));
    const executed = applyReview(withSignature, "accept", "Looks complete.");
    expect(executed.status).toBe("executed");
    expect(executed.executedAt).toBeTruthy();
    expect(executed.effectiveDate).toBe(withSignature.effectiveDate);
  });

  it("does not close a signed file until the team accepts", () => {
    const pending = applySubmit(draft(), "manual");
    const withSignature = applySignedArtifact(pending, artifact());
    expect(withSignature.status).toBe("pending_review");
  });

  it("executes a previously accepted engagement when the artifact arrives", () => {
    const pending = applySubmit(draft(), "manual");
    const accepted = applyReview(pending, "accept", "");
    const executed = applySignedArtifact(accepted, artifact());
    expect(executed.status).toBe("executed");
    expect(executed.effectiveDate).toBe(executed.signedArtifact?.uploadedAt.slice(0, 10));
  });

  it("does not overwrite an Effective Date already captured at signing", () => {
    const pending = applySubmit(draft(), "manual");
    const signed = applySignedArtifact(pending, {
      ...artifact(),
      uploadedAt: "2026-04-15T18:22:00.000Z",
    });
    expect(signed.effectiveDate).toBe("2026-04-15");
    const later = applySignedArtifact(signed, {
      ...artifact(),
      uploadedAt: "2026-05-01T12:00:00.000Z",
    });
    expect(later.effectiveDate).toBe("2026-04-15");
  });

  it("returns to customer edit after request changes", () => {
    const pending = applySubmit(draft(), "docusign");
    const next = applyReview(pending, "request_changes", "Please refine the scope.");
    expect(next.status).toBe("changes_requested");
    expect(next.changeRequestNote).toBe("Please refine the scope.");
    expect(canSubmitForReview(next.status)).toBe(true);
  });

  it("declines without executing even if a file is attached later", () => {
    const pending = applySubmit(draft(), "manual");
    const declined = applyReview(pending, "decline", "Not a fit this season.");
    expect(declined.status).toBe("declined");
    expect(() => applySignedArtifact(declined, artifact())).toThrow();
  });

  it("marks DocuSign complete only after accept and stamps the Effective Date", () => {
    const pending = applySubmit(draft(), "docusign");
    expect(() => applyDocuSignCompleted(pending, artifact())).toThrow();
    const accepted = applyReview(pending, "accept", "");
    const completedArtifact = {
      ...artifact(),
      uploadedAt: "2026-06-02T09:00:00.000Z",
    };
    const executed = applyDocuSignCompleted(accepted, completedArtifact);
    expect(executed.status).toBe("executed");
    expect(executed.docusign.status).toBe("completed");
    expect(executed.effectiveDate).toBe("2026-06-02");
    expect(executed.docusign.lastMessage).toMatch(/stub/i);
  });

  it("records a live DocuSign completion message when the envelope mode is live", () => {
    const pending = applySubmit(draft(), "docusign");
    const accepted = {
      ...applyReview(pending, "accept", ""),
      docusign: {
        ...pending.docusign,
        mode: "live" as const,
        envelopeId: "env-live-1",
        status: "sent" as const,
      },
    };
    const executed = applyDocuSignCompleted(accepted, {
      ...artifact(),
      source: "docusign",
      uploadedAt: "2026-06-02T09:00:00.000Z",
    });
    expect(executed.docusign.lastMessage).toMatch(/DocuSign: envelope completed/i);
    expect(executed.effectiveDate).toBe("2026-06-02");
  });

  it("prefers the Buyer Date Signed over the artifact upload time for Effective Date", () => {
    const pending = applySubmit(draft(), "docusign");
    const accepted = applyReview(pending, "accept", "");
    const executed = applyDocuSignCompleted(
      accepted,
      {
        ...artifact(),
        uploadedAt: "2026-06-03T16:00:00.000Z",
      },
      undefined,
      "2026-06-02T09:15:00.000Z",
    );
    expect(executed.effectiveDate).toBe("2026-06-02");
  });
});
