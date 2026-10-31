import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Report-only policy for now; promote to enforced once reports are clean.
// Turnstile (challenges.cloudflare.com) is allowed for when PR #69 gets keys.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// No `preload` yet: hard to undo, held for Van's decision.
const HSTS_VALUE = "max-age=31536000; includeSubDomains";

// Applied to every Worker response. Static assets get the same set from
// `public/_headers` (keep both in sync). Enforced CSP stays frame-ancestors only.
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: HSTS_VALUE },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  // `/intake` is force-static. Next’s default for that is a one-year CDN
  // s-maxage, and the live document is a CDN HIT. The HTML names the client
  // chunks, so that HIT keeps the previous Submit bundle after a deploy.
  // Hashed `/_next/static` files stay immutable. Do not set s-maxage here:
  // OpenNext rewrites a numeric s-maxage into a long stale-while-revalidate.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/intake",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  // Host-conditioned so apex `/` and `/intake` stay off the Worker proxy.
  async redirects() {
    return [
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/",
        has: [{ type: "host", value: "www.canaanpreserve.com" }],
        destination: "https://canaanpreserve.com/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.canaanpreserve.com" }],
        destination: "https://canaanpreserve.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// Bindings for `next dev` only when the Cloudflare adapter is selected.
// Default `npm run dev` uses the file store and does not need Wrangler.
if (process.env.STORAGE_ADAPTER === "cloudflare") {
  initOpenNextCloudflareForDev();
}
