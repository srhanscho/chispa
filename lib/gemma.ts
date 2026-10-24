import "server-only";
import { GoogleGenAI, type Part } from "@google/genai";
import type { z } from "zod";
import { extractJson } from "./json";
import { thinkingLevelFrom } from "./gemma-config";
import { buildSuggestPrompt, buildTutorPrompt } from "./tutor-prompt";
import {
  SuggestReplySchema,
  TutorReplySchema,
  type LearnerSummary,
  type SuggestReply,
  type TutorReply,
  type TutorRequest,
} from "./tutor-schema";
import { STYLE_DESCRIPTIONS } from "./engine";
import {
  LessonSchema,
  NoteSchema,
  ReexplainSchema,
  TopicFromPhotoSchema,
  type Lesson,
  type LessonRequest,
  type Note,
  type Reexplain,
  type Style,
} from "./schema";

const MODEL = process.env.GEMMA_MODEL ?? "gemma-4-26b-a4b-it";
const THINKING_LEVEL = thinkingLevelFrom(process.env.GEMMA_THINKING);

const LULO = `You are Lulo, a curious and kind young iguana (a boy) from Barranquilla, Colombia, who teaches children.
He wears a sombrero vueltiao and a yellow Colombia jersey, and speaks with warmth and humor.
You always write in simple Spanish for children. You never tell a child they are wrong; you encourage them.
You may use at most one light Colombian coastal expression ("¡Ajá!", "¡Qué chévere!", "¡Ey, mira!") per answer.
You only talk about child-appropriate topics. If a topic is not appropriate, choose a nearby safe topic.`;

let client: GoogleGenAI | null = null;
function ai() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

async function generateJson<T>(schema: z.ZodType<T>, parts: Part[], retries = 1): Promise<T> {
  let lastError: unknown;
  let request = parts;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const startedAt = Date.now();
    const response = await ai().models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: request }],
      config: { systemInstruction: LULO, thinkingConfig: { thinkingLevel: THINKING_LEVEL } },
    });
    const usage = response.usageMetadata;
    console.info(
      `[gemma] ${MODEL} thinking=${THINKING_LEVEL} ${Date.now() - startedAt}ms ` +
        `thoughts=${usage?.thoughtsTokenCount ?? 0} output=${usage?.candidatesTokenCount ?? 0}`,
    );
    try {
      return schema.parse(extractJson(response.text ?? ""));
    } catch (error) {
      lastError = error;
      request = [
        ...parts,
        { text: `Your previous answer was not valid JSON for the schema. Error: ${String(error)}. Return ONLY the JSON object.` },
      ];
    }
  }
  throw lastError;
}

const LESSON_SHAPE = `{
  "topic": string,
  "style": "story" | "visual" | "analogy" | "stepByStep" | "game",
  "level": "explorer" | "adventurer" | "expert",
  "cover": { "kind": "illustration", "query": string },
  "cards": [{ "title": string, "text": string, "speech": string, "image": { "kind": "photo" | "illustration", "query": string } }],
  "quiz": [{ "question": string, "options": [string, string, string], "answerIndex": 0 | 1 | 2, "hint": string }],
  "sticker": { "name": string, "query": string }
}`;

export function generateLesson(req: LessonRequest): Promise<Lesson> {
  const prompt = `Create a lesson about "${req.topic}" for a child aged ${req.age}.
Teaching style: ${req.style}. ${STYLE_DESCRIPTIONS[req.style]}
Difficulty: ${req.level}.
Rules:
- 4 or 5 cards. Each "text" has at most 3 short sentences in Spanish.
- "speech" is the same idea adapted to be read aloud, short sentences.
- For each card choose an image: kind "photo" for real things (animals, fossils, planets, places) with a short, concrete English search query for Wikimedia Commons; kind "illustration" for scenes or ideas with a short English description.
- "cover" and "sticker.query" are short English descriptions for an illustration.
- Exactly 3 quiz questions in Spanish with 3 options each, based only on the cards.
- "style" must be "${req.style}" and "level" must be "${req.level}".
Return ONLY a JSON object with this shape:
${LESSON_SHAPE}`;
  return generateJson(LessonSchema, [{ text: prompt }]);
}

export function reexplain(input: {
  question: string;
  chosen: string;
  correct: string;
  style: Style;
  age: number;
}): Promise<Reexplain> {
  const prompt = `A child aged ${input.age} answered a quiz question.
Question: "${input.question}"
The child chose: "${input.chosen}". The correct answer is: "${input.correct}".
Explain the idea again in a different way, in 2 short sentences in Spanish, starting with "¡Casi!".
Use this teaching style: ${input.style}. ${STYLE_DESCRIPTIONS[input.style]}
Return ONLY JSON: { "text": string, "speech": string }`;
  return generateJson(ReexplainSchema, [{ text: prompt }]);
}

export function writeNote(input: {
  name: string;
  styleScores: Record<Style, number>;
  mastery: Record<string, number>;
  recentSessions: unknown[];
}): Promise<Note> {
  const prompt = `You are writing for the parent or teacher of ${input.name}.
Style scores (0 to 1, higher means the child learns better that way): ${JSON.stringify(input.styleScores)}
Mastery by topic (0 to 100): ${JSON.stringify(input.mastery)}
Recent sessions: ${JSON.stringify(input.recentSessions)}
Write 3 short sentences in Spanish, without jargon: how the child learns best, what is hard for them, and what we will try next.
Also choose the style to try next.
Return ONLY JSON: { "note": string, "nextStyle": "story" | "visual" | "analogy" | "stepByStep" | "game" }`;
  return generateJson(NoteSchema, [{ text: prompt }]);
}

export function topicFromPhoto(imageBase64: string, mimeType: string) {
  const prompt = `A child took this photo because they want to learn about it.
Suggest one child-friendly topic to learn about, in Spanish (2 to 4 words), and one exciting hook sentence in Spanish.
Return ONLY JSON: { "topic": string, "hook": string }`;
  return generateJson(TopicFromPhotoSchema, [
    { inlineData: { mimeType, data: imageBase64 } },
    { text: prompt },
  ]);
}

export function tutorReply(req: TutorRequest): Promise<TutorReply> {
  return generateJson(TutorReplySchema, [{ text: buildTutorPrompt(req) }]);
}

export function suggestTopics(learner: LearnerSummary): Promise<SuggestReply> {
  return generateJson(SuggestReplySchema, [{ text: buildSuggestPrompt(learner) }]);
}
