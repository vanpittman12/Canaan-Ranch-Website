import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="type-h1 text-forest">{title}</h1>
        <div className="mt-6 space-y-4 text-[17px] leading-[27px] text-muted">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
