import Link from "next/link";
import { brand, formatBrandAddress } from "@/lib/brand";
import { BrandLockup } from "./brand-lockup";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-forest text-cream">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <BrandLockup light />
          <p className="mt-4 text-sm text-cream/80">
            {brand.legalName} is the contracting party.
          </p>
          <p className="mt-3 max-w-sm text-sm font-medium text-cream">{brand.fwcStatus}</p>
          <p className="mt-4 text-sm text-cream/70">{formatBrandAddress()}</p>
          <p className="text-sm text-cream/70">
            {brand.email} · {brand.phone}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-cream/70 sm:items-end">
          <Link href="/intake" className="inline-flex min-h-11 items-center hover:text-cream">
            Start relocation intake
          </Link>
          <a
            href={brand.fwcRecipientSitesUrl}
            className="inline-flex min-h-11 items-center hover:text-cream"
            target="_blank"
            rel="noreferrer"
          >
            {brand.fwcMitigationLinkLabel}
          </a>
          <Link href="/admin/login" className="inline-flex min-h-11 items-center hover:text-cream">
            Team sign in
          </Link>
          <p className="pt-2 text-xs text-cream/50">
            Standard relocation agreement form. Not a substitute for legal counsel.
          </p>
        </div>
      </div>
    </footer>
  );
}
