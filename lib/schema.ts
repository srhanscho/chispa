import { z } from "zod";

// Shared contract between the UI and the AI layer. Change it only by agreement.

export const STYLES = ["story", "visual", "analogy", "stepByStep", "game"] as const;
export const LEVELS = ["explorer", "adventurer", "expert"] as const;

export const StyleSchema = z.enum(STYLES);
export const LevelSchema = z.enum(LEVELS);

export const ImageRequestSchema = z.object({
  kind: z.enum(["photo", "illustration"]),
  query: z.string().min(2).max(200),
});

export const CardSchema = z.object({
  title: z.string(),
  text: z.string(),
  speech: z.string(),
  image: ImageRequestSchema,
});

export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(3),
  answerIndex: z.number().int().min(0).max(2),
  hint: z.string(),
});

export const LessonSchema = z.object({
  topic: z.string(),
  style: StyleSchema,
  level: LevelSchema,
  cover: ImageRequestSchema,
  cards: z.array(CardSchema).min(3).max(6),
  quiz: z.array(QuizQuestionSchema).min(1).max(5),
  sticker: z.object({ name: z.string(), query: z.string() }),
});

export const LessonRequestSchema = z.object({
  topic: z.string().min(2).max(100),
  age: z.number().int().min(4).max(12),
  style: StyleSchema,
  level: LevelSchema,
});

export const ReexplainRequestSchema = z.object({
  question: z.string(),
  chosen: z.string(),
  correct: z.string(),
  style: StyleSchema,
  age: z.number().int().min(4).max(12),
});

export const ReexplainSchema = z.object({
  text: z.string(),
  speech: z.string(),
});

export const NoteSchema = z.object({
  note: z.string(),
  nextStyle: StyleSchema,
});

export const TopicFromPhotoSchema = z.object({
  topic: z.string(),
  hook: z.string(),
});

export type Style = z.infer<typeof StyleSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type ImageRequest = z.infer<typeof ImageRequestSchema>;
export type Card = z.infer<typeof CardSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonRequest = z.infer<typeof LessonRequestSchema>;
export type Reexplain = z.infer<typeof ReexplainSchema>;
export type Note = z.infer<typeof NoteSchema>;
