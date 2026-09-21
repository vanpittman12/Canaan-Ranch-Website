import { HERO_OPTION_A_PHOTO } from "@/lib/hero-preview";

/**
 * Option A preview only. Full-bleed Van photo option-a-shot3.jpg (shot 3 —
 * overcast pine savanna, central green sapling). Not the rejected sunny
 * aa207a68 JPEG. No tortoise sticker.
 */
export function PhotoSavannaHero() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Static public JPEG — skip image optimization on the Worker. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_OPTION_A_PHOTO.src}
        alt=""
        width={HERO_OPTION_A_PHOTO.width}
        height={HERO_OPTION_A_PHOTO.height}
        className="hero-photo"
        decoding="async"
        fetchPriority="high"
      />
      <div className="hero-photo-scrim" />
    </div>
  );
}
