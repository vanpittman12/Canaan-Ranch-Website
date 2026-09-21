export const HERO_VISUALS = ["live", "a", "b"] as const;
export type HeroVisual = (typeof HERO_VISUALS)[number];

/** Van’s Option A source: shot 3. Never the rejected sunny aa207a68 JPEG. */
export const HERO_OPTION_A_PHOTO = {
  fileName: "option-a-shot3.jpg",
  src: "/hero/option-a-shot3.jpg",
  file: "public/hero/option-a-shot3.jpg",
  width: 1600,
  height: 2133,
  alt: "Overcast longleaf pine savanna with a young green sapling standing in wiregrass.",
} as const;

export const HERO_PREVIEW = {
  live: {
    id: "live" as const,
    label: "Live",
    href: "/",
    hint: "Current homepage",
  },
  a: {
    id: "a" as const,
    label: "A",
    href: "/preview/hero-a",
    query: "/?hero=a",
    hint: "Photo · shot 3",
  },
  b: {
    id: "b" as const,
    label: "B",
    href: "/preview/hero-b",
    query: "/?hero=b",
    hint: "Longleaf CSS",
  },
} as const;

export const HERO_PREVIEW_ROUTES = {
  a: "/preview/hero-a",
  b: "/preview/hero-b",
} as const;

export function isHeroVisual(value: string | null | undefined): value is HeroVisual {
  return value === "live" || value === "a" || value === "b";
}
