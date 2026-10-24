import type { ImageResult } from "./commons";
import { keywordsOf, searchQueries, subjectStem, type QueryOptions } from "./query";
import type { ImageRequest } from "./schema";

export const FALLBACK_IMAGE: ImageResult = { url: "/assets/lulo/lulo.webp", source: "fallback" };
// Gemma often puts the mascot in covers and stickers. Lulo's own artwork beats any web photo of an iguana.
export const MASCOT_IMAGE: ImageResult = { url: "/assets/lulo/lulo.webp", source: "mascot" };

const MASCOT_WORDS = new Set(["iguana", "iguanas", "iguano", "lulo", "lizard"]);
const isMascot = (query: string) => keywordsOf(query).some((word) => MASCOT_WORDS.has(word));

type CommonsOptions = { bitmapOnly?: boolean; mustContain?: string | null };

export interface ImageSources {
  commons: (query: string, opts?: CommonsOptions) => Promise<ImageResult | null>;
  illustrate: (query: string) => Promise<ImageResult | null>;
  // Optional vision check: several Commons candidates, and Gemma picks the one that really shows the
  // description (index), or -1 when none fits.
  commonsMany?: (query: string, opts?: CommonsOptions) => Promise<ImageResult[]>;
  choose?: (description: string, candidates: ImageResult[]) => Promise<number>;
  // Gemma can be slow under load; past this limit the first candidate is used.
  chooseTimeoutMs?: number;
}

const VISION_TIMEOUT_MS = 8000;
const MAX_VISION_CHECKS = 2;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`vision check timed out after ${ms} ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
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
  const mustContain = subjectStem(query);
  // Without a concrete subject any web result is a guess; Lulo is a better answer than a random photo.
  if (!mustContain) return null;
  const { commonsMany, choose } = sources;
  let checks = 0;
  for (const attempt of searchQueries(query, options)) {
    const opts = { bitmapOnly: true, mustContain };
    if (commonsMany && choose) {
      const candidates = (await safe(() => commonsMany(attempt, opts))) ?? [];
      if (!candidates.length) continue;
      // Two rejected batches mean the web has no good picture for this card; stop and show Lulo.
      if (checks++ >= MAX_VISION_CHECKS) return null;
      let picked: number;
      try {
        picked = await withTimeout(choose(query, candidates), sources.chooseTimeoutMs ?? VISION_TIMEOUT_MS);
      } catch (error) {
        // The check is a quality bonus; if it fails, keep the old behavior instead of losing the image.
        console.error("[images] vision check failed", error);
        return candidates[0];
      }
      if (picked >= 0 && picked < candidates.length) return candidates[picked];
      continue;
    }
    const hit = await safe(() => sources.commons(attempt, opts));
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
