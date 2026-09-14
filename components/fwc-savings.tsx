import { brand } from "@/lib/brand";
import {
  fwcSavingsCopy,
  fwcSavingsRows,
  formatFwcPerGt,
  formatSavedPerGt,
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

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            FWC mitigation contribution per gopher tortoise compared with Canaan Preserve
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-3 pr-4 font-semibold text-forest">
                Instead of
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold text-forest">
                FWC per GT
              </th>
              <th scope="col" className="py-3 font-semibold text-forest">
                Saved per GT with Canaan
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
