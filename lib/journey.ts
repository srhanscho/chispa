import { z } from "zod";
import { LessonSchema } from "./schema";

export const PROGRESS_KEY = "chispa:lulo-progress:v1";
export const JOURNEY_KEY = "chispa:journey:v1";
export const PREFERENCES_KEY = "chispa:preferences:v1";
const counter = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const ProgressSchema = z.object({
  stars: counter,
  sessions: counter,
  correct: counter,
  questions: counter,
  help: counter,
  stickers: z.array(z.string()).max(100),
});
export type Progress = z.infer<typeof ProgressSchema>;
export const emptyProgress: Progress = {
  stars: 0,
  sessions: 0,
  correct: 0,
  questions: 0,
  help: 0,
  stickers: [],
};

export const PreferencesSchema = z.object({
  largeText: z.boolean(),
  reduceMotion: z.boolean(),
});
export type Preferences = z.infer<typeof PreferencesSchema>;
export const defaultPreferences: Preferences = {
  largeText: false,
  reduceMotion: false,
};

export const JourneySchema = z
  .object({
    stage: z.enum(["lesson", "quiz"]),
    lesson: LessonSchema,
    step: counter,
    choice: z.number().int().min(0).max(2).nullable(),
    submitted: z.boolean(),
    correct: counter,
    help: counter,
    feedback: z.string().max(4000),
    learnerId: z.string().optional(),
    courseId: z.string().optional(),
    replays: counter.optional(),
    confused: counter.optional(),
    hintsUsed: counter.optional(),
    answerMs: z.array(z.number().nonnegative()).max(5).optional(),
  })
  .superRefine((value, context) => {
    const length =
      value.stage === "lesson"
        ? value.lesson.cards.length
        : value.lesson.quiz.length;
    if (value.step >= length)
      context.addIssue({ code: "custom", message: "Invalid position" });
    if (value.submitted && value.choice === null)
      context.addIssue({ code: "custom", message: "Missing answer" });
    if (value.stage === "lesson" && (value.submitted || value.choice !== null))
      context.addIssue({ code: "custom", message: "Unexpected quiz answer" });
    const answered =
      value.stage === "lesson" ? 0 : value.step + (value.submitted ? 1 : 0);
    if (value.correct > answered)
      context.addIssue({ code: "custom", message: "Invalid score" });
  });
export type Journey = z.infer<typeof JourneySchema>;

// Corrupt or unavailable browser storage never prevents learning.
export function readStored<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  try {
    const result = schema.safeParse(
      JSON.parse(localStorage.getItem(key) ?? "null"),
    );
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export function storeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* In-memory session remains available. */
  }
}

export function clearJourney() {
  try {
    localStorage.removeItem(JOURNEY_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}

export function awardProgress(progress: Progress, journey: Journey): Progress {
  return {
    stars: progress.stars + 1 + journey.correct,
    sessions: progress.sessions + 1,
    correct: progress.correct + journey.correct,
    questions: progress.questions + journey.lesson.quiz.length,
    help: progress.help + journey.help,
    stickers: [...new Set([...progress.stickers, journey.lesson.sticker.name])],
  };
}
