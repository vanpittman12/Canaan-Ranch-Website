import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  AGREEMENT_FIELD_MAP,
  AGREEMENT_UNMAPPED_GAPS,
  extractDocxPlainText,
  generatePopulatedAgreement,
  populateAgreementDocx,
  populateAgreementFromParts,
} from "./agreement-populate";
import {
  BLANK_AGREEMENT_DOCX_SHA256,
  BLANK_AGREEMENT_DOCX_SIZE,
  BLANK_AGREEMENT_PUBLIC_FILE,
  POPULATED_AGREEMENT_MIME,
  POPULATED_ZIP_LEVEL,
  loadBlankAgreementParts,
  resetBlankAgreementTemplateCache,
} from "./agreement-template";
import { brand } from "./brand";
import { DOCUSIGN_ANCHORS } from "./docusign-anchors";
import type { Engagement, IntakeFields } from "./types";

const TEMPLATE_DOCX = resolve(process.cwd(), BLANK_AGREEMENT_PUBLIC_FILE);
const VAN_ORIGINAL_DOCX = resolve(process.cwd(), "content/agreements/van-original.docx");
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
    // Public blank currently uses plain "Witness Signature"; Van’s original uses Witness 1/2.
    expect(blankText).toMatch(/Witness(?:\s*1)?\s+Signature/);
  });

  it("places all eight DocuSign anchors on Van’s real signature labels without vanish", () => {
    const allEight = [
      DOCUSIGN_ANCHORS.buyer_signer.sign,
      DOCUSIGN_ANCHORS.buyer_signer.date,
      DOCUSIGN_ANCHORS.seller_signer.sign,
      DOCUSIGN_ANCHORS.seller_signer.date,
      DOCUSIGN_ANCHORS.buyer_witness.sign,
      DOCUSIGN_ANCHORS.buyer_witness.date,
      DOCUSIGN_ANCHORS.seller_witness.sign,
      DOCUSIGN_ANCHORS.seller_witness.date,
    ];

    // Public blank download template (Witness Signature ×2).
    const publicBlank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const publicPopulated = populateAgreementDocx(publicBlank, engagement());
    const publicText = extractDocxPlainText(publicPopulated);
    const publicXml = strFromU8(unzipSync(publicPopulated)["word/document.xml"]!);
    for (const anchor of allEight) {
      expect(publicText).toContain(anchor);
      expect(publicText.split(anchor).length - 1).toBe(1);
      expect(extractDocxPlainText(publicBlank)).not.toContain(anchor);
    }
    expect(publicXml).not.toContain("<w:vanish");
    expect(publicXml).toContain('w:val="FFFFFF"');

    // Van’s real original fixture (Witness 1 Signature ×2 + Witness 2 ignored).
    const vanOriginal = new Uint8Array(readFileSync(VAN_ORIGINAL_DOCX));
    const vanTextBlank = extractDocxPlainText(vanOriginal);
    expect(vanTextBlank).toContain("Witness 1 Signature");
    expect(vanTextBlank).toContain("Witness 2 Signature");

    const vanPopulated = populateAgreementDocx(vanOriginal, engagement());
    const vanText = extractDocxPlainText(vanPopulated);
    const vanXml = strFromU8(unzipSync(vanPopulated)["word/document.xml"]!);
    for (const anchor of allEight) {
      expect(vanText).toContain(anchor);
      expect(vanText.split(anchor).length - 1).toBe(1);
    }
    expect(vanXml).not.toContain("<w:vanish");
    expect(vanXml).toContain('w:val="FFFFFF"');
    // Labels may be split across w:t runs in Van’s OOXML — assert via joined plain text.
    expect(vanText).toMatch(/Witness 1 Signature\s*\/wit_seller\//);
    expect(vanText).toMatch(/By: Name: Andrew V\. Pittman, Jr\.\s*\/sn_seller\//);
    expect(vanText).toMatch(/By: Morgan Hale\s*\/sn_buyer\//);
    expect(vanText).toMatch(/Witness 1 Signature\s*\/wit_buyer\//);
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


  it("stays Workers-safe: cached parts + store-level zip, no docusign crypto import", async () => {
    resetBlankAgreementTemplateCache();
    const parts = await loadBlankAgreementParts();
    const again = await loadBlankAgreementParts();
    expect(again).toBe(parts);
    expect(POPULATED_ZIP_LEVEL).toBe(0);

    const populated = populateAgreementFromParts(parts, engagement());
    expect(Buffer.from(populated.subarray(0, 2)).toString()).toBe("PK");
    expect(extractDocxPlainText(populated)).toContain("Suncoast Land Partners LLC");

    const populateSrc = readFileSync(resolve(process.cwd(), "lib/agreement-populate.ts"), "utf8");
    expect(populateSrc).toContain('from "./docusign-anchors"');
    expect(populateSrc).not.toMatch(/from ["']\.\/docusign["']/);
    expect(populateSrc).toContain("POPULATED_ZIP_LEVEL");
    expect(populateSrc).toContain("loadBlankAgreementParts");
    // Anchor run markup must not use vanish (comment mentions are fine).
    expect(populateSrc).not.toMatch(/<w:rPr><w:vanish/);
    expect(populateSrc).toContain("Witness(?:\\s*1)?");

    const adminSrc = readFileSync(ADMIN_ACTIONS, "utf8");
    // Accept must persist before DocuSign send so a 400 cannot roll back to Pending.
    expect(adminSrc.indexOf("await saveEngagement(next)")).toBeLessThan(
      adminSrc.indexOf("sendDocuSignForEngagement"),
    );
    expect(adminSrc).toContain("resendDocuSign");
    expect(adminSrc).toContain("DocuSign send failed after Accept");
  });

  it("documents the Word blanks that intake cannot fill yet", () => {
    expect(AGREEMENT_FIELD_MAP.length).toBeGreaterThanOrEqual(8);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/Buyer email/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/Effective Date/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/county/i);
  });
});
