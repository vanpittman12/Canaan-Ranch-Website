import { brand } from "./brand";

export const SITE_ORIGIN = brand.website;
export const CANONICAL_HOST = "canaanpreserve.com";
export const WWW_HOST = "www.canaanpreserve.com";

export function canonicalPath(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${normalized}`;
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
