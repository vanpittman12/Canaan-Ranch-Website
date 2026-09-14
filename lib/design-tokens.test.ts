import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import {
  BRAND_MARK_BYTE_LENGTH,
  BRAND_MARK_FILE,
  BRAND_MARK_FOREST,
  BRAND_MARK_GOLD,
  BRAND_MARK_SHA256,
  BRAND_MARK_SRC,
  BRAND_MARK_VIEWBOX,
} from "./brand-mark-asset";

const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
const intakePage = readFileSync(path.join(process.cwd(), "app/intake/page.tsx"), "utf8");
const footer = readFileSync(path.join(process.cwd(), "components/site-footer.tsx"), "utf8");
const signingPanel = readFileSync(
  path.join(process.cwd(), "components/signing-panel.tsx"),
  "utf8",
);
const timeline = readFileSync(
  path.join(process.cwd(), "components/engagement-timeline.tsx"),
  "utf8",
);
const mark = readFileSync(path.join(process.cwd(), "components/brand-mark.tsx"), "utf8");
const markAsset = readFileSync(path.join(process.cwd(), "lib/brand-mark-asset.ts"), "utf8");
const lockup = readFileSync(path.join(process.cwd(), "components/brand-lockup.tsx"), "utf8");
const header = readFileSync(path.join(process.cwd(), "components/site-header.tsx"), "utf8");
const habitat = readFileSync(path.join(process.cwd(), "components/sandhill-habitat.tsx"), "utf8");
const icon = readFileSync(path.join(process.cwd(), "app/icon.tsx"), "utf8");
const appleIcon = readFileSync(path.join(process.cwd(), "app/apple-icon.tsx"), "utf8");
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

  it("uses Van’s longleaf pine and wiregrass mark and recipient-site lockup", () => {
    const svg = readFileSync(path.join(process.cwd(), BRAND_MARK_FILE));
    expect(svg.byteLength).toBe(BRAND_MARK_BYTE_LENGTH);
    expect(createHash("sha256").update(svg).digest("hex")).toBe(BRAND_MARK_SHA256);
    expect(svg.includes(`viewBox="${BRAND_MARK_VIEWBOX}"`)).toBe(true);
    expect(svg.includes(BRAND_MARK_FOREST)).toBe(true);
    expect(svg.includes(BRAND_MARK_GOLD)).toBe(true);
    expect(markAsset).toContain(BRAND_MARK_SRC);
    expect(mark).toContain("BRAND_MARK_SRC");
    expect(mark).toContain("canaan-preserve");
    expect(mark).toContain("<img");
    expect(mark).not.toContain("longleaf-pine");
    expect(mark).not.toContain("PINE_TRUNK_PATH");
    expect(mark).not.toContain("gopher-tortoise");
    expect(mark).not.toContain("TORTOISE_");
    expect(icon).toContain("BRAND_MARK_DATA_URI");
    expect(icon).not.toContain("TORTOISE");
    expect(appleIcon).toContain("BRAND_MARK_DATA_URI");
    expect(markAsset).toContain(BRAND_MARK_FILE);
    expect(header).toContain("BrandLockup");
    expect(lockup).toContain("h-12 w-auto");
    expect(brand.lockupLine).toBe("Recipient site");
    expect(brand.habitatLine).toBe("The most ecologically pristine recipient site in Florida");
  });

  it("uses Van’s Florida hero line without a county", () => {
    for (const surface of marketingSurfaces) {
      expect(surface.toLowerCase()).not.toContain("pasco");
    }
    expect(brand.habitatLine).toBe("The most ecologically pristine recipient site in Florida");
    expect(brand.habitatLine).toContain("Florida");
    expect(brand.habitatLine.toLowerCase()).not.toMatch(/\bcounty\b/);
    expect(landing).toContain("{brand.habitatLine}");
    expect(landing).toContain("{brand.fwcValueProp}");
    expect(landing).toContain("{brand.intakeInvite}");
    expect(landing.match(/\{brand\.fwcValueProp\}/g)).toHaveLength(1);
    expect(landing).toContain("Word/DOCX");
    expect(landing).not.toContain("Download the PDF");
    expect(landing).toContain("DocuSign is the usual path");
    expect(landing).toContain("download the Word agreement and upload a signed copy");
    expect(landing.toLowerCase()).not.toContain("this demo");
    expect(landing.toLowerCase()).not.toContain("go-live");
    expect(signingPanel).toContain("DocuSign after Accept (usual path)");
    expect(signingPanel.toLowerCase()).not.toContain("this demo");
    expect(signingPanel.toLowerCase()).not.toContain("go-live");
    expect(timeline).toContain("DocuSign after Accept is the usual path");
    expect(timeline.toLowerCase()).not.toContain("this demo");
    expect(timeline.toLowerCase()).not.toContain("go-live");
    expect(landing).toContain("adult /");
    expect(landing).toContain("juvenile");
    expect(brand.fwcValueProp).toContain("FWC Approved Tier 1 Long-Term Recipient Site");
    expect(brand.fwcValueProp).toContain("signature-ready");
    expect(brand.fwcStatus).toContain("Long-Term");
    expect(brand.intakeInvite).toContain("intake form");
    expect(brand.intakeInvite).toContain("capacity reservation");
    expect(brand.intakeInvite).toContain("Accepts");
    expect(brand.intakeInvite).not.toContain("reservation letter");
    expect(intakePage).toContain("Have these agreement details ready");
    expect(intakePage).not.toContain("existing agreement details");
    expect(footer).toContain("is the contracting party");
    expect(footer).not.toContain("{brand.tagline}");
  });

  it("draws longleaf pine and wiregrass on the sandhill without a cartoon tortoise", () => {
    expect(habitat).toContain("Longleaf");
    expect(habitat).toContain("WiregrassClump");
    expect(habitat).not.toContain("HabitatTortoise");
    expect(habitat).not.toContain("Burrow");
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
