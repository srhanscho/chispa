import { describe, expect, it } from "vitest";
import { childProfile, completeProfile, profilePayload } from "./learner-ui";
import { demoProfiles } from "./profile";
import type { SessionLog } from "./engine";

const session: SessionLog = {
  topic: "Dinosaurios",
  style: "story",
  correct: 2,
  total: 3,
  avgAnswerMs: 800,
  replays: 1,
  confused: 1,
  hintsUsed: 1,
  completed: true,
  at: "2026-10-24T18:00:00Z",
};
describe("learner UI state", () => {
  it("restores empty server profiles with safe engine defaults", () => {
    const profile = childProfile({
      id: "child-1",
      name: "Luna",
      age: 8,
      profile: {},
    });
    expect(profile.id).toBe("child-1");
    expect(profile.name).toBe("Luna");
    expect(profile.styleScores.visual).toBe(0.5);
    expect(profile.sessions).toEqual([]);
  });
  it("updates the selected learner, sticker and daily streak without changing peers", () => {
    const [sofia, mateo] = demoProfiles();
    const before = JSON.stringify(mateo);
    const first = completeProfile(sofia, session, "/lulo.svg");
    expect(first.stars).toBe(3);
    expect(first.mastery.Dinosaurios).toBeGreaterThan(0);
    expect(first.styleScores.story).not.toBe(sofia.styleScores.story);
    expect(first.stickers).toHaveLength(1);
    expect(first.streak.days).toBe(1);
    const sameDay = completeProfile(first, session, "/lulo.svg");
    expect(sameDay.streak.days).toBe(1);
    expect(sameDay.stickers).toHaveLength(1);
    const nextDay = completeProfile(
      sameDay,
      { ...session, at: "2026-10-25T18:00:00Z" },
      "/lulo.svg",
    );
    expect(nextDay.streak.days).toBe(2);
    expect(JSON.stringify(mateo)).toBe(before);
  });
  it("sends engine state without replacing account identity fields", () => {
    const payload = profilePayload(demoProfiles()[0]);
    expect(payload.profile).not.toHaveProperty("id");
    expect(payload.profile).not.toHaveProperty("name");
    expect(payload.profile).not.toHaveProperty("age");
    expect(payload.profile).toHaveProperty("styleScores");
  });
});
