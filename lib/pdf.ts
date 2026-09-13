import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { brand, formatBrandAddress } from "./brand";
import { buildContract, type ContractDocument } from "./contract";
import type { Engagement } from "./types";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const BOTTOM = 64;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
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
    if (words.length === 0) {
      lines.push("");
    }
  }

  return lines;
}

async function drawDocument(
  contract: ContractDocument,
  options?: { watermark?: string; footerNote?: string },
) {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.12, 0.1, 0.08);
  const muted = rgb(0.38, 0.35, 0.3);
  const forest = rgb(0.11, 0.2, 0.16);
  const brass = rgb(0.62, 0.48, 0.22);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 52;

  const ensureSpace = (needed: number) => {
    if (y - needed > BOTTOM) {
      return;
    }
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 52;
    drawChrome(page, sans, contract.reference, forest, muted);
    y -= 28;
  };

  const writeLines = (
    lines: string[],
    font: PDFFont,
    size: number,
    color = ink,
    leading = size + 5,
  ) => {
    for (const line of lines) {
      ensureSpace(leading);
      page.drawText(line, {
        x: MARGIN,
        y,
        size,
        font,
        color,
      });
      y -= leading;
    }
  };

  drawChrome(page, sans, contract.reference, forest, muted);
  y -= 18;

  page.drawText(brand.name.toUpperCase(), {
    x: MARGIN,
    y,
    size: 11,
    font: sans,
    color: brass,
  });
  y -= 28;
  page.drawText(contract.title, {
    x: MARGIN,
    y,
    size: 22,
    font: serifBold,
    color: forest,
  });
  y -= 18;
  page.drawText(`${contract.subtitle}  ·  ${contract.reference}`, {
    x: MARGIN,
    y,
    size: 10,
    font: sans,
    color: muted,
  });
  y -= 14;
  page.drawText(`Effective ${contract.effectiveDate}`, {
    x: MARGIN,
    y,
    size: 10,
    font: sans,
    color: muted,
  });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.78, 0.72, 0.6),
  });
  y -= 22;

  for (const section of contract.sections) {
    ensureSpace(36);
    writeLines([section.heading], serifBold, 12, forest, 18);
    for (const paragraph of section.paragraphs) {
      writeLines(wrapText(paragraph, serif, 10.5, maxWidth), serif, 10.5, ink, 15);
      y -= 8;
    }
  }

  ensureSpace(140);
  writeLines([contract.signatureHeading], serifBold, 12, forest, 20);
  writeLines(
    wrapText(contract.signatureIntro, serif, 10.5, maxWidth),
    serif,
    10.5,
  );
  y -= 16;

  const columnWidth = (maxWidth - 24) / 2;
  const startY = y;
  drawSignatureColumn(page, contract.sellerBlock, MARGIN, startY, serif, sans, ink, muted);
  drawSignatureColumn(
    page,
    contract.buyerBlock,
    MARGIN + columnWidth + 24,
    startY,
    serif,
    sans,
    ink,
    muted,
  );

  if (options?.watermark) {
    const pages = pdf.getPages();
    for (const nextPage of pages) {
      nextPage.drawText(options.watermark, {
        x: 72,
        y: 300,
        size: 28,
        font: sans,
        color: rgb(0.62, 0.48, 0.22),
        opacity: 0.14,
        rotate: degrees(32),
      });
    }
  }

  const pages = pdf.getPages();
  pages.forEach((nextPage, index) => {
    nextPage.drawText(
      options?.footerNote ??
        `${brand.legalName}  ·  ${formatBrandAddress()}  ·  Page ${index + 1} of ${pages.length}`,
      {
        x: MARGIN,
        y: 28,
        size: 8,
        font: sans,
        color: muted,
      },
    );
  });

  return pdf.save();
}

function drawChrome(
  page: PDFPage,
  font: PDFFont,
  reference: string,
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
  page.drawText(reference, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(reference, 8),
    y: PAGE_HEIGHT - 36,
    size: 8,
    font,
    color: muted,
  });
}

function drawSignatureColumn(
  page: PDFPage,
  lines: string[],
  x: number,
  y: number,
  serif: PDFFont,
  sans: PDFFont,
  ink: ReturnType<typeof rgb>,
  muted: ReturnType<typeof rgb>,
) {
  let cursor = y;
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: cursor,
      size: index === 0 ? 11 : 10,
      font: index === 0 ? serif : sans,
      color: index === 0 ? ink : muted,
    });
    cursor -= 18;
  });
}

export async function generateContractPdf(engagement: Engagement) {
  return drawDocument(buildContract(engagement));
}

export async function generateStubSignedPdf(engagement: Engagement) {
  return drawDocument(buildContract(engagement), {
    watermark: "DOCUSIGN STUB — SIGNED",
    footerNote: `${brand.legalName}  ·  Stub signed artifact  ·  ${new Date().toISOString()}`,
  });
}
