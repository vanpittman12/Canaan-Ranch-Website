import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import { CANONICAL_HOST, SITE_ORIGIN, WWW_HOST, canonicalPath, wwwToApexUrl } from "./site";

const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
const robots = readFileSync(path.join(process.cwd(), "public/robots.txt"), "utf8");
const sitemap = readFileSync(path.join(process.cwd(), "public/sitemap.xml"), "utf8");
const notFound = readFileSync(path.join(process.cwd(), "app/not-found.tsx"), "utf8");
const intakeForm = readFileSync(path.join(process.cwd(), "components/intake-form.tsx"), "utf8");
const intakePage = readFileSync(path.join(process.cwd(), "app/intake/page.tsx"), "utf8");
const landing = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");

describe("public site SEO and copy hygiene", () => {
  it("canonicalizes www to the apex host", () => {
    expect(SITE_ORIGIN).toBe("https://canaanpreserve.com");
    expect(CANONICAL_HOST).toBe("canaanpreserve.com");
    expect(WWW_HOST).toBe("www.canaanpreserve.com");
    expect(canonicalPath("/")).toBe("https://canaanpreserve.com/");
    expect(canonicalPath("/intake")).toBe("https://canaanpreserve.com/intake");
    const redirected = wwwToApexUrl(new URL("https://www.canaanpreserve.com/intake?x=1"));
    expect(redirected?.toString()).toBe("https://canaanpreserve.com/intake?x=1");
    expect(wwwToApexUrl(new URL("http://localhost:3000/intake"))).toBeNull();
  });

  it("publishes Open Graph, Twitter, robots, and sitemap on the apex host", () => {
    expect(layout).toContain("metadataBase");
    expect(layout).toContain("openGraph");
    expect(layout).toContain("twitter");
    expect(layout).toContain("summary_large_image");
    expect(robots).toContain("Sitemap: https://canaanpreserve.com/sitemap.xml");
    expect(robots).toContain("Disallow: /admin");
    expect(sitemap).toContain("https://canaanpreserve.com/");
    expect(sitemap).toContain("https://canaanpreserve.com/intake");
    expect(sitemap).toContain("https://canaanpreserve.com/privacy");
    expect(sitemap).toContain("https://canaanpreserve.com/terms");
    expect(sitemap).not.toContain("www.canaanpreserve.com");
  });

  it("uses buyer-facing 404 and intake copy", () => {
    expect(notFound).not.toContain("engagement");
    expect(notFound).toContain("address");
    expect(intakeForm).toContain("before generating");
    expect(intakeForm).not.toContain("before generate.");
    expect(intakePage).toContain("We use these details to populate your relocation agreement");
    expect(intakePage).toContain('href="/privacy"');
    expect(landing).toContain("Canaan Preserve accepts, then sign");
    expect(landing).not.toContain("Canaan Preserve Accepts, then sign");
    expect(brand.heroSlogan).toContain("Long Term");
    expect(brand.flowInvite).toContain("Canaan Preserve accepts");
  });
});
