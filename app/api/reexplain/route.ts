import { handle } from "@/lib/api";
import { reexplain } from "@/lib/gemma";
import { ReexplainRequestSchema } from "@/lib/schema";

export async function POST(request: Request) {
  return handle(request, ReexplainRequestSchema, async (input) => {
    if (!process.env.GEMINI_API_KEY) {
      const text = `¡Casi! La respuesta es "${input.correct}". ¡Vamos con la siguiente!`;
      return { text, speech: text };
    }
    return reexplain(input);
  });
}
