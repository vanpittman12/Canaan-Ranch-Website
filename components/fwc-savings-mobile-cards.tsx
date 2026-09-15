"use client";

import { useEffect, useState } from "react";
import {
  fwcSavingsColumnLabels,
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
          ? "min-w-0 overflow-hidden rounded-[16px] border border-brass bg-forest px-3 py-5 text-cream sm:px-4"
          : "min-w-0 overflow-hidden rounded-[16px] border border-line bg-white px-3 py-4 sm:px-4"
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
          <dt className={featured ? "text-pretty break-words text-sm leading-6 text-cream/70" : "text-pretty break-words text-sm leading-6 text-muted"}>
            {fwcSavingsColumnLabels.fwcPerGt}
          </dt>
          <dd className={featured ? "mt-0.5 tabular-nums text-cream" : "mt-0.5 tabular-nums text-ink"}>
            {formatFwcPerGt(row.fwcPerGt)}
          </dd>
        </div>
        <div>
          <dt className={featured ? "text-pretty break-words text-sm leading-6 text-cream/70" : "text-pretty break-words text-sm leading-6 text-muted"}>
            {fwcSavingsColumnLabels.savedPerGt}
          </dt>
          <dd
            className={
              featured
                ? "mt-0.5 break-words font-semibold tabular-nums text-xl leading-7 text-brass sm:text-2xl"
                : "mt-0.5 break-words font-semibold tabular-nums text-forest"
            }
          >
            {formatSavedPerGt(row.savedPerGt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

/**
 * Stacked FWC cards for viewports below `md` (768px).
 * First render is null so Cloudflare Worker HTML stays one table tree.
 */
export function FwcSavingsMobileCards() {
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setShowCards(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!showCards) {
    return null;
  }

  return (
    <ul className="mt-8 w-full min-w-0 space-y-3 overflow-hidden">
      {fwcSavingsRows.map((row) => (
        <li key={row.insteadOf}>
          <SavingsCard row={row} />
        </li>
      ))}
    </ul>
  );
}
