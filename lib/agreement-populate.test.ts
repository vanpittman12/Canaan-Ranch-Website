import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AGREEMENT_FIELD_MAP,
  AGREEMENT_FILL_RPR,
  AGREEMENT_UNMAPPED_GAPS,
  EFFECTIVE_DATE_LEFTOVER,
  EXPIRATION_DATE_LEFTOVER,
  extractDocxPlainText,
  formatEffectiveDateStamp,
  formatExpirationDateStamp,
  generatePopulatedAgreement,
  populateAgreementDocx,
  populateAgreementFromParts,
  replacePlainTextInParagraph,
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
import { applySubmit } from "./engagement";
import { addOneYear, formatLongDate } from "./money";
import { emptyReservationLetter, type Engagement, type IntakeFields } from "./types";

const TEMPLATE_DOCX = resolve(process.cwd(), BLANK_AGREEMENT_PUBLIC_FILE);
const VAN_ORIGINAL_DOCX = resolve(process.cwd(), "content/agreements/van-original.docx");
const CONTRACT_ROUTE = resolve(process.cwd(), "app/api/engagements/[id]/contract/route.ts");
const ADMIN_ACTIONS = resolve(process.cwd(), "app/actions/admin.ts");

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

describe("Van’s Word agreement populate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
    expect(text).toContain("Printed Name: Seller Witness");
    expect(text).toContain("Printed Name: Riley Chen");
    expect(text).toContain("By: Morgan Hale");
    expect(text).toContain("Its: President");

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
    expect(text).toContain("Harbour tract");
    expect(text).not.toContain("Multi-Project Relocation Agreement");
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
    expect(files).not.toContain("/date_effective/");

    const blankText = extractDocxPlainText(blank);
    expect(blankText).not.toContain(DOCUSIGN_ANCHORS.buyer_signer.sign);
    expect(blankText).toContain("Responsible party entity name");
    // Public blank currently uses plain "Witness Signature"; Van’s original uses Witness 1/2.
    expect(blankText).toMatch(/Witness(?:\s*1)?\s+Signature/);
  });

  it("places signature Date Signed anchors without a body Effective Date tab", () => {
    const signatureAnchors = [
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
    for (const anchor of signatureAnchors) {
      expect(publicText).toContain(anchor);
      expect(publicText.split(anchor).length - 1).toBe(1);
      expect(extractDocxPlainText(publicBlank)).not.toContain(anchor);
    }
    expect(publicText).not.toContain("/date_effective/");
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
    for (const anchor of signatureAnchors) {
      expect(vanText).toContain(anchor);
      expect(vanText.split(anchor).length - 1).toBe(1);
    }
    expect(vanText).not.toContain("/date_effective/");
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
    const sendSrc = readFileSync(resolve(process.cwd(), "lib/docusign-send.ts"), "utf8");
    expect(contractSrc).toContain("generatePopulatedAgreement");
    expect(contractSrc).not.toContain("generateContractPdf");
    expect(sendSrc).toContain("generatePopulatedAgreement");
    expect(adminSrc).toContain("sendDocuSignForEngagement");
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
    expect(populateSrc).not.toContain("/date_effective/");
    expect(populateSrc).toContain("Witness(?:\\s*1)?");

    const adminSrc = readFileSync(ADMIN_ACTIONS, "utf8");
    const submitSrc = readFileSync(
      resolve(process.cwd(), "app/actions/engagements.ts"),
      "utf8",
    );
    const sendSrc = readFileSync(resolve(process.cwd(), "lib/docusign-send.ts"), "utf8");
    // Submit / Accept persist before DocuSign send so a 400 cannot roll back status.
    expect(submitSrc).toContain("await saveEngagement(next)");
    expect(submitSrc).toContain("next = await sendDocuSignForEngagement(next)");
    expect(submitSrc.indexOf("Persist submit before populate")).toBeLessThan(
      submitSrc.indexOf("next = await sendDocuSignForEngagement(next)"),
    );
    expect(adminSrc).toContain("Persist Accept before DOCX populate");
    expect(adminSrc).toContain("next = await sendDocuSignForEngagement(next)");
    expect(adminSrc.indexOf("Persist Accept before DOCX populate")).toBeLessThan(
      adminSrc.indexOf("next = await sendDocuSignForEngagement(next)"),
    );
    expect(adminSrc).toContain("resendDocuSign");
    expect(adminSrc).toContain("shouldSendDocuSignOnSubmit");
    expect(sendSrc).toContain("DocuSign send failed after Accept");
    expect(sendSrc).toContain("DocuSign send failed after intake submit");
  });

  it("documents the Word blanks that intake cannot fill yet", () => {
    expect(AGREEMENT_FIELD_MAP.length).toBeGreaterThanOrEqual(8);
    expect(AGREEMENT_FIELD_MAP.some((row) => row.source === "intake.buyerTitle")).toBe(true);
    expect(AGREEMENT_FIELD_MAP.some((row) => row.source === "intake.donorSiteName")).toBe(true);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/Buyer email/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/Effective Date/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).toMatch(/county/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).not.toMatch(/Buyer title/i);
    expect(AGREEMENT_UNMAPPED_GAPS.join(" ")).not.toMatch(/donor site name/i);
  });

  it("stamps project name onto the Heading2 subtitle leftover only", () => {
    const blank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const blankText = extractDocxPlainText(blank);
    expect(blankText).toContain("GOPHER TORTOISE RELOCATION AGREEMENT");
    expect(blankText).toContain("Multi-Project Relocation Agreement");

    const populated = populateAgreementDocx(blank, engagement());
    const text = extractDocxPlainText(populated);
    const xml = strFromU8(unzipSync(populated)["word/document.xml"]!);
    expect(text).toContain("GOPHER TORTOISE RELOCATION AGREEMENT");
    expect(text).toContain("Harbour tract");
    expect(text).not.toContain("Multi-Project Relocation Agreement");
    expect(paragraphContaining(xml, "Harbour tract")).toContain('w:val="Heading2"');
    expect(paragraphContaining(xml, "GOPHER")).toMatch(/GOPHER[\s\S]*TORTOISE[\s\S]*RELOCATION[\s\S]*AGREEMENT/);

    const oak = extractDocxPlainText(
      populateAgreementDocx(
        blank,
        engagement({ intake: { ...intake, donorSiteName: "  Oak Grove Phase 2  " } }),
      ),
    );
    expect(oak).toContain("Oak Grove Phase 2");
    expect(oak).not.toContain("Multi-Project Relocation Agreement");
    expect(oak).toContain("GOPHER TORTOISE RELOCATION AGREEMENT");

    const emptyName = extractDocxPlainText(
      populateAgreementDocx(blank, engagement({ intake: { ...intake, donorSiteName: "   " } })),
    );
    expect(emptyName).toContain("Multi-Project Relocation Agreement");
    expect(emptyName).toContain("GOPHER TORTOISE RELOCATION AGREEMENT");
  });

  it("stamps buyer title into the buyer Its: leftover and leaves the seller Its: line alone", () => {
    const blank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const blankText = extractDocxPlainText(blank);
    expect(blankText).toMatch(/Its:\s*Authorized Agent/);
    expect(blankText.split("Its:").length - 1).toBe(2);

    const populated = extractDocxPlainText(populateAgreementDocx(blank, engagement()));
    expect(populated).toContain("Its: President");
    expect(populated).toMatch(/Its:\s*Authorized Agent/);
    expect(populated).toContain("By: Morgan Hale");

    const untitled = extractDocxPlainText(
      populateAgreementDocx(blank, engagement({ intake: { ...intake, buyerTitle: "" } })),
    );
    expect(untitled).not.toContain("Its: President");
    expect(untitled).toMatch(/Its:\s*Authorized Agent/);
    expect(untitled.split("Its:").length - 1).toBe(2);
  });

  it("leaves Van’s date leftovers blank until intake submission, with no phrase substitutes or body Date Signed tab", () => {
    const blank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const unsigned = extractDocxPlainText(populateAgreementDocx(blank, engagement()));
    expect(unsigned).toContain(EFFECTIVE_DATE_LEFTOVER);
    expect(unsigned).toContain(EXPIRATION_DATE_LEFTOVER);
    expect(unsigned).not.toContain("the date Buyer signs this Agreement");
    expect(unsigned).not.toContain("one (1) year after the Effective Date");
    expect(unsigned).not.toContain("/date_effective/");
    expect(unsigned).not.toContain("this 15th day of April, 2026");
    expect(unsigned).not.toContain("April 15, 2027");
  });

  it("types intake-submission Effective Date and addOneYear Expiration into the outgoing envelope", () => {
    expect(formatEffectiveDateStamp("2026-04-15")).toBe("this 15th day of April, 2026");
    expect(formatExpirationDateStamp("2026-04-15")).toBe("April 15, 2027,");
    expect(addOneYear("2026-04-15")).toBe("2027-04-15");
    expect(formatLongDate(addOneYear("2026-04-15"))).toBe("April 15, 2027");

    const blank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const submitted = extractDocxPlainText(
      populateAgreementDocx(
        blank,
        engagement({
          effectiveDate: "2026-04-15",
          submittedAt: "2026-04-15T18:22:00.000Z",
          status: "accepted",
        }),
      ),
    );
    expect(submitted).toContain("this 15th day of April, 2026");
    expect(submitted).toContain("April 15, 2027,");
    expect(submitted).toContain("referred to herein as the “Expiration Date.”");
    expect(submitted).not.toContain(EFFECTIVE_DATE_LEFTOVER);
    expect(submitted).not.toContain(EXPIRATION_DATE_LEFTOVER);
    expect(submitted).not.toContain("/date_effective/");
    expect(submitted).not.toContain("the date Buyer signs this Agreement");
    expect(submitted).not.toContain("one (1) year after the Effective Date");
  });

  it("stamps the Florida calendar day from applySubmit, including near midnight UTC and leap day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-17T03:30:00.000Z"));
    const submitted = applySubmit(engagement(), "docusign");
    expect(submitted.effectiveDate).toBe("2026-09-16");

    const blank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const submittedText = extractDocxPlainText(populateAgreementDocx(blank, submitted));
    expect(submittedText).toContain("this 16th day of September, 2026");
    expect(submittedText).toContain("September 16, 2027,");
    expect(submittedText).not.toContain("the date Buyer signs this Agreement");
    expect(submittedText).not.toContain("one (1) year after the Effective Date");
    expect(submittedText).not.toContain("/date_effective/");
    vi.useRealTimers();

    expect(formatEffectiveDateStamp("2024-02-29")).toBe("this 29th day of February, 2024");
    expect(formatExpirationDateStamp("2024-02-29")).toBe("March 1, 2025,");
    const leap = extractDocxPlainText(
      populateAgreementDocx(blank, engagement({ effectiveDate: "2024-02-29" })),
    );
    expect(leap).toContain("this 29th day of February, 2024");
    expect(leap).toContain("March 1, 2025,");
  });

  it("stamps dates as Times New Roman 12pt body runs and consumes leftover tabs", () => {
    const leftoverXml =
      `<w:p><w:pPr></w:pPr><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:tab/></w:r>` +
      `<w:r><w:t xml:space="preserve">, </w:t></w:r><w:r><w:t>202</w:t></w:r>` +
      `<w:r><w:t xml:space="preserve"> </w:t></w:r><w:r><w:t>,</w:t></w:r>` +
      `<w:r><w:t xml:space="preserve"> referred to herein as the “Expiration Date.”</w:t></w:r></w:p>`;
    const stampedLeftover = replacePlainTextInParagraph(
      leftoverXml,
      EXPIRATION_DATE_LEFTOVER,
      formatExpirationDateStamp("2026-04-15"),
      { consumeLeadingTabs: true },
    );
    expect(stampedLeftover).toContain("April 15, 2027,");
    expect(stampedLeftover).toContain("Times New Roman");
    expect(stampedLeftover).toContain(AGREEMENT_FILL_RPR);
    expect(stampedLeftover).not.toContain("<w:tab/>");
    expect(stampedLeftover).not.toContain(EXPIRATION_DATE_LEFTOVER);
    expect(stampedLeftover).toContain("Expiration Date");

    const blank = new Uint8Array(readFileSync(TEMPLATE_DOCX));
    const draftXml = strFromU8(unzipSync(populateAgreementDocx(blank, engagement()))["word/document.xml"]!);
    const submittedXml = strFromU8(
      unzipSync(populateAgreementDocx(blank, engagement({ effectiveDate: "2026-04-15" })))[
        "word/document.xml"
      ]!,
    );

    const draftOpening = paragraphContaining(draftXml, "entered into this");
    expect(draftOpening).not.toContain("/date_effective/");
    expect(draftOpening).not.toContain("the date Buyer signs this Agreement");
    expect(draftOpening).toContain("<w:tab/>");
    expect(draftOpening).toMatch(/<w:b\/>\s*<w:sz w:val="24"\/>\s*<\/w:rPr>\s*<w:t>Agreement<\/w:t>/);

    const submittedOpening = paragraphContaining(submittedXml, "this 15th day of April, 2026");
    expect(submittedOpening).toContain(AGREEMENT_FILL_RPR);
    expect(submittedOpening).not.toContain(EFFECTIVE_DATE_LEFTOVER);
    expect(submittedOpening).not.toContain("<w:tab/>");
    expect(submittedOpening).toMatch(/<w:b\/>\s*<w:sz w:val="24"\/>\s*<\/w:rPr>\s*<w:t>Agreement<\/w:t>/);

    const expirationPara = paragraphContaining(submittedXml, "April 15, 2027,");
    expect(expirationPara).toContain(AGREEMENT_FILL_RPR);
    expect(expirationPara).not.toContain(EXPIRATION_DATE_LEFTOVER);
    expect(expirationPara).not.toContain("<w:tab/>");
    expect(expirationPara).toContain("<w:b/>");
    expect(expirationPara).toContain("Expiration Date");
    expect(dateRunTypography(expirationPara, "April 15, 2027,")).toContain("Times New Roman");
    expect(dateRunTypography(expirationPara, "April 15, 2027,")).not.toContain("<w:u ");
  });

  it("stamps Effective/Expiration on the DocuSign complete and manual-upload paths", () => {
    const completeSrc = readFileSync(resolve(process.cwd(), "lib/docusign-complete.ts"), "utf8");
    const executedSrc = readFileSync(resolve(process.cwd(), "lib/executed-agreement.ts"), "utf8");
    const adminSrc = readFileSync(ADMIN_ACTIONS, "utf8");
    const uploadSrc = readFileSync(resolve(process.cwd(), "app/actions/engagements.ts"), "utf8");
    expect(executedSrc).toContain("generatePopulatedAgreement");
    expect(executedSrc).toContain("executed-agreement.docx");
    expect(completeSrc).toContain("persistExecutedAgreement(next)");
    expect(completeSrc).not.toContain("buyerSignedAtFromEnvelope");
    expect(completeSrc).not.toContain("resolveSignedAt");
    expect(adminSrc).toContain("persistExecutedAgreement(executed)");
    expect(uploadSrc).toContain("persistExecutedAgreement(next)");
  });
});

function paragraphContaining(xml: string, needle: string) {
  const match = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].find((row) => {
    if (row[0].includes(needle)) {
      return true;
    }
    const plain = [...row[0].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
      .map((token) => token[1] ?? "")
      .join("");
    return plain.includes(needle);
  });
  if (!match) {
    throw new Error(`No paragraph contained ${needle}`);
  }
  return match[0];
}

function dateRunTypography(paragraph: string, dateText: string) {
  const runs = [...paragraph.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)].map((row) => row[0]);
  const run = runs.find((row) => row.includes(dateText));
  if (!run) {
    throw new Error(`No run contained ${dateText}`);
  }
  return run;
}
