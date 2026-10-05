import { describe, expect, it } from "vitest";
import { isPlausibleServerActionId } from "./server-action-id";

describe("isPlausibleServerActionId", () => {
  it("accepts 42-character ids", () => {
    expect(isPlausibleServerActionId("a".repeat(42))).toBe(true);
  });

  it("rejects empty, short, and long ids", () => {
    expect(isPlausibleServerActionId("")).toBe(false);
    expect(isPlausibleServerActionId("short")).toBe(false);
    expect(isPlausibleServerActionId("a".repeat(41))).toBe(false);
    expect(isPlausibleServerActionId("a".repeat(43))).toBe(false);
  });
});
