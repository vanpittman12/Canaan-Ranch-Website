import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";

const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");

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
  });

  it("links official FWC recipient-site guidance", () => {
    expect(brand.fwcRecipientSitesUrl).toBe(
      "https://myfwc.com/license/wildlife/gopher-tortoise-permits/recipient-sites/",
    );
  });
});
