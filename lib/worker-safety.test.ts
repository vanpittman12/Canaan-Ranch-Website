import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const proxy = read("proxy.ts");
const nextConfig = read("next.config.ts");
const layout = read("app/layout.tsx");
const landing = read("app/page.tsx");
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
    for (const page of [landing, intake, privacy, terms]) {
      expect(page).toContain('export const dynamic = "force-static"');
    }
    expect(privacy).toContain('title: "Privacy"');
    expect(terms).toContain('title: "Terms"');
    expect(existsSync(path.join(root, "app/privacy/page.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "app/terms/page.tsx"))).toBe(true);
  });

  it("disables Link prefetch on public chrome so ?_rsc= does not SSR companion routes", () => {
    expect(header).toContain("prefetch={false}");
    expect(footer).toContain('href="/privacy"');
    expect(footer).toContain('href="/terms"');
    expect(footer).toContain('href="/admin/login"');
    expect(footer.match(/prefetch=\{false\}/g)?.length).toBeGreaterThanOrEqual(4);
    expect(landing.match(/prefetch=\{false\}/g)?.length).toBeGreaterThanOrEqual(2);
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
