import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const steps = [
  {
    n: "01",
    title: "Share the work",
    body: "Tell us about your company, contact, and project. The form is short and specific.",
  },
  {
    n: "02",
    title: "Review the agreement",
    body: "We populate Canaan Ranch’s standard professional-services contract from those details.",
  },
  {
    n: "03",
    title: "Sign, then we accept",
    body: "Choose DocuSign or a manual PDF. The engagement stays open until the team accepts and a signed copy is on file.",
  },
];

const services = [
  {
    title: "Land stewardship",
    body: "Grazing, pasture recovery, and seasonal land-use advisory rooted in the ranch.",
  },
  {
    title: "Hospitality & events",
    body: "Private gatherings and guest operations planned against the land and the calendar.",
  },
  {
    title: "Operations consulting",
    body: "Hands-on counsel for ranch systems, vendors, and the work that sits between seasons.",
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
                Canaan Valley · West Virginia
              </p>
              <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
                Begin the work with a clear agreement.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-cream/80">
                Canaan Ranch professional services — from first conversation to an executed
                contract. Intake, preview, signature, and a human review before anything closes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/intake"
                  className="inline-flex items-center justify-center rounded-full bg-cream px-5 py-3 text-[0.95rem] font-semibold text-forest transition hover:bg-white"
                >
                  Begin an engagement
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
              <p className="text-[11px] uppercase tracking-[0.22em] text-brass">Current path</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-cream/80">
                <li>Standard professional-services agreement</li>
                <li>DocuSign seam or manual signed PDF</li>
                <li>Internal accept / changes / decline queue</li>
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
            A finished path, not a half-built form.
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

        <section className="border-y border-line bg-cream/60">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
                Services
              </p>
              <h2 className="mt-3 font-serif text-4xl text-forest">Work we take on.</h2>
              <p className="mt-4 text-base leading-7 text-muted">
                Every engagement uses the same intake and the same standard agreement, then a
                Canaan Ranch review before signature is treated as final.
              </p>
            </div>
            <div className="grid gap-4">
              {services.map((service) => (
                <article key={service.title} className="rounded-2xl border border-line bg-white p-5">
                  <h3 className="font-serif text-2xl text-forest">{service.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{service.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <div className="rounded-[2rem] bg-forest px-8 py-14 text-cream sm:px-14">
            <h2 className="max-w-xl font-serif text-4xl">Ready when you are.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-cream/75">
              Start the intake. You will see the populated agreement before you choose DocuSign
              or a manual signature.
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
