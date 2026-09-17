import { describe, expect, it } from "vitest";
import {
  addOneYear,
  agreementDatePreview,
  businessDateOnly,
  dateOnly,
  dealEconomics,
  formatLongDate,
  numberToWords,
  usdInWords,
} from "./money";
import type { IntakeFields } from "./types";

const intake: IntakeFields = {
  buyerLegalName: "Example Buyer LLC",
  buyerAttention: "Jordan Lee",
  buyerTitle: "Manager",
  buyerEmail: "jordan@example.com",
  buyerStreet: "100 Main Street",
  buyerCity: "Tampa",
  buyerState: "FL",
  buyerPostalCode: "33602",
  buyerPhone: "813-555-0100",
  tortoiseCount: 12,
  perGtRate: 6000,
  relocationCounty: "Pasco",
  authorizedAgentName: "Alex Rivera",
  authorizedAgentCompany: "Rivera Environmental",
  donorCompanyAffiliation: "D.R. Horton",
  donorSiteName: "",
  donorSiteDescription: "",
  buyerWitnessName: "Sam Ortiz",
  buyerWitnessEmail: "sam@example.com",
  sellerWitnessName: "Jordan Blake",
  sellerWitnessEmail: "jordan.blake@canaanpreserve.example",
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
    expect(dateOnly("2026-04-15T18:22:00.000Z")).toBe("2026-04-15");
  });

  it("uses the America/New_York calendar date so midnight UTC does not roll the Florida day", () => {
    // 2026-09-17 03:30 UTC is still 2026-09-16 23:30 EDT.
    expect(businessDateOnly("2026-09-17T03:30:00.000Z")).toBe("2026-09-16");
    expect(dateOnly("2026-09-17T03:30:00.000Z")).toBe("2026-09-17");
    // 2026-09-17 04:00 UTC is 2026-09-17 00:00 EDT.
    expect(businessDateOnly("2026-09-17T04:00:00.000Z")).toBe("2026-09-17");
    // EST (UTC-5): 2026-01-16 04:30 UTC is still 2026-01-15 23:30.
    expect(businessDateOnly("2026-01-16T04:30:00.000Z")).toBe("2026-01-15");
  });

  it("previews Effective Date as Florida/Eastern today and Expiration as addOneYear", () => {
    const beforeMidnightEdt = agreementDatePreview("2026-09-17T03:30:00.000Z");
    expect(beforeMidnightEdt.effectiveDate).toBe("2026-09-16");
    expect(beforeMidnightEdt.expirationDate).toBe(addOneYear("2026-09-16"));
    expect(beforeMidnightEdt.effectiveLong).toBe(formatLongDate("2026-09-16"));
    expect(beforeMidnightEdt.expirationLong).toBe(formatLongDate(addOneYear("2026-09-16")));
    expect(beforeMidnightEdt.effectiveLong).toBe("September 16, 2026");
    expect(beforeMidnightEdt.expirationLong).toBe("September 16, 2027");

    const afterMidnightEdt = agreementDatePreview("2026-09-17T04:00:00.000Z");
    expect(afterMidnightEdt.effectiveDate).toBe(businessDateOnly("2026-09-17T04:00:00.000Z"));
    expect(afterMidnightEdt.expirationDate).toBe(addOneYear("2026-09-17"));
    expect(afterMidnightEdt.effectiveLong).toBe("September 17, 2026");
    expect(afterMidnightEdt.expirationLong).toBe("September 17, 2027");
  });

  it("adds one calendar year with the existing Date setFullYear overflow policy", () => {
    expect(addOneYear("2024-02-29")).toBe("2025-03-01");
    expect(addOneYear("2028-02-29")).toBe("2029-03-01");
    expect(addOneYear("2024-02-28")).toBe("2025-02-28");
    expect(addOneYear("2026-12-31")).toBe("2027-12-31");
    expect(addOneYear("2026-01-01")).toBe("2027-01-01");
  });

  it("writes integer counts in words for paragraph 2", () => {
    expect(numberToWords(8)).toBe("eight");
    expect(numberToWords(21)).toBe("twenty-one");
  });
});
