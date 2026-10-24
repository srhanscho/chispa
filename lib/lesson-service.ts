import { findAdventure } from "./adventures";
import story from "../public/demo/lessons/dinosaurios__story__explorer.json";
import visual from "../public/demo/lessons/dinosaurios__visual__explorer.json";
import volcanoes from "../public/demo/lessons/volcanes__game__explorer.json";
import fruit from "../public/demo/lessons/frutas-tropicales__story__explorer.json";
import { experiencePost } from "./experience-api";
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
    age?: number,
  ): Promise<Reexplain>;
}

export const mockLessonService: LessonService = {
  async getLesson(input) {
    const normalized = input.topic.toLocaleLowerCase("es");
    if (normalized.includes("dinosaur"))
      return LessonSchema.parse(input.style === "visual" ? visual : story);
    if (normalized.includes("volcan")) return LessonSchema.parse(volcanoes);
    if (normalized.includes("fruta")) return LessonSchema.parse(fruit);
    const adventure = findAdventure(input.topic);
    if (!adventure)
      throw new Error(
        "Esa aventura aún no está en el cuaderno. Elige Dinosaurios, Planetas o El océano.",
      );
    await new Promise((resolve) => setTimeout(resolve, 650));
    return LessonSchema.parse(adventure.lesson);
  },
  async getReexplanation(lesson, questionIndex) {
    const question = lesson.quiz[questionIndex];
    const text = `¡Casi! La respuesta es «${question.options[question.answerIndex]}». ${question.hint}`;
    return { text, speech: text };
  },
};

export const httpLessonService: LessonService = {
  async getLesson(input) {
    return LessonSchema.parse(await experiencePost("/api/lesson", input));
  },
  async getReexplanation(lesson, questionIndex, chosen, age = 8) {
    const question = lesson.quiz[questionIndex];
    return ReexplainSchema.parse(
      await experiencePost("/api/reexplain", {
        question: question.question,
        chosen: question.options[chosen],
        correct: question.options[question.answerIndex],
        style: lesson.style,
        age,
      }),
    );
  },
};

export const isDemo = process.env.NEXT_PUBLIC_LESSON_SOURCE === "demo";
export const lessonService: LessonService = isDemo
  ? mockLessonService
  : {
      async getLesson(input) {
        try {
          const lesson = await httpLessonService.getLesson(input);
          const wanted = findAdventure(input.topic);
          if (wanted && findAdventure(lesson.topic)?.id !== wanted.id)
            return mockLessonService.getLesson(input);
          return lesson;
        } catch {
          return mockLessonService.getLesson(input);
        }
      },
      async getReexplanation(lesson, index, chosen, age) {
        try {
          return await httpLessonService.getReexplanation(
            lesson,
            index,
            chosen,
            age,
          );
        } catch {
          return mockLessonService.getReexplanation(lesson, index, chosen, age);
        }
      },
    };

export function comparisonLessons() {
  return [LessonSchema.parse(story), LessonSchema.parse(visual)];
}

export function getCardSupport(lesson: Lesson, index: number): string {
  const adventure = findAdventure(lesson.topic);
  const match = adventure?.lesson.cards.findIndex(
    (card) => card.title === lesson.cards[index].title,
  );
  return match !== undefined && match >= 0
    ? adventure!.support[match]
    : `Vamos paso a paso. ${lesson.cards[index].text}`;
}
