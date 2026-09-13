import { describe, expect, it } from "vitest";
import { buildContract } from "./contract";
import type { Engagement, IntakeFields } from "./types";

const intake: IntakeFields = {
  effectiveDate: "2026-04-15",
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
  donorSiteName: "Harbour tract",
  donorSiteDescription: "Residential development parcel east of the county line.",
};

function engagement(): Engagement {
  return {
    id: "eng-gt",
    reference: "CP-2026-TEST",
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

  it("fills buyer, capacity, rate, total, and expiration from intake", () => {
    const contract = buildContract(engagement());
    const body = contract.sections.map((section) => section.paragraphs.join(" ")).join(" ");
    expect(contract.title).toBe("Multi-Project Gopher Tortoise Relocation Agreement");
    expect(body).toContain("Suncoast Land Partners LLC");
    expect(body).toContain("up to 10");
    expect(body).toContain("$6,000");
    expect(body).toContain("six thousand dollars");
    expect(body).toContain("$60,000");
    expect(body).toContain("April 15, 2027");
    expect(body).toContain("Harbour tract");
    expect(body).toContain("$3,000");
  });
});
