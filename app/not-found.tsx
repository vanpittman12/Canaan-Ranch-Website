import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
        <EmptyState
          title="This page is not on Canaan Preserve."
          body="That address is not a page on this site. Check the link, or return home to reserve capacity."
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
