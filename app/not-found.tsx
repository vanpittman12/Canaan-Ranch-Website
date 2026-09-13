import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-24 text-center sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">404</p>
        <h1 className="mt-3 font-serif text-4xl text-forest">That page is not on the ranch.</h1>
        <p className="mt-4 text-muted">
          The engagement may have been mistyped, or the page does not exist.
        </p>
        <Link href="/" className="btn-primary mt-8">
          Return home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
