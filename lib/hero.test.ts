import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import { HERO_PHOTO } from "./hero";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const homePage = read("components/home-page.tsx");
const homeRoute = read("app/page.tsx");
const photoHero = read("components/photo-savanna-hero.tsx");
const heroLib = read("lib/hero.ts");
const css = read("app/globals.css");
const nextConfig = read("next.config.ts");
const robots = read("public/robots.txt");
const sitemap = read("public/sitemap.xml");
const photoBytes = readFileSync(path.join(root, HERO_PHOTO.file));

function jpegSize(bytes: Buffer) {
  let index = 2;
  while (index < bytes.length - 8) {
    if (bytes[index] !== 0xff) {
      index += 1;
      continue;
    }
    const marker = bytes[index + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: bytes.readUInt16BE(index + 5), width: bytes.readUInt16BE(index + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) {
      index += 2;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      index += 2;
      continue;
    }
    const segmentLength = bytes.readUInt16BE(index + 2);
    index += 2 + segmentLength;
  }
  return { width: 0, height: 0 };
}

function walkFiles(dir: string, acc: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === ".next" ||
      entry.name === ".open-next"
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

describe("live homepage hero", () => {
  it("renders Option A shot 3 as the default homepage hero", () => {
    expect(homeRoute).toContain("<HomePage");
    expect(homeRoute).not.toContain('hero="a"');
    expect(homeRoute).not.toContain('hero="b"');
    expect(homePage).toContain("<PhotoSavannaHero");
    expect(homePage).not.toContain("SandhillHabitat");
    expect(homePage).not.toContain("LongleafHabitat");
    expect(homePage).not.toContain("HeroPreviewBar");
    expect(homePage).toContain("{brand.name}");
    expect(homePage).toContain("{brand.heroRecipientBadge}");
    expect(homePage).toContain("{brand.heroBody}");
    expect(homePage.match(/\{brand\.heroBody\}/g)).toHaveLength(1);
    expect(homePage).not.toContain("{brand.heroSlogan}");
    expect(homePage).not.toContain("{brand.heroLead}");
    expect(homePage).not.toContain("{brand.habitatLine}");
    expect(brand.heroRecipientBadge).toBe("Tier 1 Long Term Recipient Site");
    expect(brand.heroBody).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites have the lowest mitigation contributions, are best option for the tortoise and FWC’s preferred choice for relocations. Reserve capacity at this FWC Approved Tier 1 Long-Term site, download a signature-ready relocation agreement, and get a review before anything closes.",
    );
    expect(brand.heroSlogan).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
    );
    expect(brand.defaultPerGtRate).toBe(6000);
    expect(brand.juvenileRate).toBe(3000);
    expect(homePage).toContain("FWC Approved Tier 1");
    expect(homePage).toContain("Five steps from reserved capacity to a signed agreement.");
    expect(homePage).toContain("Start the five steps.");
    expect(homePage).toContain("Review the template");
    expect(homePage).toContain(
      "Download the blank gopher tortoise relocation agreement before you start intake. Review the highlighted fields — those are what you’ll provide, and we fill them into a signature-ready agreement.",
    );
    expect(homePage).toContain("Get your reservation letter");
    expect(homePage).toContain(
      "After you submit, DocuSign emails you to sign right away. Once the seller countersigns, we can issue your reservation letter — often the very same day.",
    );
    expect(homePage).not.toContain("Multi-Project Gopher Tortoise Relocation Agreement");
    expect(homePage).not.toContain("Four steps");
    expect(homePage).not.toContain("four steps");
  });

  it("ships Van’s shot 3 JPEG and never the rejected sunny file", () => {
    expect(HERO_PHOTO.fileName).toBe("option-a-shot3.jpg");
    expect(HERO_PHOTO.src).toBe("/hero/option-a-shot3.jpg");
    expect(HERO_PHOTO.file).toBe("public/hero/option-a-shot3.jpg");
    expect(existsSync(path.join(root, HERO_PHOTO.file))).toBe(true);
    expect(photoBytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
    const size = jpegSize(photoBytes);
    expect(size.width).toBe(HERO_PHOTO.width);
    expect(size.height).toBe(HERO_PHOTO.height);
    expect(size.height).toBeGreaterThan(size.width);
    expect(photoHero).toContain("HERO_PHOTO.src");
    expect(photoHero).toContain("option-a-shot3");
    expect(photoHero).toContain("shot 3");
    expect(photoHero).toContain("aa207a68");
    expect(photoHero).toContain("hero-photo");
    expect(photoHero).toContain("hero-photo-frame");
    expect(photoHero).toContain("hero-photo-scrim");
    expect(photoHero).not.toContain("QuietTortoise");
    expect(photoHero).not.toContain("longleaf-tortoise");
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("object-position: 55% 54%");
    expect(css).toContain("object-position: 50% 52%");
    expect(css).toContain(".hero-photo-frame");
    expect(css).not.toContain(".hero-preview-visual");
    expect(css).not.toContain(".habitat-sky");
    expect(css).not.toContain(".longleaf-tortoise");

    const repoNames = walkFiles(root).map((file) => path.relative(root, file));
    expect(repoNames.some((file) => file.includes("option-a-shot3.jpg"))).toBe(true);
    expect(repoNames.some((file) => /aa207a68/i.test(file))).toBe(false);
    expect(repoNames.some((file) => /van-sunny/i.test(file))).toBe(false);
    expect(repoNames.some((file) => /sunny-pine-savanna/i.test(file))).toBe(false);
    const textSurfaces = [homePage, homeRoute, photoHero, heroLib].join("\n");
    expect(textSurfaces).toContain("option-a-shot3");
    expect(textSurfaces).not.toMatch(/van-sunny-pine-savanna/);
    expect(textSurfaces.toLowerCase()).not.toContain("sunny-pine-savanna");
  });

  it("removes A/B preview scaffolding from the production path", () => {
    expect(existsSync(path.join(root, "app/preview"))).toBe(false);
    expect(existsSync(path.join(root, "components/hero-preview-bar.tsx"))).toBe(false);
    expect(existsSync(path.join(root, "components/longleaf-habitat.tsx"))).toBe(false);
    expect(existsSync(path.join(root, "components/sandhill-habitat.tsx"))).toBe(false);
    expect(existsSync(path.join(root, "lib/hero-preview.ts"))).toBe(false);
    expect(nextConfig).not.toContain('key: "hero"');
    expect(nextConfig).not.toContain("/preview/hero-a");
    expect(nextConfig).not.toContain("/preview/hero-b");
    expect(nextConfig).not.toContain("/?hero=");
    expect(robots).not.toContain("Disallow: /preview");
    expect(sitemap).not.toContain("/preview");
    expect(homePage).not.toContain("hero === ");
    expect(nextConfig.match(/source: "\/privacy-policy"/g)).toHaveLength(1);
  });
});
