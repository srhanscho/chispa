import { describe, expect, it } from "vitest";
import { createProfile, levelFor, pickStyle, recordSession, sessionOutcome } from "./engine";
import type { SessionLog } from "./engine";

const baseSession: SessionLog = {
  topic: "Dinosaurios",
  style: "story",
  correct: 3,
  total: 3,
  avgAnswerMs: 4000,
  replays: 0,
  confused: 0,
  hintsUsed: 0,
  completed: true,
  at: "2026-10-24T10:00:00.000Z",
};

describe("sessionOutcome", () => {
  it("is 1 for a perfect, completed session", () => {
    expect(sessionOutcome(baseSession)).toBe(1);
  });

  it("penalizes confusion and abandonment", () => {
    expect(sessionOutcome({ ...baseSession, confused: 2 })).toBeCloseTo(0.8);
    expect(sessionOutcome({ ...baseSession, completed: false })).toBeCloseTo(0.7);
  });

  it("never leaves the 0..1 range", () => {
    expect(sessionOutcome({ ...baseSession, correct: 0, confused: 10, completed: false })).toBe(0);
  });
});

describe("recordSession", () => {
  it("moves the used style score toward the outcome", () => {
    const profile = createProfile("Sofía", 7);
    const updated = recordSession(profile, baseSession);
    expect(updated.styleScores.story).toBeCloseTo(0.65);
    expect(updated.styleScores.visual).toBe(0.5);
    expect(updated.styleUses.story).toBe(1);
  });

  it("raises mastery with correct answers and lowers it a little with mistakes", () => {
    const profile = createProfile("Sofía", 7);
    const updated = recordSession(profile, { ...baseSession, correct: 2, total: 3 });
    expect(updated.mastery.Dinosaurios).toBe(20);
  });

  it("does not mutate the original profile", () => {
    const profile = createProfile("Sofía", 7);
    recordSession(profile, baseSession);
    expect(profile.styleScores.story).toBe(0.5);
    expect(profile.sessions).toHaveLength(0);
  });

  it("keeps only the last 20 sessions", () => {
    let profile = createProfile("Sofía", 7);
    for (let i = 0; i < 25; i++) profile = recordSession(profile, baseSession);
    expect(profile.sessions).toHaveLength(20);
  });
});

describe("pickStyle", () => {
  it("exploits the best style when the random roll is above epsilon", () => {
    const profile = createProfile("Sofía", 7);
    profile.styleScores.visual = 0.9;
    expect(pickStyle(profile, () => 0.99)).toBe("visual");
  });

  it("explores a random style when the roll is below epsilon", () => {
    const profile = createProfile("Sofía", 7);
    profile.styleScores.visual = 0.9;
    const rolls = [0.1, 0];
    expect(pickStyle(profile, () => rolls.shift() ?? 0)).toBe("story");
  });
});

describe("levelFor", () => {
  it("maps mastery to levels", () => {
    expect(levelFor(0)).toBe("explorer");
    expect(levelFor(40)).toBe("adventurer");
    expect(levelFor(80)).toBe("expert");
  });
});
