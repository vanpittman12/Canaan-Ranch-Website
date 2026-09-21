import Link from "next/link";
import { HERO_PREVIEW, type HeroVisual } from "@/lib/hero-preview";

const OPTIONS = [HERO_PREVIEW.live, HERO_PREVIEW.a, HERO_PREVIEW.b] as const;

export function HeroPreviewBar({ active }: { active: Exclude<HeroVisual, "live"> }) {
  return (
    <div className="relative z-20 border-b border-cream/20 bg-forest-deep/90">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <p className="text-[12px] leading-4 font-medium tracking-wide text-cream/80">
          Hero preview only — the live homepage is unchanged until Van chooses.
        </p>
        <nav aria-label="Hero preview variants" className="flex flex-wrap items-center gap-2">
          {OPTIONS.map((option) => {
            const isActive =
              option.id === "live" ? false : option.id === active;
            return (
              <Link
                key={option.id}
                href={option.href}
                prefetch={false}
                className={`inline-flex min-h-11 items-center rounded-[12px] border px-3 text-[12px] font-semibold tracking-wide ${
                  isActive
                    ? "border-brass bg-brass text-forest"
                    : "border-cream/35 bg-transparent text-cream hover:border-cream"
                }`}
              >
                {option.label}
                <span className="ml-1.5 font-medium opacity-80">{option.hint}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
