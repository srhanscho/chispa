import type { ImageResult } from "./commons";
import { searchQueries } from "./query";
import type { ImageRequest } from "./schema";

export const FALLBACK_IMAGE: ImageResult = { url: "/lulo.svg", source: "fallback" };

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

async function firstCommonsHit(sources: ImageSources, query: string, bitmapOnly: boolean) {
  for (const attempt of searchQueries(query)) {
    const hit = await safe(() => sources.commons(attempt, { bitmapOnly }));
    if (hit) return hit;
  }
  return null;
}

// Photos: real pictures first (free), illustration as a paid backup.
// Illustrations: OpenAI first; without it (no key, no credit) any fitting Wikimedia image beats a static Lulo.
export async function resolveImageWith(req: ImageRequest, sources: ImageSources): Promise<ImageResult> {
  if (req.kind === "photo") {
    return (
      (await firstCommonsHit(sources, req.query, true)) ??
      (await safe(() => sources.illustrate(req.query))) ??
      FALLBACK_IMAGE
    );
  }
  return (
    (await safe(() => sources.illustrate(req.query))) ??
    (await firstCommonsHit(sources, req.query, true)) ??
    FALLBACK_IMAGE
  );
}
