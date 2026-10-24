import { afterEach, describe, expect, it, vi } from "vitest";
import { adventures } from "./adventures";
import {
  awardProgress,
  emptyProgress,
  JourneySchema,
  readStored,
  storeLocal,
  type Journey,
} from "./journey";

const journey: Journey = {
  stage: "quiz",
  lesson: adventures[0].lesson,
  step: 1,
  choice: 0,
  submitted: true,
  correct: 1,
  help: 2,
  feedback: "Probemos juntos.",
};
afterEach(() => vi.unstubAllGlobals());

describe("saved adventures", () => {
  it("retains a submitted answer and score when resumed", () => {
    const restored = JourneySchema.parse(JSON.parse(JSON.stringify(journey)));
    expect(restored.submitted).toBe(true);
    expect(restored.choice).toBe(0);
    expect(restored.correct).toBe(1);
  });
  it("rejects out of range positions and impossible scores", () => {
    expect(JourneySchema.safeParse({ ...journey, step: 999 }).success).toBe(
      false,
    );
    expect(JourneySchema.safeParse({ ...journey, correct: 3 }).success).toBe(
      false,
    );
    expect(JourneySchema.safeParse({ ...journey, choice: null }).success).toBe(
      false,
    );
    expect(
      JourneySchema.safeParse({ ...journey, stage: "lesson" }).success,
    ).toBe(false);
  });
  it("handles corrupt and blocked storage without losing the in-memory flow", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => "{broken",
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readStored("session", JourneySchema.nullable(), null)).toBeNull();
    expect(() => storeLocal("session", journey)).not.toThrow();
  });
  it("rewards participation without duplicating a collected sticker", () => {
    const first = awardProgress(emptyProgress, { ...journey, correct: 0 });
    expect(first.stars).toBe(1);
    const second = awardProgress(first, { ...journey, correct: 2 });
    expect(second.stars).toBe(4);
    expect(second.stickers).toHaveLength(1);
    expect(second.sessions).toBe(2);
  });
});
