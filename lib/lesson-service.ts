import fixture from "../docs/lulo/demo/lesson_dinosaurios.json";
import { LessonSchema, ReexplainSchema, type Lesson, type LessonRequest, type Reexplain } from "./schema";

export interface LessonService {
  getLesson(input: LessonRequest): Promise<Lesson>;
  getReexplanation(lesson: Lesson, questionIndex: number, chosen: number): Promise<Reexplain>;
}

export const mockLessonService: LessonService = {
  async getLesson() {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return LessonSchema.parse(fixture);
  },
  async getReexplanation(_lesson, questionIndex) {
    const text = fixture.quiz[questionIndex]?.reexplain ?? "¡Casi! Vamos a descubrirlo juntos.";
    return { text, speech: text };
  },
};

async function post(route: string, body: unknown) {
  const response = await fetch(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("No pudimos preparar la aventura. Inténtalo de nuevo.");
  return response.json();
}

export const httpLessonService: LessonService = {
  async getLesson(input) { return LessonSchema.parse(await post("/api/lesson", input)); },
  async getReexplanation(lesson, questionIndex, chosen) {
    const question = lesson.quiz[questionIndex];
    return ReexplainSchema.parse(await post("/api/reexplain", {
      question: question.question, chosen: question.options[chosen], correct: question.options[question.answerIndex], style: lesson.style, age: 8,
    }));
  },
};

export const isDemo = process.env.NEXT_PUBLIC_LESSON_SOURCE !== "http";
export const lessonService = isDemo ? mockLessonService : httpLessonService;

const cardSupport = [
  "Imagina que retrocedemos en el tiempo, mucho antes de que hubiera personas. Allí vivían dinosaurios grandes y pequeños.",
  "Vamos por partes: T-Rex es el nombre de un dinosaurio. Era grande, tenía dientes afilados y vivió en América del Norte.",
  "Piensa en sus dientes como herramientas para comer. Los del T-Rex le ayudaban a comer carne.",
  "Imagina dos platos: uno con plantas y otro con carne. Distintos dinosaurios necesitaban distintos alimentos.",
  "Un fósil es una pista del pasado. Los científicos reúnen esas pistas como piezas de un rompecabezas.",
];

export function getCardSupport(lesson: Lesson, index: number): string {
  return isDemo ? cardSupport[index] ?? lesson.cards[index].text : `Vamos paso a paso. ${lesson.cards[index].text}`;
}
