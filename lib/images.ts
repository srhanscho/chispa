import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { searchCommons, searchCommonsCandidates, type ImageResult } from "./commons";
import { chooseImage } from "./gemma";
import { FALLBACK_IMAGE, resolveImageWith } from "./image-pipeline";
import type { ImageRequest } from "./schema";

const STYLE =
  "flat children's book illustration, rounded shapes, thick outlines, " +
  "colors green #3FA34D, turquoise #14A3B8, mango yellow #FFC93C, coral #FF6B5B, " +
  "light sand background, no text";

// In-memory cache per server instance, plus a disk cache in development so demo images are paid once.
const memory = new Map<string, ImageResult>();
const CACHE_DIR = path.join(process.cwd(), ".cache", "images");

const keyFor = (req: ImageRequest) =>
  createHash("sha1").update(`${req.kind}:${req.query.toLowerCase().trim()}`).digest("hex");

async function readDisk(key: string): Promise<ImageResult | null> {
  try {
    return JSON.parse(await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8"));
  } catch {
    return null;
  }
}

async function writeDisk(key: string, result: ImageResult) {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(result));
  } catch {
    // Read-only filesystems (e.g. Vercel) just skip the disk cache.
  }
}

async function generateIllustration(query: string): Promise<ImageResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini",
      prompt: `${query}, ${STYLE}`,
      size: "1024x1024",
      quality: "low",
      n: 1,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    console.error("OpenAI image error", response.status, await response.text());
    return null;
  }
  const json = (await response.json()) as { data?: { b64_json?: string; url?: string }[] };
  const image = json.data?.[0];
  if (image?.b64_json) return { url: `data:image/png;base64,${image.b64_json}`, source: "openai" };
  if (image?.url) return { url: image.url, source: "openai" };
  return null;
}

// Images saved by scripts/pregen-demo.ts, served from /public so the demo works offline.
type DemoEntry = { url: string; credit?: string; pageUrl?: string };
let demoManifest: Record<string, DemoEntry> | null = null;
async function demoImage(req: ImageRequest): Promise<ImageResult | null> {
  demoManifest ??= await readFile(path.join(process.cwd(), "public", "demo", "images.json"), "utf8")
    .then((raw) => JSON.parse(raw) as Record<string, DemoEntry>)
    .catch(() => ({}));
  const entry = demoManifest[`${req.kind}:${req.query.toLowerCase().trim()}`];
  return entry ? { ...entry, source: "wikimedia" } : null;
}

export async function resolveImage(req: ImageRequest): Promise<ImageResult> {
  const demo = await demoImage(req);
  if (demo) return demo;

  const key = keyFor(req);
  const cached = memory.get(key) ?? (await readDisk(key));
  if (cached) return cached;

  const vision = process.env.GEMINI_API_KEY && process.env.IMAGE_VISION_CHECK !== "0";
  const result = await resolveImageWith(req, {
    commons: searchCommons,
    illustrate: generateIllustration,
    ...(vision ? { commonsMany: searchCommonsCandidates, choose: chooseImage } : {}),
  });

  if (result !== FALLBACK_IMAGE) {
    memory.set(key, result);
    await writeDisk(key, result);
  }
  return result;
}
