import Link from "next/link";
import { brand } from "@/lib/brand";
import { BrandMark } from "./brand-mark";

export function SiteHeader({
  variant = "public",
}: {
  variant?: "public" | "admin";
}) {
  return (
    <header className="border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="h-11 w-11" />
          <span className="leading-tight">
            <span className="block font-serif text-xl tracking-tight text-forest">
              {brand.name}
            </span>
            <span className="block text-[11px] uppercase tracking-[0.22em] text-muted">
              {variant === "admin" ? "Internal review" : "Recipient site"}
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-ink/80">
          {variant === "admin" ? (
            <Link href="/admin" className="hover:text-forest">
              Queue
            </Link>
          ) : (
            <>
              <Link href="/#how-it-works" className="hidden hover:text-forest sm:inline">
                How it works
              </Link>
              <a href="/api/agreement-template" className="hidden hover:text-forest sm:inline">
                Blank agreement
              </a>
              <Link href="/intake" className="btn-primary !px-4 !py-2 text-sm">
                Begin a reservation
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
