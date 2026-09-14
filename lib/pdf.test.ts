import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateContractPdf } from "./pdf";
import { buildTemplateEngagement } from "./contract";

const TEMPLATE_PDF = resolve(
  process.cwd(),
  "public/agreements/canaan-preserve-relocation-agreement-template.pdf",
);
const ORIGINAL_DOCX = resolve(process.cwd(), "content/agreements/van-original.docx");
const ORIGINAL_PDF = resolve(process.cwd(), "content/agreements/van-original.pdf");
const TEMPLATE_ROUTE = resolve(process.cwd(), "app/api/agreement-template/route.ts");

function pdfText(path: string) {
  return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
}

describe("agreement PDFs", () => {
  it("ships Van’s Word-derived blank template as a static PDF", () => {
    const bytes = readFileSync(TEMPLATE_PDF);
    expect(bytes.byteLength).toBeGreaterThan(10_000);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(existsSync(ORIGINAL_DOCX)).toBe(true);
    expect(existsSync(ORIGINAL_PDF)).toBe(true);

    const text = pdfText(TEMPLATE_PDF);
    expect(text).toContain("Post Oak Preserve");
    expect(text).toContain("Post Oak Partners, LLC");
    expect(text).toContain("GOPHER TORTOISE RELOCATION AGREEMENT");
    expect(text).toContain("six thousand dollars ($5,750.00)");
    expect(text).toContain("Initial Payment");
    expect(text).toContain("$3,000.00");
    expect(text).toContain("Witness 1");
    expect(text).toContain("Witness 2");
    expect(text).toContain("____________________");
    expect(text).not.toContain("Bio-Tech");
    expect(text).not.toContain("seventeen (17)");
    expect(text).not.toContain("$102,000.00");
    expect(text).not.toContain("Canaan Ranch");
    expect(text).not.toContain("Canaan Preserve");
  });

  it("does not generate the blank template from lib/contract.ts or node:fs", () => {
    const src = readFileSync(TEMPLATE_ROUTE, "utf8");
    expect(src).not.toContain("generateTemplateAgreementPdf");
    expect(src).not.toMatch(/from ["']@\/lib\/(pdf|contract)["']/);
    expect(src).not.toMatch(/from ["']node:fs["']/);
    expect(src).toContain("/agreements/canaan-preserve-relocation-agreement-template.pdf");
  });

  it("still builds a populated engagement PDF from generateContractPdf", async () => {
    const bytes = await generateContractPdf(buildTemplateEngagement());
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
