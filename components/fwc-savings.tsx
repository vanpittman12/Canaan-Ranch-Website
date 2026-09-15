import { brand } from "@/lib/brand";
import {
  fwcSavingsColumnLabels,
  fwcSavingsCopy,
  fwcSavingsRows,
  formatFwcPerGt,
  formatSavedPerGt,
  isFwcSavingsHeroRow,
  type FwcSavingsRow,
} from "@/lib/fwc-savings";

function SavingsCard({ row }: { row: FwcSavingsRow }) {
  const featured = isFwcSavingsHeroRow(row);

  return (
    <article
      className={
        featured
          ? "rounded-[16px] border border-brass bg-forest px-4 py-5 text-cream"
          : "rounded-[16px] border border-line bg-white px-4 py-4"
      }
    >
      <p
        className={
          featured
            ? "text-[12px] font-semibold uppercase tracking-[0.12em] text-brass"
            : "text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
        }
      >
        {fwcSavingsColumnLabels.insteadOf}
      </p>
      <h3
        className={
          featured
            ? "mt-1 font-serif text-2xl font-medium text-cream"
            : "mt-1 font-medium text-ink"
        }
      >
        {row.insteadOf}
      </h3>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className={featured ? "text-sm leading-6 text-cream/70" : "text-sm leading-6 text-muted"}>
            {fwcSavingsColumnLabels.fwcPerGt}
          </dt>
          <dd className={featured ? "mt-0.5 tabular-nums text-cream" : "mt-0.5 tabular-nums text-ink"}>
            {formatFwcPerGt(row.fwcPerGt)}
          </dd>
        </div>
        <div>
          <dt className={featured ? "text-sm leading-6 text-cream/70" : "text-sm leading-6 text-muted"}>
            {fwcSavingsColumnLabels.savedPerGt}
          </dt>
          <dd
            className={
              featured
                ? "mt-0.5 font-semibold tabular-nums text-2xl leading-7 text-brass"
                : "mt-0.5 font-semibold tabular-nums text-forest"
            }
          >
            {formatSavedPerGt(row.savedPerGt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function FwcSavingsModule() {
  return (
    <div id="fwc-savings">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
        FWC mitigation contribution
      </p>
      <h2 className="type-h2 mt-3 max-w-3xl text-forest">{fwcSavingsCopy.heading}</h2>
      <p className="mt-4 max-w-3xl text-[17px] leading-[27px] text-ink">
        {fwcSavingsCopy.baseline} {fwcSavingsCopy.perGtLabel}
      </p>
      <p className="mt-3 max-w-3xl text-[17px] leading-[27px] text-ink">
        {fwcSavingsCopy.perGtNote}
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
        {fwcSavingsCopy.siteFeesSeparate}
      </p>

      <ul className="mt-8 space-y-3 md:hidden">
        {fwcSavingsRows.map((row) => (
          <li key={row.insteadOf}>
            <SavingsCard row={row} />
          </li>
        ))}
      </ul>

      <div className="mt-8 hidden md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            FWC mitigation contribution per gopher tortoise compared with Canaan Preserve
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-3 pr-4 font-semibold text-forest">
                {fwcSavingsColumnLabels.insteadOf}
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold text-forest">
                {fwcSavingsColumnLabels.fwcPerGt}
              </th>
              <th scope="col" className="py-3 font-semibold text-forest">
                {fwcSavingsColumnLabels.savedPerGt}
              </th>
            </tr>
          </thead>
          <tbody>
            {fwcSavingsRows.map((row) => (
              <tr key={row.insteadOf} className="border-b border-line/70">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">
                  {row.insteadOf}
                </th>
                <td className="py-3 pr-4 tabular-nums text-ink">
                  {formatFwcPerGt(row.fwcPerGt)}
                </td>
                <td className="py-3 font-medium tabular-nums text-forest">
                  {formatSavedPerGt(row.savedPerGt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-3xl text-[17px] leading-[27px] text-ink">
        {fwcSavingsCopy.example}
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{fwcSavingsCopy.footnote}</p>
      <a
        className="btn-secondary mt-6"
        href={brand.fwcRecipientSitesUrl}
        target="_blank"
        rel="noreferrer"
      >
        {brand.fwcMitigationLinkLabel}
      </a>
    </div>
  );
}
