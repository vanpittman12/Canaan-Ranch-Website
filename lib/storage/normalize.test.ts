import { describe, expect, it } from "vitest";
import { brand } from "../brand";
import { normalizeEngagement, normalizeIntake } from "./normalize";

describe("engagement normalize", () => {
  it("fills the seller witness from brand/env when the stored record omits it", () => {
    const intake = normalizeIntake({
      buyerLegalName: "Cypress Ridge Holdings LLC",
      buyerWitnessName: "Lee Park",
      buyerWitnessEmail: "lee@cypressridge.example",
    });
    expect(intake.sellerWitnessName).toBe(brand.sellerWitnessName);
    expect(intake.sellerWitnessEmail).toBe(brand.sellerWitnessEmail);
    expect(intake.buyerLegalName).toBe("Cypress Ridge Holdings LLC");
  });

  it("maps a legacy intake.effectiveDate onto the engagement", () => {
    const engagement = normalizeEngagement({
      id: "eng-1",
      reference: "CP-2026-TEST",
      status: "draft",
      intake: { buyerLegalName: "Suncoast", effectiveDate: "2026-04-15" },
      signingMethod: null,
      signedArtifact: null,
      reviews: [],
      changeRequestNote: null,
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
      submittedAt: null,
      acceptedAt: null,
      executedAt: null,
    });
    expect(engagement.effectiveDate).toBe("2026-04-15");
    expect(engagement.docusign.status).toBe("not_sent");
    expect(engagement.docusign.recipients).toEqual([]);
  });

  it("maps a legacy live_placeholder DocuSign mode to live", () => {
    const engagement = normalizeEngagement({
      id: "eng-1",
      reference: "CP-2026-TEST",
      status: "accepted",
      intake: { buyerLegalName: "Suncoast" },
      signingMethod: "docusign",
      signedArtifact: null,
      docusign: {
        mode: "live_placeholder",
        envelopeId: "env-1",
        status: "sent",
      },
      reviews: [],
      changeRequestNote: null,
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
      submittedAt: null,
      acceptedAt: null,
      executedAt: null,
    });
    expect(engagement.docusign.mode).toBe("live");
    expect(engagement.docusign.envelopeId).toBe("env-1");
  });
});
