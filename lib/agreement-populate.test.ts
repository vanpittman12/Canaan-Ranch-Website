import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AGREEMENT_FIELD_MAP,
  AGREEMENT_UNMAPPED_GAPS,
  extractDocxPlainText,
  generatePopulatedAgreement,
  populateAgreementDocx,
} from "./agreement-populate";
import {
  BLANK_AGREEMENT_DOCX_SHA256,
  BLANK_AGREEMENT_DOCX_SIZE,
  BLANK_AGREEMENT_PUBLIC_FILE,
  POPULATED_AGREEMENT_MIME,
} from "./agreement-template";
import { brand } from "./brand";
import { DOCUSIGN_ANCHORS } from "./docusign";
import type { Engagement, IntakeFields } from "./types";

const TEMPLATE_DOCX = resolve(process.cwd(), BLANK_AGREEMENT_PUBLIC_FILE);
const CONTRACT_ROUTE = resolve(process.cwd(), "app/api/engagements/[id]/contract/route.ts");
const ADMIN_ACTIONS = resolve(process.cwd(), "app/actions/admin.ts");

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
  sellerWitnessName: "Andrew Fuddy",
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

describe("Van’s Word agreement populate", () => {
  it("keeps the public blank file as Van’s exact bytes", () => {
    const bytes = readFileSync(TEMPLATE_DOCX);
    expect(bytes.byteLength).toBe(BLANK_AGREEMENT_DOCX_SIZE);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(BLANK_AGREEMENT_DOCX_SHA256);
  });

  it("fills intake blanks on a copy of Van’s DOCX and does not rewrite the legal body", () => {
    const blank = readFileSync(TEMPLATE_DOCX);
    const populated = populateAgreementDocx(new Uint8Array(blank), engagement());
    const text = extractDocxPlainText(populated);

    expect(Buffer.from(populated.subarray(0, 2)).toString()).toBe("PK");
    expect(createHash("sha256").update(blank).digest("hex")).toBe(BLANK_AGREEMENT_DOCX_SHA256);

    expect(text).toContain("Suncoast Land Partners LLC");
    expect(text).toContain("Morgan Hale");
    expect(text).toContain("400 Harbour Island Boulevard");
    expect(text).toContain("Tampa, FL 33602");
    expect(text).toContain("813-555-0190");
    expect(text).toContain("ten (10)");
    expect(text).toContain("sixty thousand dollars ($60,000.00)");
    expect(text).toContain(`${brand.agentName} Attention: ${brand.agentContact}`);
    expect(text).toContain("Printed Name: Andrew Fuddy");
    expect(text).toContain("Printed Name: Riley Chen");
    expect(text).toContain("By: Morgan Hale");

    expect(text).not.toContain("Responsible party entity name");
    expect(text).not.toContain("seventeen (17)");
    expect(text).not.toContain("$102,000.00");
    expect(text).not.toContain("Contact name");
    expect(text).not.toContain("Street address");
    expect(text).not.toContain("City, State ZIP");
    expect(text).not.toContain("Phone number");

    expect(text).toContain("Canaan Ranch LLLP");
    expect(text).toContain("Initial Payment");
    expect(text).toContain("$6,000.00");
    expect(text).toContain("GOPHER TORTOISE RELOCATION AGREEMENT");
    expect(text).not.toContain("This Multi-Project Gopher Tortoise Relocation Agreement");
    expect(text).not.toContain("Canaan Ranch LLP, a Florida limited liability partnership");
    expect(text).not.toContain("Hillsborough");
    expect(text).not.toContain("morgan@suncoast.example");
    expect(text).not.toContain("Casey Nguyen");
    expect(text).not.toContain("riley@suncoast.example");
  });

  it("escapes buyer XML and injects DocuSign anchors into the populated copy only", () => {
    const blank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const populated = populateAgreementDocx(
      blank,
      engagement({
        intake: { ...intake, buyerLegalName: "Hale & Grove <Partners>" },
      }),
    );
    const files = extractDocxPlainText(populated);
    expect(files).toContain("Hale & Grove <Partners>");
    expect(files).toContain(DOCUSIGN_ANCHORS.buyer_signer.sign);
    expect(files).toContain(DOCUSIGN_ANCHORS.seller_signer.sign);
    expect(files).toContain(DOCUSIGN_ANCHORS.buyer_witness.sign);
    expect(files).toContain(DOCUSIGN_ANCHORS.seller_witness.sign);

    const blankText = extractDocxPlainText(blank);
    expect(blankText).not.toContain(DOCUSIGN_ANCHORS.buyer_signer.sign);
    expect(blankText).toContain("Responsible party entity name");
  });

  it("serves the populated Word bytes for buyer download and DocuSign", async () => {
    const doc = await generatePopulatedAgreement(engagement());
    expect(doc.fileExtension).toBe("docx");
    expect(doc.mimeType).toBe(POPULATED_AGREEMENT_MIME);
    expect(doc.filename).toBe("CP-2026-TEST-canaan-preserve-agreement.docx");
    expect(Buffer.from(doc.bytes.subarray(0, 2)).toString()).toBe("PK");
    expect(Buffer.from(doc.bytes.subarray(0, 5)).toString()).not.toBe("%PDF-");

    const contractSrc = readFileSync(CONTRACT_ROUTE, "utf8");
    const adminSrc = readFileSync(ADMIN_ACTIONS, "utf8");
    expect(contractSrc).toContain("generatePopulatedAgreement");
    expect(contractSrc).not.toContain("generateContractPdf");
    expect(adminSrc).toContain("generatePopulatedAgreement");
    expect(adminSrc).not.toMatch(/bytes:\s*await generateContractPdf/);
  });

  it("documents the Word blanks that intake cannot fill yet", () => {
    expect(AGREEMENT_FIELD_MAP.length).toBeGreaterThanOrEqual(8);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/Buyer email/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/Effective Date/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/county/i);
  });
});
