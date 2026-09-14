import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import { PINE_NEEDLE_PATHS, PINE_TRUNK_PATH, WIREGRASS_PATHS } from "./pine-mark";

const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
const mark = readFileSync(path.join(process.cwd(), "components/brand-mark.tsx"), "utf8");
const header = readFileSync(path.join(process.cwd(), "components/site-header.tsx"), "utf8");
const habitat = readFileSync(path.join(process.cwd(), "components/sandhill-habitat.tsx"), "utf8");
const icon = readFileSync(path.join(process.cwd(), "app/icon.svg"), "utf8");
const marketingSurfaces = [landing, habitat, mark, header, icon, brand.habitatLine];

describe("site builder visual lock", () => {
  it("retunes CSS tokens to the locked palette", () => {
    expect(css).toContain("--paper: #f7f1e6");
    expect(css).toContain("--cream: #efe6d4");
    expect(css).toContain("--wheat: #e0d0b4");
    expect(css).toContain("--line: #d2c4a8");
    expect(css).toContain("--ink: #1a1712");
    expect(css).toContain("--muted: #6a6156");
    expect(css).toContain("--forest: #24352a");
    expect(css).toContain("--forest-deep: #16241c");
    expect(css).toContain("--sage: #7a8f6a");
    expect(css).toContain("--brass: #c4a15a");
    expect(css).toContain("--terracotta: #9c4b32");
    expect(css).toContain("--white: #fffcf7");
    expect(css).toContain('--focus-ring: 2px solid var(--brass)');
    expect(css).toContain("--target: 44px");
    expect(css).toContain("opsz");
    expect(css.toLowerCase()).not.toContain("#1b3328");
  });

  it("removes HorizonArt hills from the landing hero", () => {
    expect(landing).not.toContain("HorizonArt");
    expect(landing).toContain("SandhillHabitat");
    expect(landing).toContain("habitatLine");
  });

  it("uses a longleaf pine and wiregrass mark and recipient-site lockup", () => {
    expect(mark).toContain("longleaf-pine");
    expect(mark).toContain("PINE_TRUNK_PATH");
    expect(mark).toContain("PINE_NEEDLE_PATHS");
    expect(mark).toContain("WIREGRASS_PATHS");
    expect(mark).not.toContain("gopher-tortoise");
    expect(mark).not.toContain("TORTOISE_");
    expect(PINE_TRUNK_PATH.startsWith("M")).toBe(true);
    expect(PINE_NEEDLE_PATHS.length).toBeGreaterThanOrEqual(5);
    expect(WIREGRASS_PATHS.length).toBeGreaterThanOrEqual(3);
    expect(icon).toContain("M32 16 V46");
    expect(icon).not.toContain("TORTOISE");
    expect(header).toContain("BrandLockup");
    expect(brand.lockupLine).toBe("Recipient site");
    expect(brand.habitatLine.toLowerCase()).toContain("florida");
    expect(brand.habitatLine.toLowerCase()).toContain("longleaf");
    expect(brand.habitatLine.toLowerCase()).toContain("wiregrass");
  });

  it("does not invent a Pasco County marketing location", () => {
    for (const surface of marketingSurfaces) {
      expect(surface.toLowerCase()).not.toContain("pasco");
    }
    expect(brand.habitatLine.toLowerCase()).not.toMatch(/\bcounty\b/);
  });

  it("draws longleaf pine and wiregrass on the sandhill without a cartoon tortoise", () => {
    expect(habitat).toContain("Longleaf");
    expect(habitat).toContain("WiregrassClump");
    expect(habitat).not.toContain("HabitatTortoise");
    expect(habitat).not.toContain("Pasco");
    expect(css).toContain(".habitat-sky");
    expect(css).toContain(".habitat-ground");
    expect(css).toContain(".habitat-scrim");
  });

  it("links official FWC recipient-site guidance", () => {
    expect(brand.fwcRecipientSitesUrl).toBe(
      "https://myfwc.com/license/wildlife/gopher-tortoise-permits/recipient-sites/",
    );
  });
});
