import { describe, expect, it } from "vitest";
import { searchQueries } from "./query";

describe("searchQueries", () => {
  it("keeps short queries as the first attempt", () => {
    expect(searchQueries("volcano mountain")[0]).toBe("volcano mountain");
  });

  it("strips filler words from descriptive prompts and shortens step by step", () => {
    expect(searchQueries("illustration of volcano showing red magma inside")).toEqual([
      "illustration of volcano showing red magma inside",
      "volcano red magma",
      "volcano red",
      "volcano",
    ]);
  });

  it("does not repeat identical attempts", () => {
    expect(searchQueries("dolphin")).toEqual(["dolphin"]);
  });

  it("ignores punctuation and casing", () => {
    expect(searchQueries("A cute, friendly T-Rex!")).toEqual(["A cute, friendly T-Rex!", "t-rex"]);
  });
});
