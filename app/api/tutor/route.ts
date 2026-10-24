import { handle } from "@/lib/api";
import { tutorReply } from "@/lib/gemma";
import { TutorRequestSchema } from "@/lib/tutor-schema";

// Chat with Lulo: answers the child's questions with the current lesson and learner profile as context.
export async function POST(request: Request) {
  return handle(request, TutorRequestSchema, async (input) => {
    if (!process.env.GEMINI_API_KEY) {
      const text = "¡Qué buena pregunta! Ahorita no puedo pensar, pero sigamos con la clase.";
      return { text, speech: text, action: { type: "none" as const } };
    }
    return tutorReply(input);
  });
}
