import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { lessonKey, pickDemoFile } from "./lesson-key";
import { LessonSchema, type Lesson, type LessonRequest } from "./schema";

const DEMO_DIR = path.join(process.cwd(), "public", "demo", "lessons");
const DEFAULT_DEMO = "dinosaurios__story__explorer.json";

// Optional persistent store (Supabase); plugged in by lib/db.ts when configured.
export interface LessonStore {
  get(key: string): Promise<Lesson | null>;
  put(key: string, lesson: Lesson): Promise<void>;
}

const memory = new Map<string, Lesson>();
let demoFiles: string[] | null = null;

async function listDemoFiles() {
  demoFiles ??= await readdir(DEMO_DIR).catch(() => []);
  return demoFiles;
}

async function readDemo(file: string) {
  return LessonSchema.parse(JSON.parse(await readFile(path.join(DEMO_DIR, file), "utf8")));
}

export type LessonSource = "demo" | "memory" | "store" | "gemma";

/**
 * Lookup order: bundled demo files (instant, offline) → memory → persistent store → Gemma.
 * In demo mode (or without a Gemini key) only bundled lessons are served, falling back to dinosaurs.
 */
export async function getLesson(
  req: LessonRequest,
  generate: (req: LessonRequest) => Promise<Lesson>,
  store?: LessonStore | null,
): Promise<{ lesson: Lesson; source: LessonSource }> {
  const key = lessonKey(req);
  const files = await listDemoFiles();
  const demoOnly = process.env.DEMO_MODE === "1" || !process.env.GEMINI_API_KEY;

  if (files.includes(`${key}.json`)) return { lesson: await readDemo(`${key}.json`), source: "demo" };
  if (demoOnly) {
    return { lesson: await readDemo(pickDemoFile(files, req) ?? DEFAULT_DEMO), source: "demo" };
  }

  const inMemory = memory.get(key);
  if (inMemory) return { lesson: inMemory, source: "memory" };

  const stored = await store?.get(key).catch(() => null);
  if (stored) {
    memory.set(key, stored);
    return { lesson: stored, source: "store" };
  }

  const lesson = await generate(req);
  memory.set(key, lesson);
  await store?.put(key, lesson).catch((error) => console.error("[lessons] store put failed", error));
  return { lesson, source: "gemma" };
}
