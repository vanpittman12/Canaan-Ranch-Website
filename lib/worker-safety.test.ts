import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const proxy = read("proxy.ts");
const nextConfig = read("next.config.ts");
const openNextConfig = read("open-next.config.ts");
const wrangler = read("wrangler.jsonc");
const redirects = read("public/_redirects");
const ensureLegal = read("scripts/ensure-legal-routes.mjs");
const layout = read("app/layout.tsx");
const landing = read("app/page.tsx");
const homePage = read("components/home-page.tsx");
const heroPreviewA = read("app/preview/hero-a/page.tsx");
const heroPreviewB = read("app/preview/hero-b/page.tsx");
const intake = read("app/intake/page.tsx");
const privacy = read("app/privacy/page.tsx");
const terms = read("app/terms/page.tsx");
const header = read("components/site-header.tsx");
const footer = read("components/site-footer.tsx");
const map = read("components/service-area-map.tsx");
const savings = read("components/fwc-savings.tsx");
const mobileCards = read("components/fwc-savings-mobile-cards.tsx");

describe("Worker-safe public routes", () => {
  it("keeps the Next proxy matcher on admin paths only", () => {
    expect(proxy).toContain('matcher: ["/admin", "/admin/:path*"]');
    expect(proxy).not.toContain("_next/static");
    expect(proxy).not.toContain("favicon.ico");
  });

  it("canonicalizes www on the apex host without a site-wide proxy", () => {
    expect(nextConfig).toContain('value: "www.canaanpreserve.com"');
    expect(nextConfig).toContain("https://canaanpreserve.com/:path*");
    expect(nextConfig).toContain('destination: "https://canaanpreserve.com/"');
  });

  it("does not ship next/og ImageResponse into the Worker", () => {
    expect(existsSync(path.join(root, "app/icon.tsx"))).toBe(false);
    expect(existsSync(path.join(root, "app/apple-icon.tsx"))).toBe(false);
    expect(existsSync(path.join(root, "app/opengraph-image.tsx"))).toBe(false);
    expect(layout).not.toContain("next/og");
    expect(layout).not.toContain("ImageResponse");
    expect(layout).toContain("BRAND_MARK_SRC");
    expect(read("lib/brand-mark-asset.ts")).not.toContain("BRAND_MARK_DATA_URI");
  });

  it("keeps marketing pages static and restores privacy/terms stubs", () => {
    for (const page of [landing, intake, privacy, terms, heroPreviewA, heroPreviewB]) {
      expect(page).toContain('export const dynamic = "force-static"');
    }
    expect(landing).toContain("<HomePage");
    expect(landing).not.toContain('hero="a"');
    expect(landing).not.toContain('hero="b"');
    expect(homePage).toContain("<SandhillHabitat");
    expect(heroPreviewA).toContain('hero="a"');
    expect(heroPreviewB).toContain('hero="b"');
    expect(privacy).toContain('title: "Privacy"');
    expect(terms).toContain('title: "Terms"');
    expect(privacy).toContain("pageShareMetadata");
    expect(privacy).toContain("PRIVACY_DESCRIPTION");
    expect(terms).toContain("pageShareMetadata");
    expect(terms).toContain("TERMS_DESCRIPTION");
    expect(existsSync(path.join(root, "app/privacy/page.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "app/terms/page.tsx"))).toBe(true);
    expect(privacy).not.toContain("cookies(");
    expect(privacy).not.toContain("headers(");
    expect(terms).not.toContain("cookies(");
    expect(terms).not.toContain("headers(");
    expect(read("components/legal-page.tsx")).not.toContain("cookies(");
    expect(read("components/legal-page.tsx")).not.toContain("headers(");
  });

  it("mounts intake Effective/Expiration preview after hydration, not in static HTML", () => {
    const intakeForm = read("components/intake-form.tsx");
    expect(intake).toContain('export const dynamic = "force-static"');
    expect(intakeForm).toContain("function IntakeAgreementDates()");
    expect(intakeForm).toContain("setPreview(agreementDatePreview())");
    expect(intakeForm).not.toContain("const datePreview = agreementDatePreview()");
    expect(intakeForm).toContain('{preview?.effectiveLong ?? "—"}');
    expect(intakeForm).toContain('{preview?.expirationLong ?? "—"}');
  });

  it("ships privacy/terms through OpenNext assets instead of the dummy cache", () => {
    expect(openNextConfig).toContain("static-assets-incremental-cache");
    expect(openNextConfig).toContain("incrementalCache: staticAssetsIncrementalCache");
    expect(wrangler).toContain('"html_handling": "auto-trailing-slash"');
    expect(ensureLegal).toContain('LEGAL_ROUTES = ["privacy", "terms"]');
    expect(ensureLegal).toContain("copyFileSync(htmlSrc, path.join(assetsDir, `${route}.html`))");
    expect(nextConfig).toContain('source: "/privacy-policy"');
    expect(nextConfig).toContain('destination: "/privacy"');
    expect(redirects).toContain("/privacy-policy /privacy 308");
  });

  it("asserts privacy/terms HTML is in the OpenNext Worker assets after cf:build", () => {
    if (!existsSync(path.join(root, ".open-next/assets"))) {
      return;
    }
    execFileSync(process.execPath, [path.join(root, "scripts/ensure-legal-routes.mjs")], {
      cwd: root,
    });
    const privacyHtml = read(".open-next/assets/privacy.html");
    const termsHtml = read(".open-next/assets/terms.html");
    expect(privacyHtml).toContain("<title>Privacy · Canaan Preserve</title>");
    expect(privacyHtml).toContain("This page is a short summary, not a complete privacy policy.");
    expect(termsHtml).toContain("<title>Terms · Canaan Preserve</title>");
    expect(termsHtml).toContain("This page is a short summary, not a complete terms of use.");
    expect(existsSync(path.join(root, ".open-next/assets/cdn-cgi/_next_cache"))).toBe(true);
  });

  it("disables Link prefetch on public chrome so ?_rsc= does not SSR companion routes", () => {
    expect(header).toContain("prefetch={false}");
    expect(footer).toContain('href="/privacy"');
    expect(footer).toContain('href="/terms"');
    expect(footer).toContain('href="/admin/login"');
    expect(footer.match(/prefetch=\{false\}/g)?.length).toBeGreaterThanOrEqual(4);
    expect(homePage.match(/prefetch=\{false\}/g)?.length).toBeGreaterThanOrEqual(2);
    expect(intake).toContain("prefetch={false}");
  });

  it("serves the Florida basemap as a static img, not next/image", () => {
    expect(map).not.toContain('from "next/image"');
    expect(map).toContain("<img");
    expect(map).toContain("BASEMAP.src");
  });

  it("keeps a single FWC SSR table with client-mounted mobile cards", () => {
    expect(savings).toContain("<FwcSavingsMobileCards");
    expect(savings).toContain("<table");
    expect(savings).not.toContain("md:hidden");
    expect(mobileCards).toContain('"use client"');
    expect(mobileCards).toContain("max-width: 767px");
  });
});
