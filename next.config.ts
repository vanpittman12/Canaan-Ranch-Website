import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
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
