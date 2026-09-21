import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { brand } from "./brand";
import {
  HERO_OPTION_A_PHOTO,
  HERO_PREVIEW,
  HERO_PREVIEW_ROUTES,
} from "./hero-preview";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const homePage = read("components/home-page.tsx");
const homeRoute = read("app/page.tsx");
const photoHero = read("components/photo-savanna-hero.tsx");
const longleaf = read("components/longleaf-habitat.tsx");
const previewBar = read("components/hero-preview-bar.tsx");
const previewA = read("app/preview/hero-a/page.tsx");
const previewB = read("app/preview/hero-b/page.tsx");
const css = read("app/globals.css");
const nextConfig = read("next.config.ts");
const robots = read("public/robots.txt");
const sitemap = read("public/sitemap.xml");
const photoBytes = readFileSync(path.join(root, HERO_OPTION_A_PHOTO.file));

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

describe("hero A/B preview", () => {
  it("keeps the live homepage on the current sandhill hero", () => {
    expect(homeRoute).toContain("<HomePage");
    expect(homeRoute).not.toContain('hero="a"');
    expect(homeRoute).not.toContain('hero="b"');
    expect(homeRoute).not.toContain("PhotoSavannaHero");
    expect(homeRoute).not.toContain("LongleafHabitat");
    expect(homePage).toContain("<SandhillHabitat");
    expect(homePage).toContain('hero === "a"');
    expect(homePage).toContain('hero === "b"');
    expect(homePage).toContain("{brand.heroSlogan}");
    expect(homePage.match(/\{brand\.heroSlogan\}/g)).toHaveLength(1);
    expect(brand.heroSlogan).toBe(
      "Don’t slow your project down - Long Term Tier 1 sites are the best option for the tortoise and therefore FWC’s preferred choice for relocations.",
    );
    expect(brand.defaultPerGtRate).toBe(6000);
    expect(brand.juvenileRate).toBe(3000);
  });

  it("uses Van’s shot 3 JPEG for Option A and never the rejected sunny file", () => {
    expect(HERO_OPTION_A_PHOTO.fileName).toBe("option-a-shot3.jpg");
    expect(HERO_OPTION_A_PHOTO.src).toBe("/hero/option-a-shot3.jpg");
    expect(HERO_OPTION_A_PHOTO.file).toBe("public/hero/option-a-shot3.jpg");
    expect(existsSync(path.join(root, HERO_OPTION_A_PHOTO.file))).toBe(true);
    expect(photoBytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);
    const size = jpegSize(photoBytes);
    expect(size.width).toBe(HERO_OPTION_A_PHOTO.width);
    expect(size.height).toBe(HERO_OPTION_A_PHOTO.height);
    expect(size.height).toBeGreaterThan(size.width);
    expect(photoHero).toContain("HERO_OPTION_A_PHOTO.src");
    expect(photoHero).toContain("option-a-shot3");
    expect(photoHero).toContain("shot 3");
    expect(photoHero).toContain("aa207a68");
    expect(photoHero).toContain("hero-photo");
    expect(photoHero).toContain("hero-photo-scrim");
    expect(photoHero).not.toContain("QuietTortoise");
    expect(photoHero).not.toContain("longleaf-tortoise");
    expect(css).toContain("object-fit: cover");
    expect(css).toContain("object-position: 55% 54%");
    expect(css).toContain("object-position: 50% 52%");
    expect(css).toContain(".hero-preview-visual");
    expect(photoHero).toContain("hero-preview-visual");
    expect(previewA).toContain('hero="a"');
    expect(previewA).toContain("Hero preview A");
    expect(previewA).toContain("index: false");

    const repoNames = walkFiles(root).map((file) => path.relative(root, file));
    expect(repoNames.some((file) => file.includes("option-a-shot3.jpg"))).toBe(true);
    expect(repoNames.some((file) => /aa207a68/i.test(file))).toBe(false);
    expect(repoNames.some((file) => /van-sunny/i.test(file))).toBe(false);
    expect(repoNames.some((file) => /sunny-pine-savanna/i.test(file))).toBe(false);
    const textSurfaces = [
      homePage,
      homeRoute,
      photoHero,
      longleaf,
      previewBar,
      previewA,
      previewB,
      read("lib/hero-preview.ts"),
    ].join("\n");
    expect(textSurfaces).toContain("option-a-shot3");
    expect(textSurfaces).not.toMatch(/van-sunny-pine-savanna/);
    expect(textSurfaces.toLowerCase()).not.toContain("sunny-pine-savanna");
  });

  it("rebuilds Option B as sparse longleaf with a quiet lower-right tortoise", () => {
    expect(previewB).toContain('hero="b"');
    expect(homePage).toContain("LongleafHabitat");
    expect(longleaf).toContain("SparsePine");
    expect(longleaf).toContain("WiregrassClump");
    expect(longleaf).toContain("QuietTortoise");
    expect(longleaf).toContain("longleaf-tortoise");
    expect(css).toContain(".hero-preview-visual");
    expect(longleaf).toContain("hero-preview-visual");
    expect(css).toContain(".longleaf-sky");
    expect(css).toContain(".longleaf-ground");
    expect(css).toContain(".longleaf-scrim");
    expect(css).toContain(".longleaf-tortoise");
    expect(css).toContain("right: 8%");
    expect(css).toContain("bottom: 28%");
    expect(css).toContain("width: 6.75rem");
    expect(css).toContain("right: 4%");
    expect(css).toContain("bottom: 56%");
    expect(css).toContain("width: 4.85rem");
    expect(longleaf).toContain("#3A3224");
    expect(longleaf).toContain('opacity="0.92"');
    expect(longleaf).not.toContain("translate(1288 400)");
    expect(longleaf).not.toContain("translate(1136 408)");
    expect(photoHero).not.toContain("QuietTortoise");
    expect(read("components/sandhill-habitat.tsx")).not.toContain("QuietTortoise");
  });

  it("exposes preview routes, query redirects, and a toggle without indexing", () => {
    expect(HERO_PREVIEW_ROUTES.a).toBe("/preview/hero-a");
    expect(HERO_PREVIEW_ROUTES.b).toBe("/preview/hero-b");
    expect(HERO_PREVIEW.a.query).toBe("/?hero=a");
    expect(HERO_PREVIEW.b.query).toBe("/?hero=b");
    expect(nextConfig).toContain('key: "hero"');
    expect(nextConfig).toContain('value: "a"');
    expect(nextConfig).toContain('value: "b"');
    expect(nextConfig).toContain('destination: "/preview/hero-a"');
    expect(nextConfig).toContain('destination: "/preview/hero-b"');
    expect(previewBar).toContain("href={option.href}");
    expect(read("lib/hero-preview.ts")).toContain('href: "/preview/hero-a"');
    expect(robots).toContain("Disallow: /preview");
    expect(sitemap).not.toContain("/preview/hero");
    expect(previewA).toContain("index: false");
    expect(previewB).toContain("index: false");
  });
});
