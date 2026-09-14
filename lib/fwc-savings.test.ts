import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import {
  CANAAN_FWC_LEVEL,
  CANAAN_FWC_PER_ADDITIONAL_GT,
  formatFwcPerGt,
  formatSavedPerGt,
  fwcSavingsCopy,
  fwcSavingsExample,
  fwcSavingsRows,
} from "./fwc-savings";

const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
const savingsModule = readFileSync(
  path.join(process.cwd(), "components/fwc-savings.tsx"),
  "utf8",
);

describe("FWC mitigation savings", () => {
  it("uses Van’s exact hero slogan on the homepage", () => {
    expect(brand.heroSlogan).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
    );
    expect(landing).toContain("{brand.heroSlogan}");
    expect(landing.match(/\{brand\.heroSlogan\}/g)).toHaveLength(1);
    expect(landing).toContain("<h1");
    expect(landing.indexOf("{brand.heroSlogan}")).toBeLessThan(landing.indexOf("facts.map"));
    expect(landing).not.toContain("fwcValueProp");
    expect(landing).not.toContain("lowest mitigation");
    expect(landing).not.toContain("saving our clients money");
    expect(savingsModule).not.toContain("lowest mitigation");
    expect(savingsModule).not.toContain("saving our clients money");
  });

  it("places the savings module under the status/pricing strip", () => {
    expect(landing).toContain("<FwcSavingsModule");
    expect(landing.indexOf("facts.map")).toBeLessThan(landing.indexOf("<FwcSavingsModule"));
    expect(landing.indexOf("<FwcSavingsModule")).toBeLessThan(landing.indexOf('id="how-it-works"'));
    expect(savingsModule).toContain('id="fwc-savings"');
  });

  it("shows Van’s per-GT FWC schedule without public conservation", () => {
    expect(CANAAN_FWC_LEVEL).toBe("Long-Term Level 1");
    expect(CANAAN_FWC_PER_ADDITIONAL_GT).toBe(419);
    expect(fwcSavingsRows).toEqual([
      { insteadOf: "Unprotected", fwcPerGt: 7545, savedPerGt: 7126 },
      { insteadOf: "Short-term Level 3", fwcPerGt: 4193, savedPerGt: 3774 },
      { insteadOf: "Short-term Level 2", fwcPerGt: 2515, savedPerGt: 2096 },
      { insteadOf: "Short-term Level 1", fwcPerGt: 1257, savedPerGt: 838 },
      { insteadOf: "Long-Term Level 2", fwcPerGt: 838, savedPerGt: 419 },
    ]);
    for (const row of fwcSavingsRows) {
      expect(row.savedPerGt).toBe(row.fwcPerGt - CANAAN_FWC_PER_ADDITIONAL_GT);
    }
    expect(fwcSavingsRows.some((row) => /public conservation/i.test(row.insteadOf))).toBe(
      false,
    );
    expect(landing.toLowerCase()).not.toContain("public conservation");
    expect(savingsModule.toLowerCase()).not.toContain("public conservation");
    expect(JSON.stringify(fwcSavingsRows).toLowerCase()).not.toContain("public conservation");
  });

  it("labels every figure per gopher tortoise and keeps site fees separate", () => {
    expect(fwcSavingsCopy.perGtLabel).toBe("All figures are per gopher tortoise (per GT).");
    expect(fwcSavingsCopy.perGtNote).toBe(
      "Savings shown per gopher tortoise. Multiply by your count — project totals are often much higher.",
    );
    expect(fwcSavingsCopy.siteFeesSeparate).toBe(
      "Canaan site fees ($6,000 adult / $3,000 juvenile) are separate from this FWC mitigation contribution.",
    );
    expect(fwcSavingsCopy.footnote).toBe(
      "Illustrative from FWC conservation contribution schedule (additional tortoise after first five / >10 burrows); exact level depends on classification.",
    );
    expect(fwcSavingsCopy.example).toBe(
      "50 GT vs unprotected ≈ ~$356k FWC mitigation savings (50 × $7,126).",
    );
    expect(fwcSavingsExample.tortoiseCount * fwcSavingsExample.savedPerGt).toBe(356_300);
    expect(formatFwcPerGt(7545)).toBe("$7,545");
    expect(formatSavedPerGt(7126)).toBe("~$7,126");
    expect(savingsModule).toContain("Instead of");
    expect(savingsModule).toContain("FWC per GT");
    expect(savingsModule).toContain("Saved per GT with Canaan");
    expect(savingsModule).toContain("fwcSavingsCopy.siteFeesSeparate");
    expect(savingsModule).toContain("{brand.fwcRecipientSitesUrl}");
    expect(landing).toContain("adult /");
    expect(landing).toContain("juvenile");
  });

  it("does not use demo or go-live language on the savings surfaces", () => {
    expect(landing.toLowerCase()).not.toContain("this demo");
    expect(landing.toLowerCase()).not.toContain("go-live");
    expect(savingsModule.toLowerCase()).not.toContain("this demo");
    expect(savingsModule.toLowerCase()).not.toContain("go-live");
    expect(fwcSavingsCopy.heading.toLowerCase()).not.toContain("demo");
    expect(fwcSavingsCopy.footnote.toLowerCase()).not.toContain("demo");
  });
});
