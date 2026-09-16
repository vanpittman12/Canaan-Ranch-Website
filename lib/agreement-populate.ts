/**
 * Fill intake values into Van’s Word agreement without rewriting the legal body.
 * Operates on Van’s blank DOCX (ZIP + word/document.xml).
 *
 * Cloudflare Workers: avoid repeated inflate/deflate of the 424KB document.xml.
 * generatePopulatedAgreement() reuses cached unzipped parts and zips at store
 * level so contract download / intake submit / Accept stay under CPU limits (Error 1102).
 */
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  loadBlankAgreementParts,
  POPULATED_AGREEMENT_MIME,
  POPULATED_ZIP_LEVEL,
  populatedAgreementFilename,
} from "./agreement-template";
import { brand, getSellerWitness } from "./brand";
import { DOCUSIGN_ANCHORS } from "./docusign-anchors";
import {
  addOneYear,
  dealEconomics,
  formatFormalDate,
  formatLongDate,
  numberToWords,
  PENDING_EFFECTIVE_DATE_PHRASE,
  PENDING_EXPIRATION_DATE_PHRASE,
} from "./money";
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

/**
 * Van’s body is Times New Roman 12pt (Normal / Body Text, w:sz 24). Filled
 * dates and intake blanks use this rPr so they read as typed body text, not a
 * Calibri/theme overlay. Underline is omitted — leftovers were underlined tabs.
 */
export const AGREEMENT_FILL_RPR =
  '<w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>';

const HIDDEN_ANCHOR_RPR =
  '<w:rPr><w:color w:val="FFFFFF"/><w:sz w:val="2"/><w:szCs w:val="2"/></w:rPr>';

export const AGREEMENT_UNMAPPED_GAPS = [
  "Effective Date leftover (“this  day of, 2024”) — not an intake field; typed into the outgoing Word as “the date Buyer signs this Agreement”, then the calendar stamp after the Buyer signs (complete / manual upload)",
  "Expiration leftover (leading underlined tab + “, 202 ,”) — typed into the outgoing Word as “one (1) year after the Effective Date,”; calendar addOneYear after complete. DocuSign has no Date Signed + 1 year formula and no template field #3",
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

/** Outgoing envelope / unsigned download — same copy as the HTML contract preview. */
export function formatEffectiveDatePendingStamp() {
  return PENDING_EFFECTIVE_DATE_PHRASE;
}

/** Trailing comma matches Van’s “, 202 ,” leftover so the sentence still reads. */
export function formatExpirationDatePendingStamp() {
  return `${PENDING_EXPIRATION_DATE_PHRASE},`;
}

export function buildAgreementDateStamps(engagement: Engagement): Array<[string, string]> {
  if (!engagement.effectiveDate) {
    return [
      [EFFECTIVE_DATE_LEFTOVER, formatEffectiveDatePendingStamp()],
      [EXPIRATION_DATE_LEFTOVER, formatExpirationDatePendingStamp()],
    ];
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
    let result = applyReplacementsToParagraph(paragraph, replacements);

    if (isPrintedNameLabel(text) && printedIndex < printedNames.length) {
      result = rewriteParagraphText(result, `Printed Name: ${printedNames[printedIndex++]}`);
    }

    if (text.trim() === "By:" || text.trim() === "By") {
      result = rewriteParagraphText(result, `By: ${engagement.intake.buyerAttention}`);
    }

    const anchors = anchorsForParagraph(text, witnessSignatureIndex);
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

function applyReplacementsToParagraph(paragraph: string, replacements: Array<[string, string]>) {
  let next = paragraph;
  for (const [find, replace] of replacements) {
    next = replacePlainTextInParagraph(next, find, replace, {
      consumeLeadingTabs: find === EXPIRATION_DATE_LEFTOVER,
    });
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

function anchorsForParagraph(text: string, witnessSignatureIndex: number) {
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

type RunAtom =
  | { kind: "text"; ch: string; rPr: string }
  | { kind: "tab"; rPr: string };

type ParsedParagraph = {
  open: string;
  pPr: string;
  atoms: RunAtom[];
};

/**
 * Replace `find` inside a Word paragraph without collapsing the whole paragraph
 * into the first run (that left leftover <w:tab/> blanks and inherited the wrong
 * rPr — dates looked stamped). Optional leading tabs are consumed for Van’s
 * Expiration leftover, which is an underlined tab plus “, 202 ,”.
 */
export function replacePlainTextInParagraph(
  paragraph: string,
  find: string,
  replace: string,
  options?: { consumeLeadingTabs?: boolean },
) {
  if (!find) {
    return paragraph;
  }
  const parsed = parseParagraphAtoms(paragraph);
  if (!parsed) {
    return paragraph;
  }
  const search = textFromAtoms(parsed.atoms);
  if (!search.includes(find)) {
    return paragraph;
  }
  return serializeParagraph(
    parsed,
    replaceAllInAtoms(parsed.atoms, find, replace, {
      consumeLeadingTabs: options?.consumeLeadingTabs === true,
      fillRpr: AGREEMENT_FILL_RPR,
    }),
  );
}

function parseParagraphAtoms(paragraph: string): ParsedParagraph | null {
  const openMatch = paragraph.match(/^<w:p\b[^>]*>/);
  if (!openMatch || !paragraph.endsWith("</w:p>")) {
    return null;
  }
  const open = openMatch[0];
  const inner = paragraph.slice(open.length, -"</w:p>".length);
  const pPrMatch = inner.match(/^<w:pPr\b[\s\S]*?<\/w:pPr>/);
  const pPr = pPrMatch?.[0] ?? "";
  const body = pPrMatch ? inner.slice(pPr.length) : inner;
  const atoms: RunAtom[] = [];
  for (const runMatch of body.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)) {
    atoms.push(...atomsFromRun(runMatch[0]));
  }
  return { open, pPr, atoms };
}

function atomsFromRun(run: string): RunAtom[] {
  const rPr = run.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? "";
  const atoms: RunAtom[] = [];
  const tokenRe = /<w:tab\b[^>]*\/>|<w:tab\b[^>]*>\s*<\/w:tab>|<w:t\b[^>]*>[\s\S]*?<\/w:t>/g;
  for (const token of run.matchAll(tokenRe)) {
    const xml = token[0];
    if (xml.startsWith("<w:tab")) {
      atoms.push({ kind: "tab", rPr });
      continue;
    }
    const text = decodeXml(xml.match(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/)?.[1] ?? "");
    for (const ch of text) {
      atoms.push({ kind: "text", ch, rPr });
    }
  }
  return atoms;
}

function textFromAtoms(atoms: RunAtom[]) {
  return atoms.filter((atom) => atom.kind === "text").map((atom) => atom.ch).join("");
}

function atomIndexByTextOffset(atoms: RunAtom[]) {
  const map: number[] = [];
  atoms.forEach((atom, index) => {
    if (atom.kind === "text") {
      map.push(index);
    }
  });
  return map;
}

function fillAtoms(text: string, rPr: string): RunAtom[] {
  return [...text].map((ch) => ({ kind: "text" as const, ch, rPr }));
}

function replaceAllInAtoms(
  atoms: RunAtom[],
  find: string,
  replace: string,
  options: { consumeLeadingTabs: boolean; fillRpr: string },
) {
  const search = textFromAtoms(atoms);
  const matches: number[] = [];
  let pos = 0;
  while (pos <= search.length - find.length) {
    const idx = search.indexOf(find, pos);
    if (idx < 0) {
      break;
    }
    matches.push(idx);
    pos = idx + find.length;
  }
  if (matches.length === 0) {
    return atoms;
  }

  const map = atomIndexByTextOffset(atoms);
  const fill = fillAtoms(replace, options.fillRpr);
  let current = atoms;
  for (const idx of [...matches].reverse()) {
    let from = map[idx]!;
    const to = map[idx + find.length - 1]!;
    if (options.consumeLeadingTabs) {
      while (from > 0 && atoms[from - 1]?.kind === "tab") {
        from -= 1;
      }
    }
    current = [...current.slice(0, from), ...fill, ...current.slice(to + 1)];
  }
  return current;
}

function serializeParagraph(parsed: ParsedParagraph, atoms: RunAtom[]) {
  return `${parsed.open}${parsed.pPr}${serializeAtoms(atoms)}</w:p>`;
}

function serializeAtoms(atoms: RunAtom[]) {
  const runs: string[] = [];
  let index = 0;
  while (index < atoms.length) {
    const atom = atoms[index]!;
    if (atom.kind === "tab") {
      runs.push(`<w:r>${atom.rPr}<w:tab/></w:r>`);
      index += 1;
      continue;
    }
    const { rPr } = atom;
    let text = "";
    while (index < atoms.length && atoms[index]?.kind === "text" && atoms[index]?.rPr === rPr) {
      text += (atoms[index] as { ch: string }).ch;
      index += 1;
    }
    if (!text) {
      continue;
    }
    const tAttrs = needsXmlSpace(text) ? ' xml:space="preserve"' : "";
    runs.push(`<w:r>${rPr}<w:t${tAttrs}>${encodeXml(text)}</w:t></w:r>`);
  }
  return runs.join("");
}

function needsXmlSpace(text: string) {
  return text.startsWith(" ") || text.endsWith(" ") || text.includes("  ") || text.startsWith("\t");
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
