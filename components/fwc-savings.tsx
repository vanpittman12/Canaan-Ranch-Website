import { brand } from "@/lib/brand";
import {
  fwcSavingsColumnLabels,
  fwcSavingsCopy,
  fwcSavingsRows,
  formatFwcPerGt,
  formatSavedPerGt,
  isFwcSavingsHeroRow,
} from "@/lib/fwc-savings";

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

      <table className="fwc-savings-table mt-8 w-full text-left text-sm">
        <caption className="sr-only">
          FWC mitigation contribution per gopher tortoise compared with Canaan Preserve
        </caption>
        <thead>
          <tr>
            <th scope="col">{fwcSavingsColumnLabels.insteadOf}</th>
            <th scope="col">{fwcSavingsColumnLabels.fwcPerGt}</th>
            <th scope="col">{fwcSavingsColumnLabels.savedPerGt}</th>
          </tr>
        </thead>
        <tbody>
          {fwcSavingsRows.map((row) => {
            const featured = isFwcSavingsHeroRow(row);
            return (
              <tr
                key={row.insteadOf}
                className={featured ? "fwc-savings-row fwc-savings-row-hero" : "fwc-savings-row"}
              >
                <th scope="row">
                  <span className="fwc-savings-card-label">{fwcSavingsColumnLabels.insteadOf}</span>
                  {row.insteadOf}
                </th>
                <td data-label={fwcSavingsColumnLabels.fwcPerGt}>{formatFwcPerGt(row.fwcPerGt)}</td>
                <td data-label={fwcSavingsColumnLabels.savedPerGt}>
                  {formatSavedPerGt(row.savedPerGt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
