import Link from "next/link";
import { brand } from "@/lib/brand";
import { BrandLockup } from "./brand-lockup";

export function SiteHeader({
  variant = "public",
}: {
  variant?: "public" | "admin";
}) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandLockup variant={variant} />
        </Link>
        <nav className="flex shrink-0 items-center gap-3 text-sm text-ink sm:gap-5">
          {variant === "admin" ? (
            <Link href="/admin" className="inline-flex min-h-11 items-center hover:text-forest">
              Queue
            </Link>
          ) : (
            <>
              <Link
                href="/#how-it-works"
                className="hidden min-h-11 items-center hover:text-forest md:inline-flex"
              >
                How it works
              </Link>
              <a
                href={brand.fwcRecipientSitesUrl}
                className="hidden min-h-11 items-center hover:text-forest lg:inline-flex"
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
              <Link href="/intake" className="btn-primary !px-3 text-sm sm:!px-4">
                Start intake
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
