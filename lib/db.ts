import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { LessonStore } from "./lesson-cache";
import { LessonSchema } from "./schema";

// Server-only store for the shared lesson cache. Needs the secret key; without it the cache stays in memory.
let store: LessonStore | null | undefined;

export function lessonStore(): LessonStore | null {
  if (store !== undefined) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return (store = null);

  const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  store = {
    async get(key) {
      const { data } = await db.from("lesson_cache").select("lesson").eq("key", key).maybeSingle();
      const parsed = LessonSchema.safeParse(data?.lesson);
      return parsed.success ? parsed.data : null;
    },
    async put(key, lesson) {
      const { error } = await db.from("lesson_cache").upsert({ key, lesson });
      if (error) throw error;
    },
  };
  return store;
}
