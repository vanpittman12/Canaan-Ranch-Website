/**
 * FWC-style Gopher Tortoise Acceptance / reservation letter.
 * Generated from intake fields; emailed only after admin send approval.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { brand, formatBrandAddress } from "./brand";
import { addOneYear, dateOnly, formatLongDate, numberToWords } from "./money";
import type {
  Engagement,
  ReservationLetter,
  ReservationLetterSource,
} from "./types";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;

export const RESERVATION_LETTER_TITLE = "Gopher Tortoise Acceptance Letter";

export type ReservationLetterFields = {
  letterDate: string;
  letterDateLabel: string;
  buyerLegalName: string;
  consultantCompany: string;
  donorProjectName: string;
  donorCounty: string;
  tortoiseCount: number;
  tortoiseCountWords: string;
  tortoiseCountPhrase: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  reservationPeriod: string;
  reference: string;
};

export function reservationLetterStoredName(engagementId: string) {
  return `${engagementId}-reservation-letter.pdf`;
}

export function reservationLetterFilename(reference: string) {
  return `${reference}-gopher-tortoise-acceptance-letter.pdf`;
}

export function formatTortoiseCountPhrase(count: number) {
  const words = numberToWords(count);
  const noun = count === 1 ? "gopher tortoise" : "gopher tortoises";
  return `${words} (${count}) ${noun}`;
}

export function buildReservationLetterFields(
  engagement: Pick<Engagement, "reference" | "effectiveDate" | "acceptedAt" | "intake">,
  now = new Date(),
): ReservationLetterFields {
  const { intake } = engagement;
  const letterDate =
    engagement.effectiveDate ??
    (engagement.acceptedAt ? dateOnly(engagement.acceptedAt) : dateOnly(now.toISOString()));
  const expirationDate = engagement.effectiveDate
    ? addOneYear(engagement.effectiveDate)
    : null;
  const reservationPeriod = engagement.effectiveDate
    ? `twelve (12) months from the Effective Date of ${formatLongDate(engagement.effectiveDate)}, expiring ${formatLongDate(expirationDate!)}`
    : "twelve (12) months from the Effective Date of the Gopher Tortoise Relocation Agreement (Effective Date + 1 year), to be stamped when the Seller signs";

  return {
    letterDate,
    letterDateLabel: formatLongDate(letterDate),
    buyerLegalName: intake.buyerLegalName.trim(),
    consultantCompany: intake.authorizedAgentCompany.trim(),
    donorProjectName: intake.donorSiteName.trim() || "—",
    donorCounty: intake.relocationCounty.trim(),
    tortoiseCount: intake.tortoiseCount,
    tortoiseCountWords: numberToWords(intake.tortoiseCount),
    tortoiseCountPhrase: formatTortoiseCountPhrase(intake.tortoiseCount),
    effectiveDate: engagement.effectiveDate,
    expirationDate,
    reservationPeriod,
    reference: engagement.reference,
  };
}

export function buildReservationLetterProse(fields: ReservationLetterFields) {
  const county = /county$/i.test(fields.donorCounty)
    ? fields.donorCounty
    : `${fields.donorCounty} County`;
  const paragraphs = [
    `${brand.legalName}, operator of ${brand.name}, an FWC Approved Tier 1 Long-Term Recipient Site, hereby confirms acceptance and reservation of recipient-site capacity for the relocation of ${fields.tortoiseCountPhrase} (Gopherus polyphemus) from the above-referenced donor project.`,
    `This reservation is in force for ${fields.reservationPeriod}. Reserved capacity is stated as tortoise count. Acres and Unit number are not collected at intake and are omitted from this letter.`,
    `This letter may be submitted with the donor-site permit application to the Florida Fish and Wildlife Conservation Commission as evidence that recipient-site capacity has been reserved at ${brand.name}.`,
    `Please contact ${brand.attention} at ${brand.email} or ${brand.phone} with any questions.`,
  ];

  return {
    title: RESERVATION_LETTER_TITLE,
    issuer: brand.legalName,
    site: brand.name,
    dateLine: fields.letterDateLabel,
    addressBlock: [
      fields.buyerLegalName,
      fields.consultantCompany ? `c/o ${fields.consultantCompany}` : "",
    ].filter(Boolean),
    reLines: [
      `Re: ${RESERVATION_LETTER_TITLE}`,
      `Donor project: ${fields.donorProjectName}`,
      `Donor county: ${county}, Florida`,
      `Recipient site: ${brand.name} (${brand.legalName})`,
      `Reserved capacity: ${fields.tortoiseCountPhrase}`,
      `Engagement: ${fields.reference}`,
    ],
    salutation: `Dear ${fields.buyerLegalName || "Permittee"}:`,
    paragraphs,
    closing: "Sincerely,",
    signatoryName: brand.signatoryName,
    signatoryTitle: `${brand.signatoryTitle}, ${brand.legalName}`,
  };
}

export function reservationLetterContainsBannedLegacy(text: string) {
  return /post\s*oak|applied bionomics/i.test(text);
}

export function applyReservationLetterGenerated(
  engagement: Engagement,
  input: {
    storedName: string;
    filename: string;
    letterDate: string;
    source: ReservationLetterSource;
    generatedAt?: string;
  },
): Engagement {
  const now = input.generatedAt ?? new Date().toISOString();
  const prior = engagement.reservationLetter;
  const alreadySent = prior.status === "sent";
  const next: ReservationLetter = {
    ...prior,
    status: alreadySent ? "sent" : "awaiting_send",
    generatedAt: prior.generatedAt ?? now,
    refreshedAt: prior.generatedAt ? now : prior.refreshedAt,
    storedName: input.storedName,
    filename: input.filename,
    letterDate: input.letterDate,
    source: input.source,
    lastError: null,
  };
  return {
    ...engagement,
    reservationLetter: next,
    updatedAt: now,
  };
}

export function applyReservationLetterSent(
  engagement: Engagement,
  input: {
    sentAt?: string;
    notifyMode: "stub" | "gmail";
  },
): Engagement {
  const now = input.sentAt ?? new Date().toISOString();
  return {
    ...engagement,
    reservationLetter: {
      ...engagement.reservationLetter,
      status: "sent",
      sendApprovedAt: engagement.reservationLetter.sendApprovedAt ?? now,
      sentAt: now,
      notifyMode: input.notifyMode,
      lastError: null,
    },
    updatedAt: now,
  };
}

export function applyReservationLetterSendFailed(
  engagement: Engagement,
  message: string,
): Engagement {
  const now = new Date().toISOString();
  return {
    ...engagement,
    reservationLetter: {
      ...engagement.reservationLetter,
      sendApprovedAt: now,
      lastError: message,
    },
    updatedAt: now,
  };
}

export async function generateReservationLetterPdf(fields: ReservationLetterFields) {
  const prose = buildReservationLetterProse(fields);
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.12, 0.1, 0.08);
  const muted = rgb(0.38, 0.35, 0.3);
  const forest = rgb(0.11, 0.2, 0.16);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 56;

  const write = (
    text: string,
    font: PDFFont,
    size: number,
    color = ink,
    leading = size + 6,
  ) => {
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= leading;
    }
  };

  drawLetterhead(page, sans, forest, muted);
  y = PAGE_HEIGHT - 118;
  write(prose.dateLine, serif, 11);
  y -= 10;
  for (const line of prose.addressBlock) {
    write(line, serif, 11);
  }
  y -= 12;
  for (const line of prose.reLines) {
    write(line, serifBold, 11, forest, 15);
  }
  y -= 14;
  write(prose.salutation, serif, 12);
  y -= 8;
  for (const paragraph of prose.paragraphs) {
    write(paragraph, serif, 11, ink, 16);
    y -= 10;
  }
  write(prose.closing, serif, 11);
  y -= 28;
  write(prose.signatoryName, serifBold, 11);
  write(prose.signatoryTitle, serif, 11);
  write(brand.name, serif, 11);
  write(formatBrandAddress(), serif, 10, muted);
  write(`${brand.fwcBadge}  ·  ${brand.phone}  ·  ${brand.email}`, sans, 8, muted);

  page.drawText(
    `${brand.legalName}  ·  ${RESERVATION_LETTER_TITLE}  ·  ${fields.reference}`,
    {
      x: MARGIN,
      y: 36,
      size: 8,
      font: sans,
      color: muted,
    },
  );

  return pdf.save();
}

function drawLetterhead(
  page: PDFPage,
  font: PDFFont,
  forest: ReturnType<typeof rgb>,
  muted: ReturnType<typeof rgb>,
) {
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 8,
    width: PAGE_WIDTH,
    height: 8,
    color: forest,
  });
  page.drawText(brand.name.toUpperCase(), {
    x: MARGIN,
    y: PAGE_HEIGHT - 40,
    size: 11,
    font,
    color: forest,
  });
  page.drawText(brand.legalName, {
    x: MARGIN,
    y: PAGE_HEIGHT - 54,
    size: 9,
    font,
    color: muted,
  });
  page.drawText(brand.fwcStatus, {
    x: MARGIN,
    y: PAGE_HEIGHT - 68,
    size: 8,
    font,
    color: muted,
  });
  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 80 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 80 },
    thickness: 1,
    color: rgb(0.78, 0.72, 0.6),
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}
