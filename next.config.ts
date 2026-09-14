import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;

// Bindings for `next dev` only when the Cloudflare adapter is selected.
// Default `npm run dev` uses the file store and does not need Wrangler.
if (process.env.STORAGE_ADAPTER === "cloudflare") {
  initOpenNextCloudflareForDev();
}
