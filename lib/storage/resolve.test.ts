import { afterEach, describe, expect, it } from "vitest";
import { resetStoreCache, resolveStorageAdapter } from "./resolve";

const original = process.env.STORAGE_ADAPTER;

afterEach(() => {
  if (original === undefined) {
    delete process.env.STORAGE_ADAPTER;
  } else {
    process.env.STORAGE_ADAPTER = original;
  }
  resetStoreCache();
});

describe("resolveStorageAdapter", () => {
  it("defaults to the local file store", () => {
    delete process.env.STORAGE_ADAPTER;
    expect(resolveStorageAdapter()).toBe("file");
  });

  it("uses Cloudflare when STORAGE_ADAPTER=cloudflare", () => {
    process.env.STORAGE_ADAPTER = "cloudflare";
    expect(resolveStorageAdapter()).toBe("cloudflare");
  });

  it("treats unknown values as file so local next dev stays usable", () => {
    process.env.STORAGE_ADAPTER = "kv";
    expect(resolveStorageAdapter()).toBe("file");
  });
});
