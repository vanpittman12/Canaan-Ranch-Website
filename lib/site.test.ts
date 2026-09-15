import { existsSync, readFileSync } from "node:fs";
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
const adminLogin = readFileSync(path.join(process.cwd(), "app/admin/login/page.tsx"), "utf8");
const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
const nextConfig = readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");
const proxy = readFileSync(path.join(process.cwd(), "proxy.ts"), "utf8");
const footer = readFileSync(path.join(process.cwd(), "components/site-footer.tsx"), "utf8");

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
    expect(existsSync(path.join(process.cwd(), "app/opengraph-image.tsx"))).toBe(false);
    expect(layout).not.toContain("next/og");
    expect(robots).toContain("Sitemap: https://canaanpreserve.com/sitemap.xml");
    expect(robots).toContain("Disallow: /admin");
    expect(sitemap).toContain("https://canaanpreserve.com/");
    expect(sitemap).toContain("https://canaanpreserve.com/intake");
    expect(sitemap).toContain("https://canaanpreserve.com/privacy");
    expect(sitemap).toContain("https://canaanpreserve.com/terms");
    expect(readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8")).toContain(
      'source: "/privacy-policy"',
    );
    expect(readFileSync(path.join(process.cwd(), "public/_redirects"), "utf8")).toContain(
      "/privacy-policy /privacy 308",
    );
    expect(sitemap).not.toContain("www.canaanpreserve.com");
  });

  it("uses buyer-facing 404 and intake copy", () => {
    expect(notFound).not.toContain("engagement");
    expect(notFound).toContain("address");
    expect(notFound).toContain("This page is not on Canaan Preserve.");
    expect(notFound).toContain("Page not found");
    expect(notFound).not.toContain("That page is not on the preserve.");
    expect(intakeForm).toContain("Confirm these details.");
    expect(intakeForm).not.toContain("before the populated agreement is generated");
    expect(intakeForm).not.toContain("before generating");
    expect(intakeForm).not.toContain("before generate.");
    expect(intakePage).toContain("{brand.intakeCta}");
    expect(intakePage).not.toContain("Start relocation intake");
    expect(intakePage).toContain("After submission, download");
    expect(intakePage).not.toContain("After submit you download");
    expect(intakePage).toContain("We use these details to populate your relocation agreement");
    expect(intakePage).toContain('href="/privacy"');
    expect(existsSync(path.join(process.cwd(), "app/privacy/page.tsx"))).toBe(true);
    expect(existsSync(path.join(process.cwd(), "app/terms/page.tsx"))).toBe(true);
    expect(footer).toContain('href="/privacy"');
    expect(footer).toContain('href="/terms"');
    expect(nextConfig).toContain("/privacy-policy");
    expect(nextConfig).toContain('destination: "/privacy"');
    expect(proxy).toContain('"/privacy-policy"');
    expect(proxy).toContain("301");
    expect(landing).toContain("Canaan Preserve accepts, then sign");
    expect(landing).not.toContain("Canaan Preserve Accepts, then sign");
    expect(brand.heroSlogan).toContain("Long Term");
    expect(brand.flowInvite).toContain("Canaan Preserve accepts");
    expect(adminLogin).toContain("Sign in with the team password.");
    expect(adminLogin).not.toContain("canaan-admin");
    expect(adminLogin).not.toContain("ADMIN_PASSWORD");
    expect(adminLogin).not.toContain("README");
    expect(css).toContain(".pill-stack");
    expect(css).toContain(".pill-row");
    expect(css).toContain(".pill-row-end");
    expect(css).toContain("repeat(3, minmax(0, 1fr))");
    expect(css).toContain("repeat(2, minmax(0, 1fr))");
    expect(css).toContain("flex-wrap");
    expect(css).not.toMatch(/\.pill-row\s*\{[^}]*overflow-x:\s*auto/);
    expect(intakeForm).toContain('className="pill-stack"');
    expect(intakeForm).toContain("pill-row-end");
    expect(intakeForm).toContain("INTAKE_STEPS.slice(0, 3)");
    expect(intakeForm).toContain("INTAKE_STEPS.slice(3)");
  });
});
