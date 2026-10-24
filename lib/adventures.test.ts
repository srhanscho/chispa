import { afterEach, describe, expect, it, vi } from "vitest";
import { adventures, findAdventure } from "./adventures";
import { mockLessonService } from "./lesson-service";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("local adventure catalog", () => {
  it("resolves supported topics and accents without silently changing unknown topics", () => {
    expect(findAdventure("  EL OCÉANO ")?.id).toBe("ocean");
    expect(findAdventure("espacio")?.id).toBe("planets");
    expect(findAdventure("volcanes")).toBeUndefined();
  });
  it("provides distinct complete lessons without remote calls", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    for (const adventure of adventures) {
      const pending = mockLessonService.getLesson({
        topic: adventure.title,
        age: 8,
        style: "story",
        level: "explorer",
      });
      await vi.runAllTimersAsync();
      const lesson = await pending;
      expect(lesson.topic).toBe(adventure.title);
      expect(lesson.cards.length).toBeGreaterThanOrEqual(4);
      expect(lesson.quiz).toHaveLength(3);
      expect(
        (await mockLessonService.getReexplanation(lesson, 0, 2)).text,
      ).toBe(adventure.explanations[0]);
      expect(adventure.support).toHaveLength(lesson.cards.length);
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("returns a useful error for unsupported topics", async () => {
    await expect(
      mockLessonService.getLesson({
        topic: "Volcanes",
        age: 8,
        style: "story",
        level: "explorer",
      }),
    ).rejects.toThrow("aún no está");
  });
});
