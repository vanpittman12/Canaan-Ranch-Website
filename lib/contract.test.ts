import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import { buildContract, buildTemplateEngagement } from "./contract";
import {
  emptyReservationLetter,
  formatAuthorizedAgent,
  formatBuyerNotice,
} from "./types";
import type { Engagement, IntakeFields } from "./types";

const intake: IntakeFields = {
  buyerLegalName: "Suncoast Land Partners LLC",
  buyerAttention: "Morgan Hale",
  buyerTitle: "President",
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
  donorSiteDescription: "Residential development parcel east of the county line.",
  buyerWitnessName: "Riley Chen",
  buyerWitnessEmail: "riley@suncoast.example",
  sellerWitnessName: "Seller Witness",
  sellerWitnessEmail: "witness@canaanpreserve.com",
};

function engagement(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: "eng-gt",
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
    archivedAt: null,
    ...overrides,
  };
}

function contractBody(document = buildContract(engagement())) {
  return document.sections.map((section) => section.paragraphs.join(" ")).join(" ");
}

describe("gopher tortoise agreement mapping", () => {
  it("uses Canaan Preserve branding and Canaan Ranch LLP as seller", () => {
    const text = JSON.stringify(buildContract(engagement()));
    expect(text).toContain("Canaan Preserve");
    expect(text).toContain("Canaan Ranch LLP");
    expect(text).toContain("Andrew V. Pittman, Jr.");
    expect(text).toContain("Applied Bionomics, LLC");
    expect(text).toContain("Andrew Fuddy");
    expect(text).toContain("Pasco County, Florida");
    expect(text).toContain("1700 S. MacDill Ave.");
    expect(text).not.toContain("Post Oak Partners");
    expect(text).not.toContain("Bio-Tech");
  });

  it("leaves Effective Date and Expiration open until intake is submitted", () => {
    const contract = buildContract(engagement());
    const body = contractBody(contract);
    expect(contract.effectiveDate).toBe("—");
    expect(contract.expirationDate).toBe("—");
    expect(body).toContain("entered into as of the Effective Date");
    expect(body).toContain("expires on the Expiration Date");
    expect(body).not.toContain("the date Buyer signs this Agreement");
    expect(body).not.toContain("one (1) year after the Effective Date");
    expect(body).not.toContain("April 15, 2027");
  });

  it("fills expiration from the intake-submission Effective Date", () => {
    const contract = buildContract(engagement({ effectiveDate: "2026-04-15" }));
    const body = contractBody(contract);
    expect(contract.effectiveDate).toBe("April 15, 2026");
    expect(contract.expirationDate).toBe("April 15, 2027");
    expect(body).toContain("April 15, 2027");
  });

  it("maps notice, county, agents, donor, count, totals, and witnesses", () => {
    const contract = buildContract(engagement());
    const body = contractBody(contract);
    const notice = formatBuyerNotice(intake);
    const agent = formatAuthorizedAgent(intake);

    expect(contract.title).toBe("Multi-Project Gopher Tortoise Relocation Agreement");
    expect(body).toContain(notice);
    expect(body).toContain("Attention: Morgan Hale");
    expect(body).toContain("400 Harbour Island Boulevard, Tampa, FL 33602");
    expect(body).toContain("Phone 813-555-0190");
    expect(body).toContain("Email morgan@suncoast.example");
    expect(body).toContain(`Buyer’s authorized agent is ${agent}`);
    expect(body).toContain("up to 10");
    expect(body).toContain("$6,000");
    expect(body).toContain("per adult");
    expect(body).toContain("six thousand dollars");
    expect(body).toContain("$60,000");
    expect(body).toContain("County of relocation: Hillsborough");
    expect(body).toContain("Donor company affiliation: Lennar");
    expect(body).toContain("Donor site / project: Harbour tract");
    expect(body).toContain("Project description: Residential development parcel");
    expect(body).toContain("$3,000");
    expect(body).toContain("per juvenile");
    expect(body).toContain("three thousand dollars");
    expect(body).toContain("total price for that tortoise, in lieu of the Per GT Rate");
    expect(body).toContain("all-in and is not added to the adult Per GT Rate");
    expect(body).not.toMatch(/in addition to the Per GT Rate/);
    expect(body).toContain("No deposit or initial payment is required");
    expect(body).toContain(brand.fwcStatus);
    expect(body).not.toMatch(/non-negotiable/i);
    expect(body).not.toMatch(/[Ii]nitial [Pp]ayment is due/);
    expect(contract.buyerBlock.join(" ")).toContain("Riley Chen");
    expect(contract.sellerBlock.join(" ")).toContain("Seller Witness");
    expect(contract.signatureIntro).toContain("one (1) witness");
  });

  it("keeps template blanks and the fixed Canaan witness", () => {
    const contract = buildContract(buildTemplateEngagement());
    const body = contractBody(contract);
    expect(body).toContain("[Buyer legal name]");
    expect(body).toContain("[County of relocation]");
    expect(body).toContain("[Reserved capacity count]");
    expect(body).toContain("$6,000");
    expect(body).toContain("$3,000");
    expect(body).toContain("in lieu of the Per GT Rate");
    expect(body).not.toMatch(/in addition to the Per GT Rate/);
    expect(contract.sellerBlock.join(" ")).toContain(brand.sellerWitnessName);
    expect(body).not.toMatch(/non-negotiable/i);
  });

  it("pluralizes a reserved count of one gopher tortoise", () => {
    const body = contractBody(
      buildContract(engagement({ intake: { ...intake, tortoiseCount: 1 } })),
    );
    expect(body).toContain("up to 1 (one) gopher tortoise");
    expect(body).not.toContain("up to 1 (one) gopher tortoises");
  });
});
