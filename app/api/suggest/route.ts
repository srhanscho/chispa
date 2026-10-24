import { handle } from "@/lib/api";
import { suggestTopics } from "@/lib/gemma";
import { SuggestRequestSchema } from "@/lib/tutor-schema";

// Next-topic ideas built from what the child already learned.
export async function POST(request: Request) {
  return handle(request, SuggestRequestSchema, async ({ learner }) => {
    if (!process.env.GEMINI_API_KEY) {
      return {
        topics: [
          { topic: "dinosaurios", why: "¡Eran gigantes y muy curiosos!", style: "story" as const },
          { topic: "el sistema solar", why: "Vamos a viajar por los planetas.", style: "visual" as const },
          { topic: "el mar Caribe", why: "Está aquí cerquita de Barranquilla.", style: "game" as const },
        ],
      };
    }
    return suggestTopics(learner);
  });
}
