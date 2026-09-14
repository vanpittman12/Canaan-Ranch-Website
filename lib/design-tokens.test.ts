import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import { TORTOISE_SHELL_PATH } from "./tortoise-mark";

const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
const mark = readFileSync(path.join(process.cwd(), "components/brand-mark.tsx"), "utf8");
const header = readFileSync(path.join(process.cwd(), "components/site-header.tsx"), "utf8");
const habitat = readFileSync(path.join(process.cwd(), "components/sandhill-habitat.tsx"), "utf8");

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

  it("uses a gopher tortoise mark and recipient-site lockup", () => {
    expect(mark).toContain("gopher-tortoise");
    expect(mark).toContain("TORTOISE_SHELL_PATH");
    expect(mark).toContain("TORTOISE_SCUTE_PATHS");
    expect(TORTOISE_SHELL_PATH.startsWith("M")).toBe(true);
    expect(TORTOISE_SHELL_PATH.endsWith("Z")).toBe(true);
    expect(header).toContain("BrandLockup");
    expect(brand.lockupLine).toBe("Recipient site");
    expect(brand.habitatLine.toLowerCase()).toContain("longleaf");
    expect(brand.habitatLine.toLowerCase()).toContain("wiregrass");
  });

  it("draws longleaf pine, wiregrass, and a burrow on the sandhill", () => {
    expect(habitat).toContain("Longleaf");
    expect(habitat).toContain("WiregrassClump");
    expect(habitat).toContain("Burrow");
    expect(habitat).toContain("HabitatTortoise");
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
