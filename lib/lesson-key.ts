import type { Level, Style } from "./schema";

export interface LessonKeyInput {
  topic: string;
  style: Style;
  level: Level;
}

const ARTICLES = /^(el|la|los|las|un|una|unos|unas)\s+/;

export function topicSlug(topic: string): string {
  return topic
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(ARTICLES, "")
    .replace(/\s+/g, "-");
}

export const lessonKey = ({ topic, style, level }: LessonKeyInput) =>
  `${topicSlug(topic)}__${style}__${level}`;

// Demo lessons are files named "<topic>__<style>__<level>.json" in public/demo/lessons.
export function pickDemoFile(files: string[], input: LessonKeyInput): string | null {
  const exact = `${lessonKey(input)}.json`;
  if (files.includes(exact)) return exact;
  const prefix = `${topicSlug(input.topic)}__`;
  return files.filter((f) => f.startsWith(prefix)).sort()[0] ?? null;
}
