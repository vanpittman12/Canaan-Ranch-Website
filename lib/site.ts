import type { Metadata } from "next";
import { brand } from "./brand";

export const SITE_ORIGIN = brand.website;
export const CANONICAL_HOST = "canaanpreserve.com";
export const WWW_HOST = "www.canaanpreserve.com";

export const HOME_DESCRIPTION =
  "Canaan Preserve is an FWC Approved Tier 1 Long-Term Recipient Site. Gopher tortoise intake, downloadable relocation agreement, signature, and internal review.";

export const PRIVACY_DESCRIPTION =
  "How Canaan Preserve uses intake details to prepare a relocation agreement and contact you about that reservation.";

export const TERMS_DESCRIPTION =
  "Use of the Canaan Preserve site and relocation agreement is subject to the agreement you download.";

export function canonicalPath(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${normalized}`;
}

/** Page-specific OG/Twitter fields so legal routes do not inherit the homepage blurb. */
export function pageShareMetadata(
  path: `/${string}`,
  title: string,
  description: string,
): Pick<Metadata, "description" | "alternates" | "openGraph" | "twitter"> {
  const canonical = canonicalPath(path);
  return {
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

/** Redirect www to the apex host. Other hosts (localhost, previews) stay put. */
export function wwwToApexUrl(url: URL): URL | null {
  const host = url.hostname.replace(/\.$/, "").toLowerCase();
  if (host !== WWW_HOST) {
    return null;
  }
  const next = new URL(url.toString());
  next.protocol = "https:";
  next.hostname = CANONICAL_HOST;
  return next;
}
