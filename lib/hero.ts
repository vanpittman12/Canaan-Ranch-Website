/** Van’s live homepage photo: shot 3. Never the rejected sunny aa207a68 JPEG. */
export const HERO_PHOTO = {
  fileName: "option-a-shot3.jpg",
  src: "/hero/option-a-shot3.jpg",
  file: "public/hero/option-a-shot3.jpg",
  width: 1600,
  height: 2133,
  alt: "Overcast longleaf pine savanna with a young green sapling standing in wiregrass.",
} as const;

/**
 * Responsive variants of shot 3 (same crop/aspect, resized from the original).
 * From 768px up the frame is wider than the portrait photo's aspect, so cover
 * renders it at the viewport width (100vw). Below 768px the frame is taller
 * than it is wide and cover scales by height, so the photo renders ~1.5–3x the
 * viewport width (cropped); 200vw keeps mobile sharp. JPEG stays as fallback.
 */
export const HERO_PHOTO_WIDTHS = [640, 1080, 1600] as const;
export const HERO_PHOTO_SIZES = "(max-width: 767px) 200vw, 100vw";
export function heroSrcSet(ext: "avif" | "webp"): string {
  return HERO_PHOTO_WIDTHS.map((w) => `/hero/option-a-shot3-${w}.${ext} ${w}w`).join(", ");
}
