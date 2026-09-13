import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Begin an engagement",
};

export default function IntakePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
          Client intake
        </p>
        <h1 className="mt-3 font-serif text-4xl text-forest sm:text-5xl">
          Tell us about the work.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Company, contact, and project basics. On submit we draft Canaan Preserve’s standard
          professional-services agreement from these fields and show you the preview.
        </p>
        <div className="mt-10 rounded-[1.5rem] border border-line bg-white p-6 sm:p-8">
          <IntakeForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
