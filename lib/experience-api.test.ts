import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestNote,
  requestSuggestions,
  requestTutor,
} from "./experience-api";
import { demoProfiles } from "./profile";
import { comparisonLessons } from "./lesson-service";

afterEach(() => vi.unstubAllGlobals());
describe("experience API contracts", () => {
  it("sends at most ten prior turns and preserves tutor actions", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          text: "Practiquemos",
          speech: "Practiquemos",
          action: { type: "start_quiz" },
        }),
      });
    vi.stubGlobal("fetch", fetch);
    const reply = await requestTutor({
      message: "Estoy listo",
      learner: { name: "Sofía", age: 7 },
      history: Array.from({ length: 14 }, () => ({
        role: "child" as const,
        text: "Una pregunta",
      })),
    });
    expect(reply.action.type).toBe("start_quiz");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/tutor");
    expect(JSON.parse(init.body).history).toHaveLength(10);
    expect(init.headers).not.toHaveProperty("Authorization");
  });
  it("accepts a new-topic action without confusing it with a plain reply", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            text: "Vamos",
            speech: "Vamos",
            action: { type: "start_lesson", topic: "volcanes" },
          }),
        }),
    );
    expect(
      (
        await requestTutor({
          message: "Quiero aprender volcanes",
          learner: { name: "Mateo", age: 8 },
          history: [],
        })
      ).action,
    ).toEqual({ type: "start_lesson", topic: "volcanes" });
  });
  it("validates note and suggestion payloads for the selected learner", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          note: "Probemos otra historia.",
          nextStyle: "story",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          topics: [
            { topic: "volcanes", why: "Conoce la Tierra", style: "game" },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetch);
    const profile = demoProfiles()[1];
    expect((await requestNote(profile)).note).toContain("historia");
    expect(JSON.parse(fetch.mock.calls[0][1].body).name).toBe("Mateo");
    expect((await requestSuggestions(profile)).topics[0].style).toBe("game");
  });
  it("uses distinct bundled classes for the comparison", () => {
    const [story, visual] = comparisonLessons();
    expect(story.style).toBe("story");
    expect(visual.style).toBe("visual");
    expect(story.topic).toBe(visual.topic);
    expect(story.cards[0].text).not.toBe(visual.cards[0].text);
  });
});
