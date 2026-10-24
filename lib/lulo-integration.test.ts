import { afterEach, describe, expect, it, vi } from "vitest";
import { initialLuloState, luloReducer, type LuloEvent } from "./lulo";
import { getCardSupport, httpLessonService, mockLessonService } from "./lesson-service";
import { speak, stopSpeaking } from "./speech";

afterEach(() => { stopSpeaking(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Lulo integration", () => {
  it("maps the full journey using the supplied JSON visual contract", () => {
    const journey: [LuloEvent, string][] = [["APP_READY", "home"], ["LESSON_REQUESTED", "loading"],
      ["LESSON_CARD_SHOWN", "lesson"], ["QUIZ_STARTED", "quiz"], ["CHILD_NEEDS_HELP", "encourage"], ["REWARD_EARNED", "reward"]];
    let state = initialLuloState;
    for (const [event, scene] of journey) {
      state = luloReducer(state, event);
      expect(state.scene).toBe(scene);
    }
  });

  it("keeps the current scene while speech starts and ends", () => {
    const lesson = luloReducer(initialLuloState, "LESSON_CARD_SHOWN");
    expect(luloReducer(lesson, "SPEECH_STARTED")).toEqual({ scene: "lesson", isSpeaking: true });
    expect(luloReducer(luloReducer(lesson, "SPEECH_STARTED"), "SPEECH_ENDED")).toEqual(lesson);
  });

  it("provides the full canonical demo and alternative help without calling APIs", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const pending = mockLessonService.getLesson({ topic: "Dinosaurios", age: 8, style: "story", level: "explorer" });
    await vi.runAllTimersAsync();
    const lesson = await pending;
    expect(lesson.topic).toBe("Dinosaurios");
    expect(lesson.cards).toHaveLength(5); expect(lesson.quiz).toHaveLength(3);
    expect(getCardSupport(lesson, 0)).not.toBe(lesson.cards[0].text);
    expect((await mockLessonService.getReexplanation(lesson, 0, 0)).text).toContain("T-Rex");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed lessons from the HTTP adapter", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cards: [] }) }));
    await expect(httpLessonService.getLesson({ topic: "Mar", age: 8, style: "story", level: "explorer" })).rejects.toThrow();
  });
});

class Utterance {
  onstart?: () => void; onend?: () => void; onerror?: () => void;
  constructor(public text: string) {}
}

function speechBrowser() {
  const queued: Utterance[] = [];
  vi.stubGlobal("window", { speechSynthesis: { cancel: vi.fn(), getVoices: () => [], speak: (utterance: Utterance) => queued.push(utterance) } });
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  return queued;
}

describe("speech lifecycle", () => {
  it("ignores late events from a canceled utterance", () => {
    const queued = speechBrowser(); const first = vi.fn(); const second = vi.fn();
    speak("Primera tarjeta", first); queued[0].onstart?.();
    speak("Segunda tarjeta", second); queued[1].onstart?.(); queued[0].onend?.();
    expect(first.mock.calls).toEqual([[true], [false]]);
    expect(second.mock.calls).toEqual([[true]]);
    queued[1].onend?.(); expect(second.mock.calls).toEqual([[true], [false]]);
  });
  it("clears speaking on cancellation and errors", () => {
    const queued = speechBrowser(); const speaking = vi.fn();
    speak("Hola", speaking); queued[0].onstart?.(); stopSpeaking();
    speak("Otra vez", speaking); queued[1].onstart?.(); queued[1].onerror?.();
    expect(speaking.mock.calls).toEqual([[true], [false], [true], [false]]);
  });
  it("works without browser speech support", () => {
    vi.stubGlobal("window", {});
    expect(() => speak("Puedes leer conmigo")).not.toThrow();
  });
});
