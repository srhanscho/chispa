import { findAdventure } from "./adventures";
import {
  LessonSchema,
  ReexplainSchema,
  type Lesson,
  type LessonRequest,
  type Reexplain,
} from "./schema";

export interface LessonService {
  getLesson(input: LessonRequest): Promise<Lesson>;
  getReexplanation(
    lesson: Lesson,
    questionIndex: number,
    chosen: number,
  ): Promise<Reexplain>;
}

export const mockLessonService: LessonService = {
  async getLesson(input) {
    const adventure = findAdventure(input.topic);
    if (!adventure)
      throw new Error(
        "Esa aventura aún no está en el cuaderno. Elige Dinosaurios, Planetas o El océano.",
      );
    await new Promise((resolve) => setTimeout(resolve, 650));
    return LessonSchema.parse(adventure.lesson);
  },
  async getReexplanation(lesson, questionIndex) {
    const text =
      findAdventure(lesson.topic)?.explanations[questionIndex] ??
      "¡Casi! Vamos a descubrirlo juntos.";
    return { text, speech: text };
  },
};

async function post(route: string, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error("No pudimos preparar la aventura. Inténtalo de nuevo.");
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const httpLessonService: LessonService = {
  async getLesson(input) {
    return LessonSchema.parse(await post("/api/lesson", input));
  },
  async getReexplanation(lesson, questionIndex, chosen) {
    const question = lesson.quiz[questionIndex];
    return ReexplainSchema.parse(
      await post("/api/reexplain", {
        question: question.question,
        chosen: question.options[chosen],
        correct: question.options[question.answerIndex],
        style: lesson.style,
        age: 8,
      }),
    );
  },
};

export const isDemo = process.env.NEXT_PUBLIC_LESSON_SOURCE !== "http";
export const lessonService = isDemo ? mockLessonService : httpLessonService;

export function getCardSupport(lesson: Lesson, index: number): string {
  return isDemo
    ? (findAdventure(lesson.topic)?.support[index] ?? lesson.cards[index].text)
    : `Vamos paso a paso. ${lesson.cards[index].text}`;
}
