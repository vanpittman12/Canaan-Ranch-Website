import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLANK_AGREEMENT_DOCX_SHA256,
  BLANK_AGREEMENT_DOCX_SIZE,
  BLANK_AGREEMENT_PUBLIC_FILE,
} from "./agreement-template";

const TEMPLATE_DOCX = resolve(process.cwd(), BLANK_AGREEMENT_PUBLIC_FILE);
const TEMPLATE_ROUTE = resolve(process.cwd(), "app/api/agreement-template/route.ts");
const PUBLIC_HEADERS = resolve(process.cwd(), "public/_headers");
const CONTRACT_ROUTE = resolve(process.cwd(), "app/api/engagements/[id]/contract/route.ts");

describe("agreement templates", () => {
  it("ships Van’s uploaded blank agreement as exact Word bytes", () => {
    const bytes = readFileSync(TEMPLATE_DOCX);
    expect(bytes.byteLength).toBe(BLANK_AGREEMENT_DOCX_SIZE);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(BLANK_AGREEMENT_DOCX_SHA256);
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

  it("does not source the populated agreement from generateContractPdf", () => {
    const src = readFileSync(CONTRACT_ROUTE, "utf8");
    expect(src).toContain("generatePopulatedAgreement");
    expect(src).not.toContain("generateContractPdf");
    expect(src).not.toContain("application/pdf");
  });
});
