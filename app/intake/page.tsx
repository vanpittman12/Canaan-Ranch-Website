import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateDownloadButton } from "@/components/template-download";
import { brand } from "@/lib/brand";
import { formatUsd } from "@/lib/money";

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
          Buyer notice block, reserved tortoise count, county of relocation, authorized agent,
          donor affiliation, and one Buyer witness. The Canaan Ranch LLP witness is seller-side
          and is not collected here. The Effective Date is the date the Buyer signs — not a field
          on this form. After submit you download the populated agreement PDF to review.
        </p>
        <p className="mt-4 rounded-xl border border-brass/30 bg-wheat/50 px-4 py-3 text-sm font-medium leading-6 text-forest">
          {brand.fwcStatus}
        </p>
        <p className="mt-3 text-sm text-muted">
          {formatUsd(brand.defaultPerGtRate)} per adult ·{" "}
          {formatUsd(brand.juvenileAdditionalFee)} per juvenile · No deposits required
        </p>
        <div className="mt-6">
          <TemplateDownloadButton variant="primary" />
          <p className="mt-2 text-sm text-muted">
            Review the blank agreement template before filling fields.
          </p>
        </div>
        <div className="mt-10 rounded-[1.5rem] border border-line bg-white p-6 sm:p-8">
          <IntakeForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
