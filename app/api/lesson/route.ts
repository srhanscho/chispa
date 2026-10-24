import { readFile } from "node:fs/promises";
import path from "node:path";
import { handle } from "@/lib/api";
import { generateLesson } from "@/lib/gemma";
import { LessonRequestSchema, LessonSchema } from "@/lib/schema";

// Without a Gemini key (or with DEMO_MODE=1) we serve the cached demo lesson so the UI always works.
async function demoLesson() {
  const file = path.join(process.cwd(), "public", "demo", "dinosaurios.json");
  return LessonSchema.parse(JSON.parse(await readFile(file, "utf8")));
}

export async function POST(request: Request) {
  return handle(request, LessonRequestSchema, async (input) => {
    if (process.env.DEMO_MODE === "1" || !process.env.GEMINI_API_KEY) return demoLesson();
    return generateLesson(input);
  });
}
