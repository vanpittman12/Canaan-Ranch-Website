import { brand } from "./brand";
import { formatUsd } from "./money";

/** Canaan Preserve FWC conservation contribution: Long-Term Level 1, additional GT. */
export const CANAAN_FWC_LEVEL = "Long-Term Level 1";
export const CANAAN_FWC_PER_ADDITIONAL_GT = 419;

export const fwcSavingsRows = [
  { insteadOf: "Unprotected", fwcPerGt: 7545, savedPerGt: 7126 },
  { insteadOf: "Short-term Level 3", fwcPerGt: 4193, savedPerGt: 3774 },
  { insteadOf: "Short-term Level 2", fwcPerGt: 2515, savedPerGt: 2096 },
  { insteadOf: "Short-term Level 1", fwcPerGt: 1257, savedPerGt: 838 },
  { insteadOf: "Long-term Level 2", fwcPerGt: 838, savedPerGt: 419 },
] as const;

export const fwcSavingsExample = {
  tortoiseCount: 50,
  insteadOf: "Unprotected",
  savedPerGt: 7126,
  /** 50 × $7,126 = $356,300, shown as ~$356k. */
  roundedTotalLabel: "~$356k",
} as const;

export const fwcSavingsCopy = {
  heading: "FWC mitigation contribution savings vs other recipient site types",
  perGtLabel: "All figures are per gopher tortoise (per GT).",
  baseline: `Canaan Preserve is ${CANAAN_FWC_LEVEL} at ${formatUsd(CANAAN_FWC_PER_ADDITIONAL_GT)} per additional GT.`,
  perGtNote:
    "Savings shown per gopher tortoise. Multiply by your count — project totals are often much higher.",
  siteFeesSeparate: `Canaan site fees (${formatUsd(brand.defaultPerGtRate)} adult / ${formatUsd(brand.juvenileRate)} juvenile) are separate from this FWC mitigation contribution.`,
  footnote:
    "Illustrative from FWC conservation contribution schedule (additional tortoise after first five / >10 burrows); exact level depends on classification.",
  example:
    "50 GT vs unprotected ≈ ~$356k FWC mitigation savings (50 × $7,126).",
} as const;

export function formatFwcPerGt(amount: number) {
  return formatUsd(amount);
}

export function formatSavedPerGt(amount: number) {
  return `~${formatUsd(amount)}`;
}
