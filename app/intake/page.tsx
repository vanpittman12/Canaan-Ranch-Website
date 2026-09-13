import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Reserve capacity",
};

export default function IntakePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
          Buyer intake
        </p>
        <h1 className="mt-3 font-serif text-4xl text-forest sm:text-5xl">
          Reserve recipient-site capacity.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Buyer and notice block, number of spots to reserve, project contacts, and one witness
          per party. The Effective Date is the date the Buyer signs — not a field on this form.
          On submit we draft the Multi-Project Gopher Tortoise Relocation Agreement for Canaan
          Ranch LLP / Canaan Preserve.
        </p>
        <div className="mt-10 rounded-[1.5rem] border border-line bg-white p-6 sm:p-8">
          <IntakeForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
