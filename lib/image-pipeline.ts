import type { ImageResult } from "./commons";
import { keywordsOf, searchQueries, type QueryOptions } from "./query";
import type { ImageRequest } from "./schema";

export const FALLBACK_IMAGE: ImageResult = { url: "/lulo.svg", source: "fallback" };
// Gemma often puts the mascot in covers and stickers. Lulo's own artwork beats any web photo of an iguana.
export const MASCOT_IMAGE: ImageResult = { url: "/lulo.svg", source: "mascot" };

const MASCOT_WORDS = new Set(["iguana", "iguanas", "iguano", "lulo", "lizard"]);
const isMascot = (query: string) => keywordsOf(query).some((word) => MASCOT_WORDS.has(word));

export interface ImageSources {
  commons: (query: string, opts?: { bitmapOnly?: boolean }) => Promise<ImageResult | null>;
  illustrate: (query: string) => Promise<ImageResult | null>;
}

// A failing source (network, quota) must never break the lesson: treat errors as "no result".
const safe = async <T>(run: () => Promise<T | null>): Promise<T | null> => {
  try {
    return await run();
  } catch (error) {
    console.error("[images] source failed", error);
    return null;
  }
};

async function firstCommonsHit(sources: ImageSources, query: string, options?: QueryOptions) {
  for (const attempt of searchQueries(query, options)) {
    const hit = await safe(() => sources.commons(attempt, { bitmapOnly: true }));
    if (hit) return hit;
  }
  return null;
}

// Photos: real pictures first (free), illustration as a paid backup.
// Illustrations: OpenAI first; without it, the mascot uses Lulo's artwork and other scenes try a
// conservative Wikimedia search (keywords only, at least two) before falling back to Lulo.
export async function resolveImageWith(req: ImageRequest, sources: ImageSources): Promise<ImageResult> {
  if (req.kind === "photo") {
    return (
      (await firstCommonsHit(sources, req.query)) ??
      (await safe(() => sources.illustrate(req.query))) ??
      FALLBACK_IMAGE
    );
  }
  const illustration = await safe(() => sources.illustrate(req.query));
  if (illustration) return illustration;
  if (isMascot(req.query)) return MASCOT_IMAGE;
  return (
    (await firstCommonsHit(sources, req.query, { includeOriginal: false, minKeywords: 2 })) ?? FALLBACK_IMAGE
  );
}
