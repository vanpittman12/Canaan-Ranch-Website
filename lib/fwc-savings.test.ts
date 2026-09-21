import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FwcSavingsMobileCards } from "@/components/fwc-savings-mobile-cards";
import { FwcSavingsModule } from "@/components/fwc-savings";
import { brand } from "./brand";
import {
  CANAAN_FWC_LEVEL,
  CANAAN_FWC_PER_ADDITIONAL_GT,
  FWC_SAVINGS_HERO_INSTEAD_OF,
  formatFwcPerGt,
  formatSavedPerGt,
  fwcSavingsColumnLabels,
  fwcSavingsCopy,
  fwcSavingsExample,
  fwcSavingsRows,
  isFwcSavingsHeroRow,
} from "./fwc-savings";

const landing = readFileSync(path.join(process.cwd(), "components/home-page.tsx"), "utf8");
const savingsModule = readFileSync(
  path.join(process.cwd(), "components/fwc-savings.tsx"),
  "utf8",
);
const mobileCards = readFileSync(
  path.join(process.cwd(), "components/fwc-savings-mobile-cards.tsx"),
  "utf8",
);

describe("FWC mitigation savings", () => {
  it("uses Van’s exact first-screen copy on the homepage", () => {
    expect(brand.heroBody).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites have the lowest mitigation contributions, are best option for the tortoise and FWC’s preferred choice for relocations. Reserve capacity at this FWC Approved Tier 1 Long-Term site, download a signature-ready relocation agreement, and get a review before anything closes.",
    );
    expect(brand.heroSlogan).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
    );
    expect(landing).toContain("{brand.heroBody}");
    expect(landing.match(/\{brand\.heroBody\}/g)).toHaveLength(1);
    expect(landing).toContain("<h1");
    expect(landing.indexOf("{brand.name}")).toBeLessThan(landing.indexOf("facts.map"));
    expect(landing.indexOf("{brand.heroBody}")).toBeLessThan(landing.indexOf("facts.map"));
    expect(landing).not.toContain("fwcValueProp");
    expect(landing).not.toContain("ecologically pristine");
    expect(landing).not.toContain("saving our clients money");
    expect(savingsModule).not.toContain("lowest mitigation");
    expect(savingsModule).not.toContain("saving our clients money");
  });

  it("places the savings module under the status/pricing strip", () => {
    expect(landing).toContain("<FwcSavingsModule");
    expect(landing.indexOf("facts.map")).toBeLessThan(landing.indexOf("<FwcSavingsModule"));
    expect(landing.indexOf("<FwcSavingsModule")).toBeLessThan(landing.indexOf('id="how-it-works"'));
    expect(savingsModule).toContain('id="fwc-savings"');
    expect(landing).toContain("grid-cols-2");
    expect(landing).toContain("md:grid-cols-4");
    expect(landing).not.toContain("sm:grid-cols-4");
    expect(landing).toContain("min-w-0");
    expect(landing).toContain("break-words");
    expect(landing).toContain("overflow-hidden");
    expect(landing).toContain("overflow-x-hidden");
    expect(mobileCards).toContain("overflow-hidden");
    expect(mobileCards).toContain("break-words");
    expect(savingsModule).toContain("overflow-x-hidden");
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
    expect(mobileCards.toLowerCase()).not.toContain("public conservation");
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
      "50 GT vs unprotected ≈ $356k FWC mitigation savings (50 × $7,126).",
    );
    expect(fwcSavingsCopy.example).not.toContain("≈ ~");
    expect(fwcSavingsExample.tortoiseCount * fwcSavingsExample.savedPerGt).toBe(356_300);
    expect(formatFwcPerGt(7545)).toBe("$7,545");
    expect(formatSavedPerGt(7126)).toBe("~$7,126");
    expect(fwcSavingsColumnLabels).toEqual({
      insteadOf: "Instead of",
      fwcPerGt: "FWC per GT",
      savedPerGt: "Saved per GT with Canaan",
    });
    expect(savingsModule).toContain("fwcSavingsColumnLabels.insteadOf");
    expect(savingsModule).toContain("fwcSavingsColumnLabels.fwcPerGt");
    expect(savingsModule).toContain("fwcSavingsColumnLabels.savedPerGt");
    expect(mobileCards).toContain("fwcSavingsColumnLabels.insteadOf");
    expect(mobileCards).toContain("fwcSavingsColumnLabels.fwcPerGt");
    expect(mobileCards).toContain("fwcSavingsColumnLabels.savedPerGt");
    expect(savingsModule).toContain("fwcSavingsCopy.siteFeesSeparate");
    expect(savingsModule).toContain("{brand.fwcRecipientSitesUrl}");
    expect(landing).toContain("adult /");
    expect(landing).toContain("juvenile");
  });

  it("SSRs one comparison table and mounts stacked cards only after hydration", () => {
    const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
    expect(FWC_SAVINGS_HERO_INSTEAD_OF).toBe("Unprotected");
    expect(fwcSavingsRows[0].insteadOf).toBe(FWC_SAVINGS_HERO_INSTEAD_OF);
    expect(fwcSavingsRows[0].savedPerGt).toBe(7126);
    expect(isFwcSavingsHeroRow(fwcSavingsRows[0])).toBe(true);
    expect(fwcSavingsRows.slice(1).every((row) => !isFwcSavingsHeroRow(row))).toBe(true);
    expect(savingsModule).toContain("<FwcSavingsMobileCards");
    expect(savingsModule).toContain("hidden md:block");
    expect(savingsModule).not.toContain("md:hidden");
    expect(savingsModule).not.toContain("<SavingsCard");
    expect(savingsModule).not.toContain("isFwcSavingsHeroRow");
    expect(savingsModule.match(/fwcSavingsRows\.map/g)).toHaveLength(1);
    expect(mobileCards).toContain('"use client"');
    expect(mobileCards).toContain("useState");
    expect(mobileCards).toContain("useEffect");
    expect(mobileCards).toContain("max-width: 767px");
    expect(mobileCards).toContain("<SavingsCard");
    expect(mobileCards).toContain("isFwcSavingsHeroRow");
    expect(mobileCards).toContain("bg-forest");
    expect(mobileCards).not.toContain("<table");
    expect(mobileCards).not.toContain("md:hidden");
    expect(mobileCards).not.toContain("hidden md:block");
    expect(savingsModule).not.toContain("fwc-savings-table");
    expect(savingsModule).not.toContain("fwc-savings-row-hero");
    expect(mobileCards).not.toContain("fwc-savings-table");
    expect(mobileCards).not.toContain("fwc-savings-row-hero");
    expect(savingsModule).not.toContain("overflow-x-auto");
    expect(mobileCards).not.toContain("overflow-x-auto");
    expect(savingsModule).not.toContain("min-w-[");
    expect(mobileCards).not.toContain("min-w-[");
    expect(savingsModule).not.toContain("sticky");
    expect(mobileCards).not.toContain("sticky");
    expect(css).not.toContain(".fwc-savings-table");
    expect(css).not.toContain(".fwc-savings-row-hero");

    const html = renderToStaticMarkup(createElement(FwcSavingsModule));
    expect(html).toContain("<table");
    expect(html.match(/<table/g)).toHaveLength(1);
    expect(html).not.toContain("<article");
    expect(html).not.toContain("<ul");
    expect(renderToStaticMarkup(createElement(FwcSavingsMobileCards))).toBe("");
  });

  it("does not use demo or go-live language on the savings surfaces", () => {
    expect(landing.toLowerCase()).not.toContain("this demo");
    expect(landing.toLowerCase()).not.toContain("go-live");
    expect(savingsModule.toLowerCase()).not.toContain("this demo");
    expect(savingsModule.toLowerCase()).not.toContain("go-live");
    expect(mobileCards.toLowerCase()).not.toContain("this demo");
    expect(mobileCards.toLowerCase()).not.toContain("go-live");
    expect(fwcSavingsCopy.heading.toLowerCase()).not.toContain("demo");
    expect(fwcSavingsCopy.footnote.toLowerCase()).not.toContain("demo");
  });
});
