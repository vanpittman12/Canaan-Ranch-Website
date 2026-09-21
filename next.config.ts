import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  // Host-conditioned so apex `/` and `/intake` stay off the Worker proxy.
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "hero", value: "a" }],
        destination: "/preview/hero-a",
        permanent: false,
      },
      {
        source: "/",
        has: [{ type: "query", key: "hero", value: "b" }],
        destination: "/preview/hero-b",
        permanent: false,
      },
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
      {
        source: "/privacy-policy",
        destination: "/privacy",
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
