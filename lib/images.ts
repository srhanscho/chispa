import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { searchCommons, type ImageResult } from "./commons";
import type { ImageRequest } from "./schema";

const STYLE =
  "flat children's book illustration, rounded shapes, thick outlines, " +
  "colors green #3FA34D, turquoise #14A3B8, mango yellow #FFC93C, coral #FF6B5B, " +
  "light sand background, no text";

const FALLBACK: ImageResult = { url: "/assets/lulo/lulo_referencia_original.png", source: "fallback" };

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

export async function resolveImage(req: ImageRequest): Promise<ImageResult> {
  const key = keyFor(req);
  const cached = memory.get(key) ?? (await readDisk(key));
  if (cached) return cached;

  const result =
    (req.kind === "photo" ? await searchCommons(req.query) : null) ??
    (await generateIllustration(req.query)) ??
    FALLBACK;

  if (result !== FALLBACK) {
    memory.set(key, result);
    await writeDisk(key, result);
  }
  return result;
}
