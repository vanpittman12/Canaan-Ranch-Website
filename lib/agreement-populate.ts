/**
 * Fill intake values into Van’s Word agreement without rewriting the legal body.
 * Operates on Van’s blank DOCX (ZIP + word/document.xml).
 *
 * Cloudflare Workers: avoid repeated inflate/deflate of the 424KB document.xml.
 * generatePopulatedAgreement() reuses cached unzipped parts and zips at store
 * level so contract download / Accept stay under CPU limits (Error 1102).
 */
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  loadBlankAgreementParts,
  POPULATED_AGREEMENT_MIME,
  POPULATED_ZIP_LEVEL,
  populatedAgreementFilename,
} from "./agreement-template";
import { brand, getSellerWitness } from "./brand";
import { DOCUSIGN_ANCHORS, EFFECTIVE_DATE_SIGNED_ANCHOR } from "./docusign-anchors";
import { addOneYear, dealEconomics, formatFormalDate, formatLongDate, numberToWords } from "./money";
import type { Engagement } from "./types";

const DOCUMENT_XML = "word/document.xml";
const SAMPLE_COUNT = "seventeen (17)";
const SAMPLE_TOTAL = "one hundred two thousand dollars ($102,000.00)";
const BUYER_ENTITY = "Responsible party entity name";
const BUYER_CONTACT = "Contact name";
const BUYER_STREET = "Street address";
const BUYER_CITY_LINE = "City, State ZIP";
const BUYER_PHONE = "Phone number";
const CANAAN_AGENT_BLANK = "______________";

export const AGREEMENT_FIELD_MAP = [
  { placeholder: BUYER_ENTITY, source: "intake.buyerLegalName" },
  { placeholder: BUYER_CONTACT, source: "intake.buyerAttention" },
  { placeholder: BUYER_STREET, source: "intake.buyerStreet" },
  { placeholder: BUYER_CITY_LINE, source: "intake.buyerCity + buyerState + buyerPostalCode" },
  { placeholder: "Phone: Phone number", source: "intake.buyerPhone" },
  { placeholder: SAMPLE_COUNT, source: "intake.tortoiseCount (words + digits)" },
  { placeholder: SAMPLE_TOTAL, source: "count × intake.perGtRate" },
  { placeholder: "Canaan Agent: ______________", source: "brand.agentName + brand.agentContact" },
  { placeholder: "Printed Name: (seller witness)", source: "seller witness name" },
  { placeholder: "Printed Name: (buyer witness)", source: "intake.buyerWitnessName" },
  { placeholder: "Printed Name: (buyer signatory)", source: "intake.buyerAttention" },
  { placeholder: "By: (buyer)", source: "intake.buyerAttention" },
] as const;

/** Van’s opening leftover: “entered into this  day of, 2024,” */
export const EFFECTIVE_DATE_LEFTOVER = "this  day of, 2024";
/** Van’s Term leftover paragraph starts “, 202 , referred to herein as the “Expiration Date.”” */
export const EXPIRATION_DATE_LEFTOVER = ", 202 ,";

export const AGREEMENT_UNMAPPED_GAPS = [
  "Effective Date leftover (“this  day of, 2024”) — not an intake field; stamped from the Buyer’s Date Signed after they sign (DocuSign complete or manual upload), never from Accept or intake",
  "Expiration leftover (“, 202 ,”) — derived as addOneYear(Effective Date) and stamped into the stored/regenerated Word after complete; DocuSign cannot formula-fill Date Signed + 1 year on this leftover",
  "Buyer email — Van’s notice block has name / address / phone only",
  "Buyer title (“Its:”) — not collected on intake",
  "Relocation county — no matching blank in the Word file",
  "Buyer authorized agent name/company — Word only blanks Canaan Agent",
  "Donor company affiliation, donor site name, and project description — no Word blanks",
  "Buyer / seller witness emails — used for DocuSign routing, not printed in the file",
  "Per GT Rate body text stays $6,000.00; an admin rate override updates only the Total Estimated Payment blank",
] as const;

export type PopulatedAgreement = {
  bytes: Uint8Array;
  filename: string;
  mimeType: string;
  fileExtension: "docx";
};

export function formatAgreementUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatReservedCount(count: number) {
  return `${numberToWords(count)} (${count})`;
}

export function formatEstimatedPayment(total: number) {
  return `${numberToWords(total)} dollars (${formatAgreementUsd(total)})`;
}

export function canaanAgentFill() {
  return `${brand.agentName} Attention: ${brand.agentContact}`;
}

/**
 * Fill Van’s “this  day of, 2024” leftover. formatFormalDate is
 * “the 15th day of April, 2026”; the leftover already starts with “this”.
 */
export function formatEffectiveDateStamp(isoDate: string) {
  return `this ${formatFormalDate(isoDate).replace(/^the /, "")}`;
}

/** Fill Van’s “, 202 ,” leftover as “April 15, 2027,” (Effective + 1 year). */
export function formatExpirationDateStamp(isoDate: string) {
  return `${formatLongDate(addOneYear(isoDate))},`;
}

export function buildAgreementDateStamps(engagement: Engagement): Array<[string, string]> {
  if (!engagement.effectiveDate) {
    return [];
  }
  return [
    [EFFECTIVE_DATE_LEFTOVER, formatEffectiveDateStamp(engagement.effectiveDate)],
    [EXPIRATION_DATE_LEFTOVER, formatExpirationDateStamp(engagement.effectiveDate)],
  ];
}

export function buildAgreementReplacements(engagement: Engagement): Array<[string, string]> {
  const { intake } = engagement;
  const economics = dealEconomics(intake);
  return [
    [SAMPLE_TOTAL, formatEstimatedPayment(economics.total)],
    [SAMPLE_COUNT, formatReservedCount(economics.count)],
    [BUYER_ENTITY, intake.buyerLegalName],
    [BUYER_CONTACT, intake.buyerAttention],
    [BUYER_STREET, intake.buyerStreet],
    [BUYER_CITY_LINE, `${intake.buyerCity}, ${intake.buyerState} ${intake.buyerPostalCode}`],
    [BUYER_PHONE, intake.buyerPhone],
    [CANAAN_AGENT_BLANK, canaanAgentFill()],
    ...buildAgreementDateStamps(engagement),
  ];
}

export function populateAgreementDocx(
  templateBytes: Uint8Array,
  engagement: Engagement,
): Uint8Array {
  const files = unzipSync(templateBytes);
  return zipPopulatedParts(files, engagement);
}

/**
 * Workers-safe populate: reuse cached unzipped parts and re-zip at store
 * level (no deflate). Only word/document.xml is replaced; other entries are
 * shared immutable views from the isolate cache.
 */
export function populateAgreementFromParts(
  parts: Record<string, Uint8Array>,
  engagement: Engagement,
): Uint8Array {
  return zipPopulatedParts({ ...parts }, engagement);
}

function zipPopulatedParts(
  files: Record<string, Uint8Array>,
  engagement: Engagement,
): Uint8Array {
  const xmlFile = files[DOCUMENT_XML];
  if (!xmlFile) {
    throw new Error("Van’s agreement template is missing word/document.xml.");
  }
  files[DOCUMENT_XML] = strToU8(populateDocumentXml(strFromU8(xmlFile), engagement));
  // level 0 (store) — deflating the 424KB document.xml was the Error 1102 culprit.
  return zipSync(files, { level: POPULATED_ZIP_LEVEL });
}

export async function generatePopulatedAgreement(
  engagement: Engagement,
): Promise<PopulatedAgreement> {
  const parts = await loadBlankAgreementParts();
  return {
    bytes: populateAgreementFromParts(parts, engagement),
    filename: populatedAgreementFilename(engagement.reference),
    mimeType: POPULATED_AGREEMENT_MIME,
    fileExtension: "docx",
  };
}

export function extractDocxPlainText(bytes: Uint8Array) {
  const files = unzipSync(bytes);
  const xmlFile = files[DOCUMENT_XML];
  if (!xmlFile) {
    return "";
  }
  return paragraphTexts(strFromU8(xmlFile)).join("\n");
}

export function populateDocumentXml(xml: string, engagement: Engagement): string {
  const replacements = buildAgreementReplacements(engagement);
  const printedNames = printedNameValues(engagement);
  let printedIndex = 0;
  let witnessSignatureIndex = 0;

  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    const text = paragraphText(paragraph);
    let next = applyReplacements(text, replacements);

    if (isPrintedNameLabel(text) && printedIndex < printedNames.length) {
      next = `Printed Name: ${printedNames[printedIndex++]}`;
    }

    if (text.trim() === "By:" || text.trim() === "By") {
      next = `By: ${engagement.intake.buyerAttention}`;
    }

    let result = next === text ? paragraph : rewriteParagraphText(paragraph, next);
    const anchors = anchorsForParagraph(text, witnessSignatureIndex, engagement);
    if (anchors.length > 0) {
      result = appendHiddenAnchors(result, anchors);
    }
    if (isWitnessSignatureParagraph(text)) {
      witnessSignatureIndex += 1;
    }
    return result;
  });
}

function printedNameValues(engagement: Engagement) {
  const sellerWitness = engagement.intake.sellerWitnessName.trim() || getSellerWitness().name;
  return [sellerWitness, engagement.intake.buyerWitnessName, engagement.intake.buyerAttention];
}

function applyReplacements(text: string, replacements: Array<[string, string]>) {
  let next = text;
  for (const [find, replace] of replacements) {
    next = next.split(find).join(replace);
  }
  return next;
}

function isPrintedNameLabel(text: string) {
  return /^Printed\s*Name:\s*$/.test(text.trim());
}

function isWitnessSignatureParagraph(text: string) {
  // Van’s Word file labels blocks "Witness 1 Signature" / "Witness 2 Signature".
  // Product rule: one witness per party — map only Witness 1 (or plain "Witness Signature").
  const compact = text.replace(/\s+/g, " ").trim();
  return /^(Witness(?:\s*1)?\s+Signature)$/i.test(compact);
}

function anchorsForParagraph(
  text: string,
  witnessSignatureIndex: number,
  engagement: Engagement,
) {
  if (!engagement.effectiveDate && text.includes(EFFECTIVE_DATE_LEFTOVER)) {
    return [EFFECTIVE_DATE_SIGNED_ANCHOR];
  }
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.includes("By: Name: Andrew V. Pittman, Jr.")) {
    return [DOCUSIGN_ANCHORS.seller_signer.sign, DOCUSIGN_ANCHORS.seller_signer.date];
  }
  if (compact === "By:" || compact === "By") {
    return [DOCUSIGN_ANCHORS.buyer_signer.sign, DOCUSIGN_ANCHORS.buyer_signer.date];
  }
  if (isWitnessSignatureParagraph(text)) {
    if (witnessSignatureIndex === 0) {
      return [DOCUSIGN_ANCHORS.seller_witness.sign, DOCUSIGN_ANCHORS.seller_witness.date];
    }
    if (witnessSignatureIndex === 1) {
      return [DOCUSIGN_ANCHORS.buyer_witness.sign, DOCUSIGN_ANCHORS.buyer_witness.date];
    }
  }
  return [];
}

function paragraphTexts(xml: string) {
  return [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((match) => paragraphText(match[0]));
}

function paragraphText(paragraph: string) {
  return [...paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((match) => decodeXml(match[1] ?? ""))
    .join("");
}

function rewriteParagraphText(paragraph: string, nextText: string) {
  let used = false;
  const encoded = encodeXml(nextText);
  return paragraph.replace(/<w:t\b([^>]*)>([\s\S]*?)<\/w:t>/g, (_full, rawAttrs: string) => {
    if (used) {
      return `<w:t${rawAttrs}></w:t>`;
    }
    used = true;
    const attrs = preserveSpaceAttr(rawAttrs, nextText);
    return `<w:t${attrs}>${encoded}</w:t>`;
  });
}

function preserveSpaceAttr(rawAttrs: string, text: string) {
  const needs =
    text.startsWith(" ") || text.endsWith(" ") || text.includes("  ") || text.startsWith("\t");
  if (!needs) {
    return rawAttrs;
  }
  if (/\sxml:space=/.test(rawAttrs)) {
    return rawAttrs;
  }
  return `${rawAttrs} xml:space="preserve"`;
}

function appendHiddenAnchors(paragraph: string, anchors: string[]) {
  // DocuSign AutoPlace must see the anchor string in the converted document.
  // <w:vanish/> is often stripped on DOCX→PDF conversion, so use 1pt white text
  // without vanish (populated copy only; blank download stays anchor-free).
  const runs = anchors
    .map(
      (anchor) =>
        `<w:r><w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr><w:t xml:space="preserve">${encodeXml(anchor)}</w:t></w:r>`,
    )
    .join("");
  return paragraph.replace(/<\/w:p>/, `${runs}</w:p>`);
}

function decodeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function encodeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
