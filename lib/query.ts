// Gemma writes descriptive prompts ("illustration of volcano showing red magma inside") that
// Wikimedia search rarely matches. We retry with fewer, more concrete keywords.
const FILLER = new Set([
  "a", "an", "the", "of", "on", "in", "at", "to", "and", "with", "inside", "next", "showing",
  "illustration", "drawing", "picture", "image", "photo", "cartoon", "sticker", "scene",
  "cute", "friendly", "smiling", "happy", "big", "small", "little", "looking", "colorful",
]);

export interface QueryOptions {
  maxKeywords?: number;
  // The original prompt as a first attempt. Off for illustrations: words like "cartoon" match old satire prints.
  includeOriginal?: boolean;
  // Single generic words ("explorer") match unrelated things, so illustrations need at least two.
  minKeywords?: number;
}

export const keywordsOf = (query: string) =>
  query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !FILLER.has(word));

export function searchQueries(
  query: string,
  { maxKeywords = 3, includeOriginal = true, minKeywords = 1 }: QueryOptions = {},
): string[] {
  const keywords = keywordsOf(query).slice(0, maxKeywords);

  const attempts = includeOriginal ? [query.trim()] : [];
  for (let n = keywords.length; n >= minKeywords; n--) attempts.push(keywords.slice(0, n).join(" "));

  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = attempt.toLowerCase();
    if (!attempt || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
