import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./supabase-browser", () => ({ accountFetch: vi.fn() }));
import { accountFetch } from "./supabase-browser";
import { saveCourse, loadCourses, finishCourse } from "./course-ui";
import { demoProfiles } from "./profile";
import { comparisonLessons } from "./lesson-service";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe("course UI adapters", () => {
  it("keeps guest courses separate for each child and replays the full lesson", async () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    });
    const [sofia, mateo] = demoProfiles();
    const [lesson] = comparisonLessons();
    const id = await saveCourse(sofia, lesson, false);
    expect((await loadCourses(sofia.id, false))[0].lesson).toEqual(lesson);
    expect(await loadCourses(mateo.id, false)).toEqual([]);
    await finishCourse(
      id,
      sofia,
      {
        topic: lesson.topic,
        style: lesson.style,
        correct: 2,
        total: 3,
        avgAnswerMs: 100,
        replays: 0,
        confused: 0,
        hintsUsed: 1,
        completed: true,
        at: new Date().toISOString(),
      },
      false,
    );
    expect((await loadCourses(sofia.id, false))[0].result?.correct).toBe(2);
    expect(accountFetch).not.toHaveBeenCalled();
  });
  it("uses accountFetch for authenticated course and profile writes", async () => {
    const profile = demoProfiles()[0];
    const [lesson] = comparisonLessons();
    vi.mocked(accountFetch).mockResolvedValue({
      id: "course-1",
      topic: lesson.topic,
      style: lesson.style,
      level: lesson.level,
      result: null,
      created_at: "2026-10-24T18:00:00Z",
    });
    expect(await saveCourse(profile, lesson, true)).toBe("course-1");
    const result = {
      topic: lesson.topic,
      style: lesson.style,
      correct: 1,
      total: 3,
      avgAnswerMs: 200,
      replays: 0,
      confused: 1,
      hintsUsed: 0,
      completed: true,
      at: new Date().toISOString(),
    };
    await finishCourse("course-1", profile, result, true);
    expect(accountFetch).toHaveBeenCalledWith(
      "/api/courses/course-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(accountFetch).toHaveBeenCalledWith(
      `/api/children/${profile.id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
    vi.mocked(accountFetch).mockResolvedValueOnce([]);
    expect(await loadCourses(profile.id, true)).toEqual([]);
    expect(accountFetch).toHaveBeenCalledWith(
      `/api/children/${profile.id}/courses?full=1`,
    );
  });
});
