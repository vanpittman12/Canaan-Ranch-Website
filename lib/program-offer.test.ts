import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import { programOfferCopy, programOfferItems } from "./program-offer";

const landing = readFileSync(path.join(process.cwd(), "components/home-page.tsx"), "utf8");
const offerModule = readFileSync(path.join(process.cwd(), "components/program-offer.tsx"), "utf8");
const offerLib = readFileSync(path.join(process.cwd(), "lib/program-offer.ts"), "utf8");

describe("What we offer", () => {
  it("lists Canaan program inclusions with adult and juvenile pricing", () => {
    expect(programOfferCopy.heading).toBe("What we offer");
    expect(programOfferCopy.intro).toBe("Our program includes:");
    expect(programOfferItems).toEqual([
      "Pricing: $6,000 per adult tortoise / $3,000 per juvenile tortoise.",
      "No deposit requirement.",
      "Mark, measure and transport of relocated tortoises.",
      "Permanently protected habitat within a conservation easement.",
    ]);
    expect(landing).toContain("<ProgramOffer");
    expect(landing.indexOf("<FwcSavingsModule")).toBeLessThan(landing.indexOf("<ProgramOffer"));
    expect(landing.indexOf("<ProgramOffer")).toBeLessThan(landing.indexOf('id="how-it-works"'));
    expect(offerModule).toContain('id="what-we-offer"');
  });

  it("does not add Lykes pricing or free juveniles", () => {
    const surfaces = [landing, offerModule, offerLib];
    for (const surface of surfaces) {
      expect(surface.toLowerCase()).not.toContain("lykes");
      expect(surface.toLowerCase()).not.toContain("free juvenile");
    }
    expect(offerModule).not.toContain("ServiceArea");
    expect(offerLib).not.toContain("ServiceArea");
    expect(programOfferItems.some((item) => /free/i.test(item))).toBe(false);
    expect(programOfferItems.join(" ")).toContain("$6,000");
    expect(programOfferItems.join(" ")).toContain("$3,000");
    expect(programOfferItems.join(" ")).not.toContain("$0");
  });

  it("keeps Van’s slogan and the FWC savings module", () => {
    expect(brand.heroSlogan).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
    );
    expect(landing.match(/\{brand\.heroSlogan\}/g)).toHaveLength(1);
    expect(landing).toContain("<FwcSavingsModule");
  });
});
