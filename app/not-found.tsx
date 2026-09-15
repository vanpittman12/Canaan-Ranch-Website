import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
        <EmptyState
          title="That page is not on the preserve."
          body="That address may have been mistyped, or this page does not exist."
          action={
            <Link href="/" className="btn-primary">
              Return home
            </Link>
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}
