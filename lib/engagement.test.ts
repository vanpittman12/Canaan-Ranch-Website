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
  companyName: "Ridge & Hollow Co.",
  website: "https://ridge.example",
  contactName: "Avery Cole",
  contactTitle: "Principal",
  contactEmail: "avery@ridge.example",
  contactPhone: "304-555-0100",
  billingStreet: "12 Mill Road",
  billingCity: "Davis",
  billingState: "WV",
  billingPostalCode: "26260",
  projectTitle: "Summer grazing plan",
  serviceType: "land_stewardship",
  scopeSummary: "Seasonal grazing rotation and pasture recovery advisory.",
  startDate: "2026-05-01",
  duration: "3–6 months",
  budgetRange: "$10,000 – $25,000",
  serviceLocation: "Canaan Valley",
  notes: "",
};

function draft(): Engagement {
  return {
    id: "eng-1",
    reference: "CR-2026-TEST",
    status: "draft",
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
    expect(nextStatusAfterAccept(false)).toBe("accepted");
  });

  it("executes on accept when a signed artifact is already present", () => {
    const pending = applySubmit(draft(), "manual");
    const withSignature = applySignedArtifact(pending, artifact());
    expect(withSignature.status).toBe("pending_review");
    const executed = applyReview(withSignature, "accept", "Looks complete.");
    expect(executed.status).toBe("executed");
    expect(executed.executedAt).toBeTruthy();
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

  it("marks DocuSign complete only after accept", () => {
    const pending = applySubmit(draft(), "docusign");
    expect(() => applyDocuSignCompleted(pending, artifact())).toThrow();
    const accepted = applyReview(pending, "accept", "");
    const executed = applyDocuSignCompleted(accepted, artifact());
    expect(executed.status).toBe("executed");
    expect(executed.docusign.status).toBe("completed");
  });
});
