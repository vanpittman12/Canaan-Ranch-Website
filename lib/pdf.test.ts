import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateContractPdf } from "./pdf";
import { buildTemplateEngagement } from "./contract";

const BLANK_DOCX_SHA256 =
  "0eb11197f8e2097ca18bab315ba557e4a3939d6eab20e354b9357aa7af0c362f";
const BLANK_DOCX_SIZE = 66615;

const TEMPLATE_DOCX = resolve(
  process.cwd(),
  "public/agreements/Canaan-Preserve-Relocation-Agreement-template.docx",
);
const TEMPLATE_ROUTE = resolve(process.cwd(), "app/api/agreement-template/route.ts");
const PUBLIC_HEADERS = resolve(process.cwd(), "public/_headers");

describe("agreement templates", () => {
  it("ships Van’s uploaded blank agreement as exact Word bytes", () => {
    const bytes = readFileSync(TEMPLATE_DOCX);
    expect(bytes.byteLength).toBe(BLANK_DOCX_SIZE);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(BLANK_DOCX_SHA256);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
  });

  it("307s the blank template to the static Word file, not the yellow PDF", () => {
    const src = readFileSync(TEMPLATE_ROUTE, "utf8");
    const headers = readFileSync(PUBLIC_HEADERS, "utf8");
    expect(src).toContain("/agreements/Canaan-Preserve-Relocation-Agreement-template.docx");
    expect(src).toContain("Response.redirect");
    expect(src).toContain("307");
    expect(src).not.toContain("canaan-preserve-relocation-agreement-template.pdf");
    expect(src).not.toContain("readFileSync");
    expect(src).not.toMatch(/from ["']node:fs["']/);
    expect(src).not.toContain("generateTemplateAgreementPdf");
    expect(src).not.toMatch(/from ["']@\/lib\/(pdf|contract)["']/);
    expect(headers).toContain("/agreements/Canaan-Preserve-Relocation-Agreement-template.docx");
    expect(headers).toContain(
      'Content-Disposition: attachment; filename="Canaan-Preserve-Relocation-Agreement-template.docx"',
    );
  });

  it("still builds a populated engagement PDF from generateContractPdf", async () => {
    const bytes = await generateContractPdf(buildTemplateEngagement());
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
