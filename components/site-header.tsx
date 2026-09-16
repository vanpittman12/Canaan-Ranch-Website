import Link from "next/link";
import { brand } from "@/lib/brand";
import { BrandLockup } from "./brand-lockup";

export function SiteHeader({
  variant = "public",
}: {
  variant?: "public" | "admin";
}) {
  return (
    <header className="overflow-visible border-b border-line bg-paper">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-wrap items-center justify-between gap-2 overflow-visible px-4 py-3 sm:gap-3 sm:px-6">
        <Link href="/" prefetch={false} className="flex shrink-0 items-center gap-3">
          <BrandLockup variant={variant} />
        </Link>
        <nav className="flex min-w-0 shrink-0 items-center gap-2 overflow-visible text-sm text-ink sm:gap-3">
          {variant === "admin" ? (
            <Link href="/admin" className="inline-flex min-h-11 items-center hover:text-forest">
              Queue
            </Link>
          ) : (
            <>
              <Link
                href="/#how-it-works"
                prefetch={false}
                className="hidden min-h-11 items-center hover:text-forest md:inline-flex"
              >
                How it works
              </Link>
              <a
                href={brand.fwcRecipientSitesUrl}
                className="hidden min-h-11 items-center hover:text-forest 2xl:inline-flex"
                target="_blank"
                rel="noreferrer"
              >
                {brand.fwcMitigationLinkLabel}
              </a>
              <a
                href="/api/agreement-template"
                className="hidden min-h-11 items-center hover:text-forest sm:inline-flex"
              >
                Blank agreement
              </a>
              <Link
                href="/intake"
                prefetch={false}
                className="btn-primary shrink-0 overflow-visible whitespace-nowrap px-3.5 text-sm sm:px-4"
              >
                {brand.intakeCta}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
