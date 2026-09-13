import { buildContract } from "@/lib/contract";
import type { Engagement } from "@/lib/types";

export function ContractPreview({ engagement }: { engagement: Engagement }) {
  const contract = buildContract(engagement);

  return (
    <article className="contract-sheet">
      <header className="border-b border-line pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
          {contract.subtitle}
        </p>
        <h2 className="mt-2 font-serif text-3xl text-forest sm:text-4xl">{contract.title}</h2>
        <p className="mt-3 text-sm text-muted">
          {contract.reference} · Effective {contract.effectiveDate} · Expires {contract.expirationDate}
        </p>
      </header>
      <div className="mt-8 space-y-7">
        {contract.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="font-serif text-xl text-forest">{section.heading}</h3>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-[15px] leading-7 text-ink/90">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <section>
          <h3 className="font-serif text-xl text-forest">{contract.signatureHeading}</h3>
          <p className="mt-2 text-[15px] leading-7 text-ink/90">{contract.signatureIntro}</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <SignatureBlock lines={contract.sellerBlock} />
            <SignatureBlock lines={contract.buyerBlock} />
          </div>
        </section>
      </div>
    </article>
  );
}

function SignatureBlock({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-cream/50 p-4">
      {lines.map((line, index) => (
        <p
          key={`${index}-${line}`}
          className={index === 0 ? "font-serif text-lg text-forest" : "mt-3 text-sm text-muted"}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
