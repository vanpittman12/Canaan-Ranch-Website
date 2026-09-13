import { describe, expect, it } from "vitest";
import { buildContract } from "./contract";
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
  donorSiteDescription: "Residential development parcel east of the county line.",
  buyerWitnessName: "Riley Chen",
  buyerWitnessEmail: "riley@suncoast.example",
  sellerWitnessName: "Pat Morales",
  sellerWitnessEmail: "pat@canaanpreserve.example",
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
    reviews: [],
    changeRequestNote: null,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    submittedAt: null,
    acceptedAt: null,
    executedAt: null,
    ...overrides,
  };
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

  it("leaves Effective Date and Expiration open until the Buyer signs", () => {
    const contract = buildContract(engagement());
    const body = contract.sections.map((section) => section.paragraphs.join(" ")).join(" ");
    expect(contract.effectiveDate).toBe("the date Buyer signs this Agreement");
    expect(contract.expirationDate).toBe("one (1) year after the Effective Date");
    expect(body).toContain("the date Buyer signs this Agreement");
    expect(body).not.toContain("April 15, 2027");
  });

  it("fills expiration from the signature Effective Date once signed", () => {
    const contract = buildContract(engagement({ effectiveDate: "2026-04-15" }));
    const body = contract.sections.map((section) => section.paragraphs.join(" ")).join(" ");
    expect(contract.effectiveDate).toBe("April 15, 2026");
    expect(contract.expirationDate).toBe("April 15, 2027");
    expect(body).toContain("April 15, 2027");
  });

  it("fills buyer, capacity, ops fields, rate, total, and one witness per party", () => {
    const contract = buildContract(engagement());
    const body = contract.sections.map((section) => section.paragraphs.join(" ")).join(" ");
    expect(contract.title).toBe("Multi-Project Gopher Tortoise Relocation Agreement");
    expect(body).toContain("Suncoast Land Partners LLC");
    expect(body).toContain("up to 10");
    expect(body).toContain("$6,000");
    expect(body).toContain("six thousand dollars");
    expect(body).toContain("$60,000");
    expect(body).toContain("Harbour tract");
    expect(body).toContain("Lennar");
    expect(body).toContain("Hillsborough");
    expect(body).toContain("Casey Nguyen");
    expect(body).toContain("Suncoast Permitting");
    expect(body).toContain("$3,000");
    expect(body).toContain("Payment is due as invoiced upon acceptance");
    expect(body).not.toMatch(/[Ii]nitial [Pp]ayment/);
    expect(body).not.toMatch(/deposit/);
    expect(contract.buyerBlock.join(" ")).toContain("Riley Chen");
    expect(contract.sellerBlock.join(" ")).toContain("Pat Morales");
    expect(contract.signatureIntro).toContain("one (1) witness");
  });
});
