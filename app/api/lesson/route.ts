import { handle } from "@/lib/api";
import { generateLesson } from "@/lib/gemma";
import { lessonStore } from "@/lib/db";
import { getLesson } from "@/lib/lesson-cache";
import { LessonRequestSchema } from "@/lib/schema";

export async function POST(request: Request) {
  return handle(request, LessonRequestSchema, async (input) => {
    const { lesson, source } = await getLesson(input, generateLesson, lessonStore());
    console.info(`[lessons] ${input.topic} → ${source}`);
    return lesson;
  });
}
