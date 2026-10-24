// Pre-generates the demo lessons and downloads their images so the stage demo works offline.
// Usage: node scripts/pregen-demo.ts [baseUrl]
//   baseUrl defaults to http://localhost:3000. Set CHISPA_COOKIE to reach protected Vercel previews.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { lessonKey } from "../lib/lesson-key.ts";

type Style = "story" | "visual" | "analogy" | "stepByStep" | "game";
type Level = "explorer" | "adventurer" | "expert";
interface ImageRequest { kind: "photo" | "illustration"; query: string }

// The demo script from the PRD: same topic for two kids with different styles, plus the photo moment.
const DEMO: { topic: string; style: Style; level: Level }[] = [
  { topic: "dinosaurios", style: "story", level: "explorer" },
  { topic: "dinosaurios", style: "visual", level: "explorer" },
  { topic: "frutas tropicales", style: "story", level: "explorer" },
  { topic: "volcanes", style: "game", level: "explorer" },
];

const base = process.argv[2] ?? "http://localhost:3000";
const headers: Record<string, string> = { "Content-Type": "application/json" };
if (process.env.CHISPA_COOKIE) headers.Cookie = process.env.CHISPA_COOKIE;

const root = path.resolve(import.meta.dirname, "..");
const lessonsDir = path.join(root, "public", "demo", "lessons");
const imagesDir = path.join(root, "public", "demo", "img");
const manifestPath = path.join(root, "public", "demo", "images.json");

async function post<T>(route: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${route}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${route} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

interface Saved { url: string; credit?: string; pageUrl?: string }

async function saveImage(req: ImageRequest, manifest: Record<string, Saved>) {
  const key = `${req.kind}:${req.query.toLowerCase().trim()}`;
  if (manifest[key]) return;
  const image = await post<{ url: string; source: string; credit?: string; pageUrl?: string }>("/api/image", req);
  if (image.source === "fallback" || image.source === "mascot") return console.warn(`  ${image.source} for "${req.query}"`);

  const name = createHash("sha1").update(key).digest("hex").slice(0, 16);
  let bytes: Buffer;
  let ext = "jpg";
  if (image.url.startsWith("data:")) {
    ext = image.url.slice(11, image.url.indexOf(";")) || "png";
    bytes = Buffer.from(image.url.split(",")[1], "base64");
  } else {
    const res = await fetch(image.url, { headers: { "User-Agent": "Chispa/0.1 demo pregen" } });
    ext = path.extname(new URL(image.url).pathname).slice(1).toLowerCase() || "jpg";
    bytes = Buffer.from(await res.arrayBuffer());
  }
  await writeFile(path.join(imagesDir, `${name}.${ext}`), bytes);
  manifest[key] = { url: `/demo/img/${name}.${ext}`, credit: image.credit, pageUrl: image.pageUrl };
  console.log(`  image ${manifest[key].url} ← ${req.query}`);
}

await mkdir(lessonsDir, { recursive: true });
await mkdir(imagesDir, { recursive: true });
const manifest: Record<string, Saved> = JSON.parse(await readFile(manifestPath, "utf8").catch(() => "{}"));

for (const item of DEMO) {
  const file = path.join(lessonsDir, `${lessonKey(item)}.json`);
  const existing = await readFile(file, "utf8").catch(() => null);
  const lesson = existing
    ? JSON.parse(existing)
    : await post<{ cover: ImageRequest; cards: { image: ImageRequest }[]; sticker: { query: string } }>(
        "/api/lesson",
        { ...item, age: 7 },
      );
  if (!existing) await writeFile(file, JSON.stringify(lesson, null, 2) + "\n");
  console.log(`${existing ? "kept" : "saved"} ${path.basename(file)}`);

  for (const req of [lesson.cover, ...lesson.cards.map((c: { image: ImageRequest }) => c.image), { kind: "illustration" as const, query: lesson.sticker.query }]) {
    await saveImage(req, manifest).catch((error) => console.warn(`  image failed: ${error.message}`));
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}
console.log("done");
