import {
  BRAND_MARK_HEIGHT,
  BRAND_MARK_SRC,
  BRAND_MARK_WIDTH,
} from "@/lib/brand-mark-asset";

export function BrandMark({
  className = "h-12 w-auto",
  plate = false,
  decorative = true,
}: {
  className?: string;
  /** Cream plate so the dark mark stays readable on forest. */
  plate?: boolean;
  decorative?: boolean;
}) {
  const image = (
    <img
      src={BRAND_MARK_SRC}
      alt={decorative ? "" : "Canaan Preserve"}
      width={BRAND_MARK_WIDTH}
      height={BRAND_MARK_HEIGHT}
      aria-hidden={decorative ? true : undefined}
      data-mark="canaan-preserve"
      className={className}
      decoding="async"
    />
  );

  if (!plate) {
    return image;
  }

  return (
    <span className="inline-flex shrink-0 rounded-md bg-cream p-1">{image}</span>
  );
}
