import { describe, expect, it } from "vitest";
import { addOneYear, dealEconomics, numberToWords, usdInWords } from "./money";
import type { IntakeFields } from "./types";

const intake: IntakeFields = {
  effectiveDate: "2026-04-15",
  buyerLegalName: "Example Buyer LLC",
  buyerAttention: "Jordan Lee",
  buyerEmail: "jordan@example.com",
  buyerStreet: "100 Main Street",
  buyerCity: "Tampa",
  buyerState: "FL",
  buyerPostalCode: "33602",
  buyerPhone: "813-555-0100",
  tortoiseCount: 12,
  perGtRate: 6000,
  donorSiteName: "",
  donorSiteDescription: "",
};

describe("deal economics", () => {
  it("defaults the per-GT rate language to six thousand and totals count × rate", () => {
    const economics = dealEconomics(intake);
    expect(economics.rate).toBe(6000);
    expect(economics.total).toBe(72000);
    expect(usdInWords(6000)).toBe("six thousand dollars");
    expect(economics.totalWords).toBe("seventy-two thousand dollars");
  });

  it("sets expiration to one year after the effective date", () => {
    expect(addOneYear("2026-04-15")).toBe("2027-04-15");
  });

  it("writes integer counts in words for paragraph 2", () => {
    expect(numberToWords(8)).toBe("eight");
    expect(numberToWords(21)).toBe("twenty-one");
  });
});
