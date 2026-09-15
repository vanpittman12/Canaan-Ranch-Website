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
