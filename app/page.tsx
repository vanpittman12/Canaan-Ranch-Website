import Link from "next/link";
import { FwcBadge } from "@/components/fwc-badge";
import { SandhillHabitat } from "@/components/sandhill-habitat";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TemplateDownloadButton } from "@/components/template-download";
import { brand } from "@/lib/brand";
import { formatUsd } from "@/lib/money";

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
    body: "We populate the agreement from those details. Download the PDF to review — there is no on-screen contract preview.",
  },
  {
    n: "04",
    title: "Canaan Preserve Accepts, then sign",
    body: "Review happens first. After Accept, the usual path is DocuSign. Manual PDF is a fallback. Nothing is executed until Accept and a signed copy are on file.",
  },
];

const facts = [
  { label: "Status", value: "FWC Tier 1" },
  {
    label: "Pricing",
    value: `${formatUsd(brand.defaultPerGtRate)} / ${formatUsd(brand.juvenileRate)}`,
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
          <div className="relative mx-auto w-full max-w-6xl px-5 pt-16 sm:px-8 lg:pt-24">
            <div className="max-w-2xl">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
                {brand.habitatLine}
              </p>
              <div className="mt-4">
                <FwcBadge onForest />
              </div>
              <h1 className="type-h1 mt-5 max-w-xl text-cream">
                Start relocation intake for a clear recipient-site agreement.
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-[27px] text-cream/85">
                Canaan Preserve is a gopher tortoise relocation recipient site. {brand.legalName}{" "}
                is the contracting party. Intake, a downloadable agreement, signature, and a
                human review before anything closes.
              </p>
              <p className="mt-4 text-sm font-medium leading-6 text-cream">{brand.fwcStatus}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/intake" className="btn-primary bg-cream text-forest hover:bg-white">
                  Start relocation intake
                </Link>
                <TemplateDownloadButton variant="dark" />
                <a href="#how-it-works" className="btn-secondary border-cream/35 bg-transparent text-cream">
                  How it works
                </a>
              </div>
            </div>

            <dl className="mt-16 grid gap-px overflow-hidden rounded-t-[16px] border border-b-0 border-line/30 bg-forest-deep/80 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label} className="bg-forest px-5 py-5">
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
                    {fact.label}
                  </dt>
                  <dd className="mt-2 font-medium text-cream">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
            How it works
          </p>
          <h2 className="type-h2 mt-3 max-w-xl text-forest">
            Four steps from reserved spots to an executed agreement.
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
              <p className="mt-3 max-w-2xl text-[17px] leading-[27px] text-ink">
                {brand.fwcStatus} Eligibility and recipient-site rules are published by the Florida
                Fish and Wildlife Conservation Commission.
              </p>
            </div>
            <a
              className="btn-secondary shrink-0"
              href={brand.fwcRecipientSitesUrl}
              target="_blank"
              rel="noreferrer"
            >
              FWC recipient-site guidance
            </a>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
          <div className="rounded-[16px] border border-line bg-forest px-8 py-12 text-cream sm:px-14">
            <h2 className="type-h2 max-w-xl text-cream">Ready to reserve capacity.</h2>
            <p className="mt-4 max-w-xl text-[17px] leading-[27px] text-cream/80">
              Review the blank agreement first if you like, then start intake. Canaan Preserve
              reviews and Accepts first; the usual path is then DocuSign. Manual signature remains
              available as a fallback.
            </p>
            <p className="mt-4 text-sm font-medium text-cream">
              {formatUsd(brand.defaultPerGtRate)} per adult · {formatUsd(brand.juvenileRate)} per
              juvenile · No deposits required
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/intake" className="btn-primary bg-cream text-forest hover:bg-white">
                Start relocation intake
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
