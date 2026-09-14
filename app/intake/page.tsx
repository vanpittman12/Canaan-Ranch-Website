import type { Metadata } from "next";
import { FwcBadge } from "@/components/fwc-badge";
import { IntakeForm } from "@/components/intake-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateDownloadButton } from "@/components/template-download";
import { brand } from "@/lib/brand";
import { INTAKE_MINUTES, PREPARE_ITEMS } from "@/lib/intake-steps";
import { formatUsd } from "@/lib/money";

export const metadata: Metadata = {
  title: "Reserve capacity",
};

export default function IntakePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
          Buyer intake
        </p>
        <h1 className="type-h1 mt-3 text-forest">Start relocation intake.</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-[27px] text-muted">
          Buyer notice block, reserved tortoise count, county of relocation, authorized agent,
          donor affiliation, and one Buyer witness. The Canaan Ranch LLP witness is seller-side
          and is not collected here. The Effective Date is the date the Buyer signs — not a field
          on this form. After submit you download the populated Word agreement to review.
        </p>
        <div className="mt-4">
          <FwcBadge />
        </div>
        <p className="mt-3 text-sm text-muted">
          {formatUsd(brand.defaultPerGtRate)} per adult · {formatUsd(brand.juvenileRate)} per
          juvenile · No deposits required
        </p>
        <div className="mt-6">
          <TemplateDownloadButton variant="primary" />
          <p className="mt-2 text-sm text-muted">
            Review the blank agreement template before filling fields.
          </p>
        </div>

        <aside className="surface-card mt-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
            Before you start
          </p>
          <h2 className="type-h2 mt-2 text-forest">About {INTAKE_MINUTES} minutes</h2>
          <p className="mt-2 text-sm text-muted">
            Have these existing agreement details ready. Adult versus juvenile is not collected
            here.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-[17px] leading-[27px] text-ink">
            {PREPARE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </aside>

        <div className="surface-card mt-8 sm:p-8">
          <IntakeForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
