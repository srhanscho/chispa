import { describe, expect, it } from "vitest";
import { ThinkingLevel } from "@google/genai";
import { thinkingLevelFrom } from "./gemma-config";

describe("thinkingLevelFrom", () => {
  it("defaults to minimal thinking so lessons come back fast", () => {
    expect(thinkingLevelFrom(undefined)).toBe(ThinkingLevel.MINIMAL);
  });

  it("accepts the documented levels case-insensitively", () => {
    expect(thinkingLevelFrom("high")).toBe(ThinkingLevel.HIGH);
    expect(thinkingLevelFrom("MINIMAL")).toBe(ThinkingLevel.MINIMAL);
  });

  it("falls back to minimal on unknown values", () => {
    expect(thinkingLevelFrom("turbo")).toBe(ThinkingLevel.MINIMAL);
  });
});
