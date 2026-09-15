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
const intakeForm = readFileSync(path.join(process.cwd(), "components/intake-form.tsx"), "utf8");
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
const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
const marketingSurfaces = [landing, habitat, mark, header, layout, brand.habitatLine];

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
    expect(layout).toContain("BRAND_MARK_SRC");
    expect(layout).toContain("image/svg+xml");
    expect(layout).not.toContain("next/og");
    expect(markAsset).not.toContain("BRAND_MARK_DATA_URI");
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
    expect(landing).toContain("{brand.heroSlogan}");
    expect(landing).toContain("{brand.heroLead}");
    expect(landing).toContain("{brand.flowInvite}");
    expect(landing.match(/\{brand\.heroSlogan\}/g)).toHaveLength(1);
    expect(landing.match(/\{brand\.heroLead\}/g)).toHaveLength(1);
    expect(landing.match(/\{brand\.flowInvite\}/g)).toHaveLength(1);
    expect(landing).toContain("FwcSavingsModule");
    expect(landing).toContain("ProgramOffer");
    expect(landing).toContain("ServiceAreaMap");
    expect(landing).not.toContain("Start relocation intake for a clear recipient-site agreement.");
    expect(landing).toContain("{brand.intakeCta}");
    expect(header).toContain("{brand.intakeCta}");
    expect(header).toContain("shrink-0 overflow-visible whitespace-nowrap");
    expect(header).toContain("px-3.5");
    expect(header).not.toContain("!px-3");
    expect(header).toContain("xl:inline-flex");
    expect(footer).toContain("{brand.intakeCta}");
    expect(brand.intakeCta).toBe("Start intake");
    expect(landing).not.toContain("Start relocation intake");
    expect(header).not.toContain("Start relocation intake");
    expect(footer).not.toContain("Start relocation intake");
    expect(intakePage).toContain("{brand.intakeCta}");
    expect(intakePage).not.toContain("Start relocation intake");
    expect(landing).not.toContain("is the contracting party. Intake produces");
    expect(landing).not.toContain("reservation letter");
    expect(landing).toContain("Word/DOCX");
    expect(landing).not.toContain("Download the PDF");
    expect(landing).toContain("DocuSign is the usual signing path");
    expect(landing).toContain("download the Word agreement and upload a signed copy");
    expect(landing).not.toContain("when available");
    expect(landing.toLowerCase()).not.toContain("this demo");
    expect(landing.toLowerCase()).not.toContain("go-live");
    expect(signingPanel).toContain("DocuSign after Accept (usual signing path)");
    expect(signingPanel).toContain("The fallback is to download the Word agreement");
    expect(signingPanel).not.toContain("when available");
    expect(signingPanel.toLowerCase()).not.toContain("this demo");
    expect(signingPanel.toLowerCase()).not.toContain("go-live");
    expect(timeline).toContain("DocuSign after Accept is the usual signing path");
    expect(timeline).toContain("The fallback is to download the Word agreement");
    expect(timeline.toLowerCase()).not.toContain("this demo");
    expect(timeline.toLowerCase()).not.toContain("go-live");
    expect(landing).toContain("adult /");
    expect(landing).toContain("juvenile");
    expect(landing).toContain("FWC Approved Tier 1");
    expect(brand.heroSlogan).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
    );
    expect(brand.heroSlogan).toContain("Long Term Tier 1");
    expect(brand.heroLead).toMatch(/^[A-Z].*\.$/);
    expect(brand.heroLead).toContain("FWC Approved Tier 1 Long-Term");
    expect(brand.heroLead).toContain("signature-ready");
    expect(brand.heroLead).toContain("human review before anything closes");
    expect(brand.heroLead).not.toContain("reservation letter");
    expect(brand.flowInvite).toContain("Review the template");
    expect(brand.flowInvite).toContain("complete intake");
    expect(brand.flowInvite).toContain("signature-ready");
    expect(brand.flowInvite).toContain("DocuSign is the usual signing path");
    expect(landing).not.toContain("lowest mitigation");
    expect(landing).not.toContain("saving our clients money");
    expect(landing).not.toContain("signature ready");
    expect(brand.fwcStatus).toContain("Long-Term");
    expect(brand.fwcStatus).toContain("FWC Approved Tier 1");
    expect(intakePage).toContain("Have these agreement details ready");
    expect(intakePage).not.toContain("existing agreement details");
    expect(intakePage).not.toContain("Have these existing agreement details ready");
    expect(intakePage).toContain("The Effective Date is the date the Buyer signs");
    expect(intakePage).toContain(
      "The Expiration Date is one year after the Buyer Date Signed / Effective",
    );
    expect(intakeForm).toContain("The Expiration Date is one year");
    expect(intakeForm).toContain("Buyer Date Signed / Effective Date.");
    expect(landing.match(/\{brand\.heroSlogan\}/g)).toHaveLength(1);
    expect(footer).toContain("{brand.footerLine}");
    expect(footer).toContain("brandMailtoHref");
    expect(footer).toContain("brandTelHref");
    expect(footer).toContain('href="/privacy"');
    expect(footer).toContain('href="/terms"');
    expect(footer).not.toContain("A Canaan Ranch LLP recipient site");
    expect(footer).not.toContain("Gopher tortoise relocation recipient site.");
    expect(footer).not.toContain("{brand.tagline}");
    expect(brand.footerLine).toBe(
      "Canaan Ranch LLP operates this FWC Approved Tier 1 Long-Term recipient site.",
    );
    const depositsRequiredHits = [landing, intakePage, intakeForm].flatMap((surface) =>
      surface.match(/No deposits required/g) ?? [],
    );
    expect(depositsRequiredHits).toHaveLength(1);
    expect(intakeForm).toContain("No deposits required");
    expect(landing).not.toContain("No deposits required");
    expect(intakePage).not.toContain("No deposits required");
    const marketingCopy = [
      landing,
      intakePage,
      footer,
      brand.heroLead,
      brand.flowInvite,
      brand.footerLine,
      brand.fwcStatus,
      brand.fwcBadge,
    ].join("\n");
    expect(marketingCopy).not.toMatch(/signature ready(?!-)/);
    expect(marketingCopy.replaceAll(brand.heroSlogan, "")).not.toMatch(/Long Term/);
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

  it("links official FWC mitigation table for Tier 1 value", () => {
    expect(brand.fwcRecipientSitesUrl).toBe(
      "https://myfwc.com/license/wildlife/gopher-tortoise-permits/mitigation/#table",
    );
    expect(brand.fwcMitigationLinkLabel).toBe("Why Tier 1 matters (FWC mitigation)");
    expect(landing).toContain("{brand.fwcRecipientSitesUrl}");
    expect(header).toContain("{brand.fwcRecipientSitesUrl}");
    expect(footer).toContain("{brand.fwcRecipientSitesUrl}");
    expect(landing).toContain("{brand.fwcMitigationLinkLabel}");
    expect(header).toContain("{brand.fwcMitigationLinkLabel}");
    expect(footer).toContain("{brand.fwcMitigationLinkLabel}");
    expect(landing).not.toContain("recipient-sites/");
    expect(header).not.toContain("FWC sites");
    expect(footer).not.toContain("FWC recipient-site guidance");
  });
});
