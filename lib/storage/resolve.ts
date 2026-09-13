import type { EngagementStore, StorageAdapterName } from "./types";

let cached: Promise<EngagementStore> | null = null;

export function resolveStorageAdapter(): StorageAdapterName {
  const value = process.env.STORAGE_ADAPTER?.trim().toLowerCase();
  if (value === "cloudflare") {
    return "cloudflare";
  }
  return "file";
}

export function resetStoreCache() {
  cached = null;
}

export function getStore(): Promise<EngagementStore> {
  if (!cached) {
    cached = loadStore();
  }
  return cached;
}

async function loadStore(): Promise<EngagementStore> {
  if (resolveStorageAdapter() === "cloudflare") {
    const { cloudflareStore } = await import("./cloudflare");
    return cloudflareStore;
  }
  const { fileStore } = await import("./file");
  return fileStore;
}
