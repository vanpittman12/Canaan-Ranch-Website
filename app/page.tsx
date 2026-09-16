import type { Metadata } from "next";
import Link from "next/link";
import { FwcBadge } from "@/components/fwc-badge";
import { FwcSavingsModule } from "@/components/fwc-savings";
import { ProgramOffer } from "@/components/program-offer";
import { ServiceAreaMap } from "@/components/service-area-map";
import { SandhillHabitat } from "@/components/sandhill-habitat";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateDownloadButton } from "@/components/template-download";
import { brand } from "@/lib/brand";
import { formatUsd } from "@/lib/money";
import { canonicalPath } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: canonicalPath("/") },
  openGraph: { url: canonicalPath("/") },
};

const steps = [
  {
    n: "01",
    title: "Review the template",
    body: "Download the blank Multi-Project Gopher Tortoise Relocation Agreement before you fill anything in.",
  },
  {
    n: "02",
    title: "Complete intake",
    body: "Enter the Buyer notice block, reserved tortoise count, county of relocation, authorized agent, donor affiliation, and one Buyer witness.",
  },
  {
    n: "03",
    title: "Download your agreement",
    body: "We populate the agreement from those details. Download the Word/DOCX file to review — there is no on-screen contract preview.",
  },
  {
    n: "04",
    title: "Canaan Preserve accepts, then sign",
    body: "Review happens first. After Accept, DocuSign is the usual signing path. The fallback is to download the Word agreement and upload a signed copy. Nothing is executed until Accept and a signed copy are on file.",
  },
];

const facts = [
  { label: "Status", value: "FWC Approved Tier 1" },
  {
    label: "Pricing",
    value: `${formatUsd(brand.defaultPerGtRate)} adult / ${formatUsd(brand.juvenileRate)} juvenile`,
  },
  { label: "Deposits", value: "No deposits" },
  { label: "Entity", value: brand.legalName },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line bg-forest-deep text-cream">
          <SandhillHabitat />
          <div className="relative mx-auto w-full max-w-6xl px-5 pt-16 pb-12 sm:px-8 lg:min-h-[34rem] lg:pt-24">
            <div className="max-w-3xl">
              <p className="text-[13px] font-semibold tracking-wide text-brass">
                {brand.habitatLine}
              </p>
              <div className="mt-4">
                <FwcBadge onForest />
              </div>
              <h1 className="type-h1 mt-5 max-w-3xl text-cream">
                {brand.heroSlogan}
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-[27px] text-cream/85">
                {brand.heroLead}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/intake"
                  prefetch={false}
                  className="btn-primary bg-cream text-forest hover:bg-white"
                >
                  {brand.intakeCta}
                </Link>
                <TemplateDownloadButton variant="dark" />
                <a href="#how-it-works" className="btn-secondary border-cream/35 bg-transparent text-cream">
                  How it works
                </a>
              </div>
            </div>

            <div className="mt-16 min-w-0 overflow-hidden rounded-[16px] border border-line/30">
              <dl className="grid w-full min-w-0 grid-cols-2 gap-px bg-forest-deep/80 md:grid-cols-4">
                {facts.map((fact) => (
                  <div key={fact.label} className="min-w-0 overflow-hidden bg-forest px-3 py-4 sm:px-5 sm:py-5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brass sm:text-[12px] sm:tracking-[0.12em]">
                      {fact.label}
                    </dt>
                    <dd className="mt-2 text-pretty break-words text-[15px] leading-snug font-medium text-cream sm:text-base sm:leading-6">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="min-w-0 overflow-x-hidden border-t border-line bg-paper px-4 py-8 text-ink sm:px-8">
                <FwcSavingsModule />
              </div>
            </div>
          </div>
        </section>

        <ProgramOffer />

        <ServiceAreaMap />

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
            How it works
          </p>
          <h2 className="type-h2 mt-3 max-w-xl text-forest">
            Four steps from reserved capacity to a signed agreement.
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.n} className="surface-card relative">
                {index < steps.length - 1 ? (
                  <span className="pointer-events-none absolute top-8 right-[-10px] hidden h-px w-4 bg-line md:block" />
                ) : null}
                <p className="text-sm font-semibold tracking-[0.18em] text-brass">{step.n}</p>
                <h3 className="mt-3 font-serif text-2xl font-medium text-forest">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line bg-cream">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <FwcBadge />
            </div>
            <a
              className="btn-secondary max-w-full whitespace-normal text-center xl:whitespace-nowrap"
              href={brand.fwcRecipientSitesUrl}
              target="_blank"
              rel="noreferrer"
            >
              {brand.fwcMitigationLinkLabel}
            </a>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <div className="rounded-[16px] border border-line bg-forest px-8 py-12 text-cream sm:px-14">
            <h2 className="type-h2 max-w-xl text-cream">Start the four steps.</h2>
            <p className="mt-4 max-w-xl text-[17px] leading-[27px] text-cream/80">
              {brand.flowInvite}
            </p>
            <p className="mt-4 text-sm font-medium text-cream">
              {formatUsd(brand.defaultPerGtRate)} per adult · {formatUsd(brand.juvenileRate)} per
              juvenile
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/intake"
                prefetch={false}
                className="btn-primary bg-cream text-forest hover:bg-white"
              >
                {brand.intakeCta}
              </Link>
              <TemplateDownloadButton variant="dark" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
