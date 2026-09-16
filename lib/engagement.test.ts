import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyDocuSignCompleted,
  applyDocuSignSent,
  applyReview,
  applySignedArtifact,
  applySubmit,
  artifactFromUpload,
  canReview,
  canSubmitForReview,
  isAwaitingSellerSignature,
  isOpenEngagement,
  nextStatusAfterAccept,
} from "./engagement";
import {
  emptyReservationLetter,
  STATUS_LABELS,
  STATUS_PILL_LABELS,
  type Engagement,
  type IntakeFields,
  type SigningMethod,
} from "./types";

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
    reservationLetter: emptyReservationLetter(),
    reviews: [],
    changeRequestNote: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    submittedAt: null,
    acceptedAt: null,
    executedAt: null,
  };
}

function pendingReview(method: SigningMethod = "manual"): Engagement {
  return {
    ...applySubmit(draft(), "manual"),
    signingMethod: method,
    status: "pending_review",
    acceptedAt: null,
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps drafts editable and submittable", () => {
    expect(canSubmitForReview("draft")).toBe(true);
    expect(canSubmitForReview("pending_review")).toBe(false);
  });

  it("moves draft to pending_review on manual submit", () => {
    const next = applySubmit(draft(), "manual");
    expect(next.status).toBe("pending_review");
    expect(next.signingMethod).toBe("manual");
    expect(next.submittedAt).toBeTruthy();
    expect(next.effectiveDate).toBe("2026-04-01");
    expect(next.acceptedAt).toBeNull();
    expect(canReview(next.status)).toBe(true);
  });

  it("moves DocuSign submit to accepted-for-signing without admin Accept", () => {
    const next = applySubmit(draft(), "docusign");
    expect(next.status).toBe("accepted");
    expect(next.signingMethod).toBe("docusign");
    expect(next.submittedAt).toBeTruthy();
    expect(next.effectiveDate).toBe("2026-04-01");
    expect(next.acceptedAt).toBeTruthy();
    expect(next.executedAt).toBeNull();
    expect(canReview(next.status)).toBe(false);
    expect(canSubmitForReview(next.status)).toBe(false);
    expect(isAwaitingSellerSignature(next.status)).toBe(true);
    expect(STATUS_LABELS.accepted).toBe("Awaiting seller signature");
  });

  it("does not execute on accept without a signed artifact", () => {
    const accepted = applyReview(pendingReview("docusign"), "accept", "");
    expect(accepted.status).toBe("accepted");
    expect(accepted.executedAt).toBeNull();
    expect(accepted.effectiveDate).toBe("2026-04-01");
    expect(nextStatusAfterAccept(false)).toBe("accepted");
    expect(STATUS_LABELS.accepted).toBe("Awaiting seller signature");
    expect(STATUS_PILL_LABELS.accepted).toBe("Awaiting seller");
    expect(isAwaitingSellerSignature(accepted.status)).toBe(true);
    expect(isOpenEngagement(accepted.status)).toBe(true);
    expect(isOpenEngagement("executed")).toBe(false);
  });

  it("does not execute a DocuSign engagement on Accept even if a file is already on file", () => {
    const withFile = applySignedArtifact(pendingReview("docusign"), artifact());
    const accepted = applyReview(withFile, "accept", "");
    expect(accepted.status).toBe("accepted");
    expect(accepted.executedAt).toBeNull();
    expect(nextStatusAfterAccept(true, "docusign")).toBe("accepted");
  });

  it("executes on accept when a signed artifact is already present", () => {
    const pending = applySubmit(draft(), "manual");
    const withSignature = applySignedArtifact(pending, artifact());
    expect(withSignature.status).toBe("pending_review");
    expect(withSignature.effectiveDate).toBe("2026-04-01");
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
    expect(executed.effectiveDate).toBe("2026-04-01");
  });

  it("does not overwrite an Effective Date already captured at intake submit", () => {
    const pending = applySubmit(draft(), "manual");
    expect(pending.effectiveDate).toBe("2026-04-01");
    const signed = applySignedArtifact(pending, {
      ...artifact(),
      uploadedAt: "2026-04-15T18:22:00.000Z",
    });
    expect(signed.effectiveDate).toBe("2026-04-01");
    const later = applySignedArtifact(signed, {
      ...artifact(),
      uploadedAt: "2026-05-01T12:00:00.000Z",
    });
    expect(later.effectiveDate).toBe("2026-04-01");
  });

  it("returns to customer edit after request changes", () => {
    const next = applyReview(
      pendingReview("docusign"),
      "request_changes",
      "Please refine the scope.",
    );
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

  it("marks DocuSign complete after intake submit without admin Accept", () => {
    const draftEng = draft();
    expect(() => applyDocuSignCompleted(draftEng, artifact())).toThrow(/accepted for signing/);
    const submitted = applySubmit(draftEng, "docusign");
    const completedArtifact = {
      ...artifact(),
      uploadedAt: "2026-06-02T09:00:00.000Z",
    };
    const executed = applyDocuSignCompleted(submitted, completedArtifact);
    expect(executed.status).toBe("executed");
    expect(executed.docusign.status).toBe("completed");
    expect(executed.effectiveDate).toBe("2026-04-01");
    expect(executed.docusign.lastMessage).toMatch(/stub/i);
  });

  it("promotes a leftover pending-review DocuSign send to accepted-for-signing", () => {
    const sent = applyDocuSignSent(
      pendingReview("docusign"),
      "env-1",
      "DocuSign stub: envelope queued",
      "stub",
    );
    expect(sent.status).toBe("accepted");
    expect(sent.acceptedAt).toBeTruthy();
    expect(sent.docusign.envelopeId).toBe("env-1");
    expect(sent.docusign.status).toBe("sent");
  });

  it("records a live DocuSign completion message when the envelope mode is live", () => {
    const submitted = {
      ...applySubmit(draft(), "docusign"),
      docusign: {
        ...draft().docusign,
        mode: "live" as const,
        envelopeId: "env-live-1",
        status: "sent" as const,
      },
    };
    const executed = applyDocuSignCompleted(submitted, {
      ...artifact(),
      source: "docusign",
      uploadedAt: "2026-06-02T09:00:00.000Z",
    });
    expect(executed.docusign.lastMessage).toMatch(/DocuSign: envelope completed/i);
    expect(executed.effectiveDate).toBe("2026-04-01");
  });

  it("does not stamp Effective Date from Buyer Date Signed or artifact upload time", () => {
    vi.setSystemTime(new Date("2026-09-17T03:30:00.000Z"));
    const submitted = applySubmit(draft(), "docusign");
    expect(submitted.effectiveDate).toBe("2026-09-16");
    const executed = applyDocuSignCompleted(submitted, {
      ...artifact(),
      uploadedAt: "2026-06-03T16:00:00.000Z",
    });
    expect(executed.effectiveDate).toBe("2026-09-16");
  });

  it("recovers Effective Date from submittedAt when the stored field is missing", () => {
    const submitted = {
      ...applySubmit(draft(), "docusign"),
      effectiveDate: null,
      submittedAt: "2026-09-17T03:30:00.000Z",
    };
    const executed = applyDocuSignCompleted(submitted, {
      ...artifact(),
      uploadedAt: "2026-09-18T09:00:00.000Z",
    });
    expect(executed.effectiveDate).toBe("2026-09-16");
  });
});
