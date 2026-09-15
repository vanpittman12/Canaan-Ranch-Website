import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Dummy incremental cache drops force-static HTML (privacy/terms) on Workers.
// Static-assets cache ships the prerendered routes with the deploy.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});

