import { z } from "zod";
import { LessonSchema, LevelSchema, StyleSchema } from "./schema";

// Account contract (additive; does not change lib/schema.ts).

export const NewChildSchema = z.object({
  name: z.string().trim().min(1).max(40),
  age: z.number().int().min(4).max(12),
  profile: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateChildSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    age: z.number().int().min(4).max(12).optional(),
    // The adaptive engine state from lib/engine.ts (LearnerProfile without id/name/age).
    profile: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const SessionResultSchema = z.object({
  correct: z.number().int().min(0),
  total: z.number().int().min(1),
  avgAnswerMs: z.number().min(0),
  replays: z.number().int().min(0),
  confused: z.number().int().min(0),
  hintsUsed: z.number().int().min(0),
  completed: z.boolean(),
});

export const NewCourseSchema = z.object({
  lesson: LessonSchema,
  result: SessionResultSchema.optional(),
});

export const UpdateCourseSchema = z.object({ result: SessionResultSchema });

export const CourseSummarySchema = z.object({
  id: z.string(),
  topic: z.string(),
  style: StyleSchema,
  level: LevelSchema,
  result: SessionResultSchema.nullable(),
  created_at: z.string(),
});
