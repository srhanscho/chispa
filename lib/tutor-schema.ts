import { z } from "zod";
import { LevelSchema, StyleSchema } from "./schema";

// Tutor agent contract (additive; does not change lib/schema.ts).

export const LearnerSummarySchema = z.object({
  name: z.string().max(40),
  age: z.number().int().min(4).max(12),
  styleScores: z.record(StyleSchema, z.number()).optional(),
  mastery: z.record(z.string(), z.number()).optional(),
  recentTopics: z.array(z.string().max(100)).max(20).optional(),
});

export const TutorTurnSchema = z.object({
  role: z.enum(["child", "lulo"]),
  text: z.string().max(600),
});

export const TutorRequestSchema = z.object({
  message: z.string().min(1).max(400),
  learner: LearnerSummarySchema,
  // The lesson the child is looking at, if any, so Lulo can answer questions about it.
  lesson: z
    .object({
      topic: z.string(),
      level: LevelSchema.optional(),
      cards: z.array(z.object({ title: z.string(), text: z.string() })).max(6),
    })
    .optional(),
  history: z.array(TutorTurnSchema).max(10).default([]),
});

export const TutorActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  // The child wants to learn something new: the UI can start a lesson on this topic.
  z.object({ type: z.literal("start_lesson"), topic: z.string().min(2).max(100) }),
  // The child is ready to practice: the UI can jump to the quiz.
  z.object({ type: z.literal("start_quiz") }),
]);

export const TutorReplySchema = z.object({
  text: z.string(),
  speech: z.string(),
  action: TutorActionSchema,
});

export const SuggestRequestSchema = z.object({ learner: LearnerSummarySchema });

export const SuggestReplySchema = z.object({
  topics: z.array(z.object({ topic: z.string(), why: z.string(), style: StyleSchema })).min(1).max(4),
});

export type LearnerSummary = z.infer<typeof LearnerSummarySchema>;
export type TutorRequest = z.infer<typeof TutorRequestSchema>;
export type TutorReply = z.infer<typeof TutorReplySchema>;
export type SuggestReply = z.infer<typeof SuggestReplySchema>;
