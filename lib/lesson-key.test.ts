import { describe, expect, it } from "vitest";
import { lessonKey, topicSlug, pickDemoFile } from "./lesson-key";

describe("topicSlug", () => {
  it("normalizes case, accents and leading articles", () => {
    expect(topicSlug("Los Dinosaurios")).toBe("dinosaurios");
    expect(topicSlug("el Sistema Solar")).toBe("sistema-solar");
    expect(topicSlug("  ¡Las ABEJAS! ")).toBe("abejas");
    expect(topicSlug("Frutas tropicales")).toBe("frutas-tropicales");
  });
});

describe("lessonKey", () => {
  it("combines topic, style and level", () => {
    expect(lessonKey({ topic: "Los volcanes", style: "visual", level: "explorer" })).toBe(
      "volcanes__visual__explorer",
    );
  });
});

describe("pickDemoFile", () => {
  const files = ["dinosaurios__story__explorer.json", "dinosaurios__visual__explorer.json", "dinosaurios.json"];

  it("prefers the exact topic, style and level", () => {
    expect(pickDemoFile(files, { topic: "dinosaurios", style: "visual", level: "explorer" })).toBe(
      "dinosaurios__visual__explorer.json",
    );
  });

  it("falls back to the same topic in any style", () => {
    expect(pickDemoFile(files, { topic: "Los dinosaurios", style: "game", level: "expert" })).toBe(
      "dinosaurios__story__explorer.json",
    );
  });

  it("returns null when the topic has no demo", () => {
    expect(pickDemoFile(files, { topic: "volcanes", style: "story", level: "explorer" })).toBeNull();
  });
});
