import { HERO_PHOTO, HERO_PHOTO_SIZES, heroSrcSet } from "@/lib/hero";

/**
 * Live homepage hero. Full-bleed Van photo option-a-shot3.jpg (shot 3 —
 * overcast pine savanna, central green sapling). Not the rejected sunny
 * aa207a68 JPEG. No tortoise sticker.
 */
export function PhotoSavannaHero() {
  return (
    <div className="hero-photo-frame" aria-hidden="true">
      {/* Static public AVIF/WebP variants with JPEG fallback — no Worker image optimization. */}
      <picture>
        <source type="image/avif" srcSet={heroSrcSet("avif")} sizes={HERO_PHOTO_SIZES} />
        <source type="image/webp" srcSet={heroSrcSet("webp")} sizes={HERO_PHOTO_SIZES} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_PHOTO.src}
          alt=""
          width={HERO_PHOTO.width}
          height={HERO_PHOTO.height}
          className="hero-photo"
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      <div className="hero-photo-scrim" />
    </div>
  );
}
