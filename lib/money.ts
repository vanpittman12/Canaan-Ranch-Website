import { brand } from "./brand";
import type { IntakeFields } from "./types";

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function chunkToWords(n: number): string {
  if (n < 20) {
    return ONES[n];
  }
  if (n < 100) {
    const remainder = n % 10;
    return remainder ? `${TENS[Math.floor(n / 10)]}-${ONES[remainder]}` : TENS[Math.floor(n / 10)];
  }
  const remainder = n % 100;
  return remainder
    ? `${ONES[Math.floor(n / 100)]} hundred ${chunkToWords(remainder)}`
    : `${ONES[Math.floor(n / 100)]} hundred`;
}

export function numberToWords(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "zero";
  }
  const amount = Math.round(value);
  if (amount === 0) {
    return "zero";
  }
  const parts: string[] = [];
  const billions = Math.floor(amount / 1_000_000_000);
  const millions = Math.floor((amount % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((amount % 1_000_000) / 1000);
  const rest = amount % 1000;
  if (billions) {
    parts.push(`${chunkToWords(billions)} billion`);
  }
  if (millions) {
    parts.push(`${chunkToWords(millions)} million`);
  }
  if (thousands) {
    parts.push(`${chunkToWords(thousands)} thousand`);
  }
  if (rest) {
    parts.push(chunkToWords(rest));
  }
  return parts.join(" ");
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function usdInWords(amount: number) {
  return `${numberToWords(amount)} dollars`;
}

export function estimatedPayment(count: number, rate: number) {
  return count * rate;
}

export function dealEconomics(intake: IntakeFields) {
  const rate = intake.perGtRate || brand.defaultPerGtRate;
  const count = intake.tortoiseCount;
  const total = estimatedPayment(count, rate);
  return {
    count,
    rate,
    total,
    rateFormatted: formatUsd(rate),
    totalFormatted: formatUsd(total),
    rateWords: usdInWords(rate),
    totalWords: usdInWords(total),
  };
}

/** Calendar date (YYYY-MM-DD) from an ISO date or timestamp. */
export function dateOnly(isoDateTime: string) {
  return isoDateTime.slice(0, 10);
}

/** Florida / Eastern business calendar used for agreement Effective Date. */
export const BUSINESS_TIME_ZONE = "America/New_York";

/**
 * Calendar date (YYYY-MM-DD) in the Florida business timezone.
 * Avoids UTC midnight rollover: 2026-09-17T03:30Z is still 2026-09-16 in EDT.
 */
export function businessDateOnly(
  isoDateTime: string,
  timeZone = BUSINESS_TIME_ZONE,
): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return dateOnly(isoDateTime);
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    return dateOnly(isoDateTime);
  }
  return `${year}-${month}-${day}`;
}

export function addOneYear(isoDate: string) {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return isoDate;
  }
  date.setFullYear(date.getFullYear() + 1);
  return toIsoDate(date);
}

export function parseIsoDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Preview of the dates stamped at intake submit: Florida/Eastern “today”
 * as Effective Date, and that calendar day one year later as Expiration.
 * Same rule as applySubmit (`businessDateOnly(now)` + `addOneYear`).
 * Intake Review mounts this on the client so static HTML cannot bake a day.
 */
export function agreementDatePreview(now: Date | string = new Date()) {
  const iso = typeof now === "string" ? now : now.toISOString();
  const effectiveDate = businessDateOnly(iso);
  const expirationDate = addOneYear(effectiveDate);
  return {
    effectiveDate,
    expirationDate,
    effectiveLong: formatLongDate(effectiveDate),
    expirationLong: formatLongDate(expirationDate),
  };
}

export function formatLongDate(isoDate: string) {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatFormalDate(isoDate: string) {
  const date = parseIsoDate(isoDate);
  if (!date) {
    return isoDate;
  }
  const day = date.getDate();
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  const year = date.getFullYear();
  return `the ${ordinal(day)} day of ${month}, ${year}`;
}

function ordinal(day: number) {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}
