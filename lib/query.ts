// Gemma writes descriptive prompts ("illustration of volcano showing red magma inside") that
// Wikimedia search rarely matches. We retry with fewer, more concrete keywords.
const FILLER = new Set([
  "a", "an", "the", "of", "on", "in", "at", "to", "and", "with", "inside", "next", "showing",
  "illustration", "drawing", "picture", "image", "photo", "cartoon", "sticker", "scene",
  "cute", "friendly", "smiling", "happy", "big", "small", "little", "looking", "colorful",
]);

export function searchQueries(query: string, maxKeywords = 3): string[] {
  const keywords = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !FILLER.has(word))
    .slice(0, maxKeywords);

  const attempts = [query.trim()];
  for (let n = keywords.length; n >= 1; n--) attempts.push(keywords.slice(0, n).join(" "));

  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = attempt.toLowerCase();
    if (!attempt || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
