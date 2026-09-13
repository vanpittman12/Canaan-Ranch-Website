import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/lib/brand";
import { formatUsd } from "@/lib/money";

const steps = [
  {
    n: "01",
    title: "Reserve capacity",
    body: "Tell us the Buyer, notice address, spots to reserve, project county, and authorized / donor contacts. Then name one witness per party.",
  },
  {
    n: "02",
    title: "Review the agreement",
    body: "We populate the Multi-Project Gopher Tortoise Relocation Agreement from those details.",
  },
  {
    n: "03",
    title: "We accept, then DocuSign",
    body: "Canaan Preserve reviews first. After Accept, the usual path is DocuSign to the Buyer and Canaan Ranch LLP signers plus one witness each. Manual PDF is a fallback. Nothing is executed until Accept and a signed copy are on file.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line bg-forest text-cream">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <HorizonArt />
          </div>
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brass">
                Pasco County · Florida
              </p>
              <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
                Reserve recipient-site capacity with a clear agreement.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-cream/80">
                Canaan Preserve is a gopher tortoise relocation recipient site. {brand.legalName}{" "}
                is the contracting party. Intake, preview, signature, and a human review before
                anything closes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/intake"
                  className="inline-flex items-center justify-center rounded-full bg-cream px-5 py-3 text-[0.95rem] font-semibold text-forest transition hover:bg-white"
                >
                  Begin a reservation
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-cream/35 px-5 py-3 text-[0.95rem] font-semibold text-cream transition hover:bg-white/10"
                >
                  How it works
                </a>
              </div>
            </div>
            <aside className="self-end rounded-2xl border border-cream/15 bg-forest-deep/50 p-6 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.22em] text-brass">Standard terms</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-cream/80">
                <li>Per GT rate {formatUsd(brand.defaultPerGtRate)} (generally non-negotiable)</li>
                <li>Juvenile additional fee {formatUsd(brand.juvenileAdditionalFee)} at delivery</li>
                <li>Effective Date = Buyer signature date; expires one year later</li>
                <li>Executed only when accepted and signed</li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
            How it works
          </p>
          <h2 className="mt-3 max-w-xl font-serif text-4xl text-forest">
            From reserved spots to an executed agreement.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.n} className="rounded-2xl border border-line bg-white p-6">
                <p className="text-sm font-semibold tracking-[0.18em] text-brass">{step.n}</p>
                <h3 className="mt-3 font-serif text-2xl text-forest">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <div className="rounded-[2rem] bg-forest px-8 py-14 text-cream sm:px-14">
            <h2 className="max-w-xl font-serif text-4xl">Ready to reserve capacity.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-cream/75">
              Start the intake. Canaan Preserve reviews and Accepts first; the usual path is
              then DocuSign. Manual signature remains available as a fallback.
            </p>
            <Link
              href="/intake"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-cream px-5 py-3 text-[0.95rem] font-semibold text-forest transition hover:bg-white"
            >
              Open the intake form
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function HorizonArt() {
  return (
    <svg className="h-full w-full" viewBox="0 0 1200 600" fill="none" aria-hidden="true">
      <path
        d="M0 420C180 360 280 300 420 320C580 344 640 250 780 270C920 290 1000 210 1200 240V600H0V420Z"
        fill="#102019"
      />
      <path
        d="M0 470C220 420 340 400 520 430C700 460 820 380 1200 410V600H0V470Z"
        fill="#1B3328"
      />
      <circle cx="940" cy="120" r="28" fill="#B68B3D" opacity="0.7" />
    </svg>
  );
}
