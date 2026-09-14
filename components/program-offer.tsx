import { programOfferCopy, programOfferItems } from "@/lib/program-offer";

export function ProgramOffer() {
  return (
    <section id="what-we-offer" className="border-b border-line bg-cream">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
          {programOfferCopy.heading}
        </p>
        <h2 className="type-h2 mt-3 max-w-xl text-forest">{programOfferCopy.intro}</h2>
        <ul className="mt-8 max-w-3xl space-y-4">
          {programOfferItems.map((item) => (
            <li key={item} className="flex gap-3 text-[17px] leading-[27px] text-ink">
              <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brass" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
