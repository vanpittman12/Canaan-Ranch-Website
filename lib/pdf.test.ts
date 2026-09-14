import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateContractPdf } from "./pdf";
import { buildTemplateEngagement } from "./contract";

const BLANK_DOCX_SHA256 =
  "885785bbb9bec94f10c66755e3239717193311893eda5e64a0d8330e4072605e";
const BLANK_DOCX_SIZE = 66690;

const TEMPLATE_DOCX = resolve(
  process.cwd(),
  "public/agreements/Canaan-Preserve-Relocation-Agreement-template.docx",
);
const TEMPLATE_ROUTE = resolve(process.cwd(), "app/api/agreement-template/route.ts");

describe("agreement templates", () => {
  it("ships Van’s uploaded blank agreement as exact Word bytes", () => {
    const bytes = readFileSync(TEMPLATE_DOCX);
    expect(bytes.byteLength).toBe(BLANK_DOCX_SIZE);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(BLANK_DOCX_SHA256);
    expect(bytes.subarray(0, 2).toString()).toBe("PK");
  });

  it("serves the blank template as a Word attachment, not a PDF redirect", () => {
    const src = readFileSync(TEMPLATE_ROUTE, "utf8");
    expect(src).toContain("Canaan-Preserve-Relocation-Agreement-template.docx");
    expect(src).toContain("Content-Disposition");
    expect(src).toContain("attachment");
    expect(src).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(src).not.toContain("canaan-preserve-relocation-agreement-template.pdf");
    expect(src).not.toContain("Response.redirect");
    expect(src).not.toContain("generateTemplateAgreementPdf");
    expect(src).not.toMatch(/from ["']@\/lib\/(pdf|contract)["']/);
  });

  it("still builds a populated engagement PDF from generateContractPdf", async () => {
    const bytes = await generateContractPdf(buildTemplateEngagement());
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
