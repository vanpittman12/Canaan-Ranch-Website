import { describe, expect, it } from "vitest";
import {
  applyReservationLetterGenerated,
  applyReservationLetterSent,
  buildReservationLetterFields,
  buildReservationLetterProse,
  formatTortoiseCountPhrase,
  generateReservationLetterPdf,
  reservationLetterContainsBannedLegacy,
  reservationLetterFilename,
} from "./reservation-letter";
import { emptyReservationLetter, type Engagement, type IntakeFields } from "./types";

const intake: IntakeFields = {
  buyerLegalName: "Suncoast Land Partners LLC",
  buyerAttention: "Morgan Hale",
  buyerEmail: "morgan@suncoast.example",
  buyerStreet: "400 Harbour Island Boulevard",
  buyerCity: "Tampa",
  buyerState: "FL",
  buyerPostalCode: "33602",
  buyerPhone: "813-555-0190",
  tortoiseCount: 17,
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

function engagement(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: "eng-letter",
    reference: "CP-2026-TEST",
    status: "accepted",
    effectiveDate: null,
    intake,
    signingMethod: "docusign",
    signedArtifact: null,
    docusign: {
      mode: "stub",
      envelopeId: "env-1",
      status: "sent",
      sentAt: "2026-04-02T00:00:00.000Z",
      completedAt: null,
      lastMessage: null,
      recipients: [],
    },
    reservationLetter: emptyReservationLetter(),
    reviews: [],
    changeRequestNote: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    submittedAt: "2026-04-01T12:00:00.000Z",
    acceptedAt: "2026-04-02T15:30:00.000Z",
    executedAt: null,
    ...overrides,
  };
}

describe("reservation letter fields", () => {
  it("maps intake field names and does not require acres or unit", () => {
    const fields = buildReservationLetterFields(engagement());
    expect(fields.buyerLegalName).toBe(intake.buyerLegalName);
    expect(fields.consultantCompany).toBe(intake.authorizedAgentCompany);
    expect(fields.donorProjectName).toBe(intake.donorSiteName);
    expect(fields.donorCounty).toBe(intake.relocationCounty);
    expect(fields.tortoiseCount).toBe(17);
    expect(fields.tortoiseCountWords).toBe("seventeen");
    expect(fields.tortoiseCountPhrase).toBe("seventeen (17) gopher tortoises");
    expect(fields.letterDate).toBe("2026-04-02");
    expect(JSON.stringify(fields)).not.toMatch(/acre/i);
    expect(JSON.stringify(fields)).not.toMatch(/unit\s*#/i);
  });

  it("uses Effective Date + 1 year after seller-sign and refreshes letter date", () => {
    const signed = engagement({
      status: "executed",
      effectiveDate: "2026-06-02",
      executedAt: "2026-06-02T09:00:00.000Z",
    });
    const fields = buildReservationLetterFields(signed);
    expect(fields.letterDate).toBe("2026-06-02");
    expect(fields.expirationDate).toBe("2027-06-02");
    expect(fields.reservationPeriod).toMatch(/twelve \(12\) months/);
    expect(fields.reservationPeriod).toContain("June 2, 2026");
    expect(fields.reservationPeriod).toContain("June 2, 2027");
  });

  it("keeps a draft period when Accept happens before Effective Date is known", () => {
    const fields = buildReservationLetterFields(engagement());
    expect(fields.effectiveDate).toBeNull();
    expect(fields.reservationPeriod).toMatch(/Effective Date \+ 1 year/);
    expect(fields.reservationPeriod).toMatch(/Seller signs/);
  });

  it("formats a singular tortoise count", () => {
    expect(formatTortoiseCountPhrase(1)).toBe("one (1) gopher tortoise");
  });
});

describe("reservation letter branding", () => {
  it("issues a Canaan Preserve / Canaan Ranch LLP FWC acceptance letter", () => {
    const prose = buildReservationLetterProse(buildReservationLetterFields(engagement()));
    const blob = [
      prose.title,
      prose.issuer,
      prose.site,
      prose.signatoryName,
      prose.signatoryTitle,
      ...prose.addressBlock,
      ...prose.reLines,
      prose.salutation,
      ...prose.paragraphs,
    ].join("\n");
    expect(prose.title).toBe("Gopher Tortoise Acceptance Letter");
    expect(prose.issuer).toBe("Canaan Ranch LLP");
    expect(prose.site).toBe("Canaan Preserve");
    expect(prose.signatoryName).toBe("Andrew V. Pittman, Jr.");
    expect(blob).toContain("Suncoast Land Partners LLC");
    expect(blob).toContain("Suncoast Permitting");
    expect(blob).toContain("Harbour tract");
    expect(blob).toContain("Hillsborough");
    expect(blob).toContain("seventeen (17) gopher tortoises");
    expect(reservationLetterContainsBannedLegacy(blob)).toBe(false);
    expect(blob).not.toContain("Post Oak");
    expect(blob).not.toContain("Applied Bionomics");
    expect(blob).not.toContain("Andrew Fuddy");
  });

  it("writes a PDF that starts with %PDF", async () => {
    const bytes = await generateReservationLetterPdf(
      buildReservationLetterFields(engagement({ effectiveDate: "2026-06-02" })),
    );
    expect(new TextDecoder().decode(bytes.subarray(0, 4))).toBe("%PDF");
    expect(reservationLetterFilename("CP-2026-TEST")).toBe(
      "CP-2026-TEST-gopher-tortoise-acceptance-letter.pdf",
    );
  });
});

describe("reservation letter send hold", () => {
  it("marks a generated letter awaiting send approval, not sent", () => {
    const next = applyReservationLetterGenerated(engagement(), {
      storedName: "eng-letter-reservation-letter.pdf",
      filename: "CP-2026-TEST-gopher-tortoise-acceptance-letter.pdf",
      letterDate: "2026-04-02",
      source: "accept",
      generatedAt: "2026-04-02T16:00:00.000Z",
    });
    expect(next.reservationLetter.status).toBe("awaiting_send");
    expect(next.reservationLetter.generatedAt).toBe("2026-04-02T16:00:00.000Z");
    expect(next.reservationLetter.sentAt).toBeNull();
    expect(next.reservationLetter.sendApprovedAt).toBeNull();
  });

  it("refreshes a draft on seller-sign without emailing", () => {
    const draft = applyReservationLetterGenerated(engagement(), {
      storedName: "eng-letter-reservation-letter.pdf",
      filename: "CP-2026-TEST-gopher-tortoise-acceptance-letter.pdf",
      letterDate: "2026-04-02",
      source: "accept",
      generatedAt: "2026-04-02T16:00:00.000Z",
    });
    const refreshed = applyReservationLetterGenerated(
      { ...draft, effectiveDate: "2026-06-02" },
      {
        storedName: "eng-letter-reservation-letter.pdf",
        filename: "CP-2026-TEST-gopher-tortoise-acceptance-letter.pdf",
        letterDate: "2026-06-02",
        source: "seller_sign",
        generatedAt: "2026-06-02T10:00:00.000Z",
      },
    );
    expect(refreshed.reservationLetter.status).toBe("awaiting_send");
    expect(refreshed.reservationLetter.letterDate).toBe("2026-06-02");
    expect(refreshed.reservationLetter.source).toBe("seller_sign");
    expect(refreshed.reservationLetter.refreshedAt).toBe("2026-06-02T10:00:00.000Z");
    expect(refreshed.reservationLetter.sentAt).toBeNull();
  });

  it("records send only after admin approval", () => {
    const waiting = applyReservationLetterGenerated(engagement(), {
      storedName: "eng-letter-reservation-letter.pdf",
      filename: "CP-2026-TEST-gopher-tortoise-acceptance-letter.pdf",
      letterDate: "2026-06-02",
      source: "seller_sign",
    });
    const sent = applyReservationLetterSent(waiting, {
      sentAt: "2026-06-03T12:00:00.000Z",
      notifyMode: "gmail",
    });
    expect(sent.reservationLetter.status).toBe("sent");
    expect(sent.reservationLetter.sentAt).toBe("2026-06-03T12:00:00.000Z");
    expect(sent.reservationLetter.notifyMode).toBe("gmail");
  });
});
