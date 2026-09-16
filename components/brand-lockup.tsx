import { brand } from "@/lib/brand";
import { BrandMark } from "./brand-mark";

export function BrandLockup({
  variant = "public",
  light = false,
  compact = false,
}: {
  variant?: "public" | "admin";
  light?: boolean;
  /** Header lockup: keep 17px wordmark and hide the subtitle until 2xl. */
  compact?: boolean;
}) {
  const subtitle = variant === "admin" ? "Internal review" : brand.lockupLine;

  return (
    <span className="flex shrink-0 items-center gap-2 sm:gap-3">
      <BrandMark className="h-12 w-auto shrink-0" plate={light} />
      <span className="leading-tight">
        <span
          className={`block whitespace-nowrap font-serif text-[17px] tracking-tight ${compact ? "2xl:text-xl" : "sm:text-xl"} ${light ? "text-cream" : "text-forest"}`}
        >
          {brand.name}
        </span>
        <span
          className={`${compact ? "hidden 2xl:block" : "block"} whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.12em] ${light ? "text-cream/70" : "text-muted"}`}
        >
          {subtitle}
        </span>
      </span>
    </span>
  );
}
