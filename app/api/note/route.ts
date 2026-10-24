import { z } from "zod";
import { handle } from "@/lib/api";
import { writeNote } from "@/lib/gemma";
import { STYLES, StyleSchema } from "@/lib/schema";

const NoteRequestSchema = z.object({
  name: z.string(),
  styleScores: z.record(StyleSchema, z.number()),
  mastery: z.record(z.string(), z.number()),
  recentSessions: z.array(z.unknown()).max(20),
});

const STYLE_NAMES: Record<(typeof STYLES)[number], string> = {
  story: "con historias",
  visual: "con imágenes",
  analogy: "con comparaciones",
  stepByStep: "paso a paso",
  game: "jugando",
};

export async function POST(request: Request) {
  return handle(request, NoteRequestSchema, async (input) => {
    if (!process.env.GEMINI_API_KEY) {
      // Without Gemma, a plain note from the engine scores keeps the parent panel useful in demo mode.
      const best = STYLES.reduce((a, b) => ((input.styleScores[b] ?? 0) > (input.styleScores[a] ?? 0) ? b : a));
      return {
        note: `${input.name} está aprendiendo mejor ${STYLE_NAMES[best]}. La próxima aventura seguirá ese estilo.`,
        nextStyle: best,
      };
    }
    return writeNote(input);
  });
}
