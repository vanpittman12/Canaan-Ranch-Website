import { brand } from "@/lib/brand";
import { BrandMark } from "./brand-mark";

export function BrandLockup({
  variant = "public",
  light = false,
}: {
  variant?: "public" | "admin";
  light?: boolean;
}) {
  const subtitle = variant === "admin" ? "Internal review" : brand.lockupLine;

  return (
    <span className="flex min-w-0 items-center gap-3">
      <BrandMark className="h-12 w-auto shrink-0" plate={light} />
      <span className="min-w-0 leading-tight">
        <span
          className={`block truncate font-serif text-xl tracking-tight ${light ? "text-cream" : "text-forest"}`}
        >
          {brand.name}
        </span>
        <span
          className={`block truncate text-[12px] font-semibold uppercase tracking-[0.12em] ${light ? "text-cream/70" : "text-muted"}`}
        >
          {subtitle}
        </span>
      </span>
    </span>
  );
}
