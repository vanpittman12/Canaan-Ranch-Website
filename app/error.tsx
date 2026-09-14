"use client";

import { EmptyState } from "@/components/empty-state";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-24 sm:px-8">
        <EmptyState
          title="Something stopped this page."
          body="Try again, or return to intake if you were reserving capacity."
          action={
            <button className="btn-primary" type="button" onClick={reset}>
              Try again
            </button>
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}
