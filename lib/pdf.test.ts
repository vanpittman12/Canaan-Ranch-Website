import { describe, expect, it } from "vitest";
import { generateTemplateAgreementPdf } from "./pdf";

describe("agreement PDFs", () => {
  it("generates a blank template PDF for pre-intake review", async () => {
    const bytes = await generateTemplateAgreementPdf();
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
