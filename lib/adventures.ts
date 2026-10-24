import dinosaurs from "../docs/lulo/demo/lesson_dinosaurios.json";
import planets from "../public/demo/planetas.json";
import ocean from "../public/demo/oceano.json";
import { LessonSchema, type Lesson } from "./schema";

export type AdventureId = "dinosaurs" | "planets" | "ocean";
export interface Adventure {
  id: AdventureId;
  title: string;
  description: string;
  minutes: number;
  lesson: Lesson;
  explanations: string[];
  support: string[];
  mission: string;
}

export const adventures: Adventure[] = [
  {
    id: "dinosaurs",
    title: "Dinosaurios",
    description: "Sigue las pistas de un mundo gigante.",
    minutes: 5,
    lesson: LessonSchema.parse(dinosaurs),
    explanations: dinosaurs.quiz.map((question) => question.reexplain),
    support: [
      "Imagina que retrocedemos en el tiempo, mucho antes de que hubiera personas. Allí vivían dinosaurios grandes y pequeños.",
      "Vamos por partes: T-Rex es el nombre de un dinosaurio. Era grande, tenía dientes afilados y vivió en América del Norte.",
      "Piensa en sus dientes como herramientas para comer. Los del T-Rex le ayudaban a comer carne.",
      "Imagina dos platos: uno con plantas y otro con carne. Distintos dinosaurios necesitaban distintos alimentos.",
      "Un fósil es una pista del pasado. Los científicos reúnen esas pistas como piezas de un rompecabezas.",
    ],
    mission:
      "Dibuja un dinosaurio imaginario y cuéntale a alguien qué podría comer.",
  },
  {
    id: "planets",
    title: "Planetas",
    description: "Viaja por nuestro vecindario espacial.",
    minutes: 4,
    lesson: LessonSchema.parse(planets),
    explanations: planets.quiz.map((question) => question.reexplain),
    support: [
      "Piensa en el sistema solar como un vecindario. La Tierra es uno de sus ocho planetas.",
      "Una estrella produce luz. El Sol es nuestra estrella; la Tierra recibe su luz.",
      "Imagina un camino que rodea al Sol. Ese camino se llama órbita y por él viaja un planeta.",
      "Imagina pelotas de diferentes tamaños. Los planetas también tienen distintos tamaños: Júpiter es el más grande.",
    ],
    mission:
      "Dibuja un Sol y un camino a su alrededor. Pon tu planeta imaginario en ese camino.",
  },
  {
    id: "ocean",
    title: "El océano",
    description: "Conoce a quienes viven bajo las olas.",
    minutes: 4,
    lesson: LessonSchema.parse(ocean),
    explanations: ocean.quiz.map((question) => question.reexplain),
    support: [
      "Imagina una gran casa bajo el agua. En ella viven animales diferentes, como peces y delfines.",
      "El agua contiene oxígeno. Las branquias ayudan al pez a tomar ese oxígeno para respirar.",
      "Los peces usan branquias, pero el delfín tiene pulmones. Necesita subir para respirar aire.",
      "Una bolsa puede terminar en el agua y hacer daño. Si la ponemos donde corresponde, ayudamos al océano.",
    ],
    mission:
      "Dibuja un animal del océano y explícale a alguien una manera de cuidar su hogar.",
  },
];

const normalize = (text: string) =>
  text
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function findAdventure(topic: string): Adventure | undefined {
  const value = normalize(topic);
  const aliases: Record<string, AdventureId> = {
    dinosaurios: "dinosaurs",
    dinosaurio: "dinosaurs",
    planetas: "planets",
    espacio: "planets",
    "sistema solar": "planets",
    oceano: "ocean",
    "el oceano": "ocean",
    mar: "ocean",
    "el mar": "ocean",
    animales: "ocean",
  };
  return adventures.find(
    (adventure) =>
      adventure.id === aliases[value] || normalize(adventure.title) === value,
  );
}
