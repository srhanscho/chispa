"use client";

import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import type { ImageRequest } from "@/lib/schema";
import type { ImageResult } from "@/lib/commons";
import { LuloAvatar } from "./LuloAvatar";
import bundledImages from "@/public/demo/images.json";

type Tone = "iguana" | "sea" | "mango" | "coral" | "plain";

const TONES: Record<Tone, string> = {
  iguana: "bg-iguana text-ink",
  sea: "bg-sea text-ink",
  mango: "bg-mango text-ink",
  coral: "bg-coral text-ink",
  plain: "bg-white text-ink",
};

export function Button({
  tone = "iguana",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      {...props}
      className={`min-h-14 rounded-2xl border-4 border-ink px-5 font-display text-xl font-bold shadow-[0_4px_0_#0D0D0D] transition active:translate-y-1 active:shadow-none disabled:opacity-50 ${TONES[tone]} ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border-4 border-ink bg-white p-5 shadow-[0_6px_0_#0D0D0D] ${className}`}
    >
      {children}
    </div>
  );
}

// Cache resolved images in localStorage by request so the same image is never fetched (or paid) twice.
// v2: results before the subject check (e.g. a stork on a dinosaur card) must not be reused.
const IMAGE_CACHE = "chispa:images:v2";

function readImageCache(): Record<string, ImageResult> {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE) ?? "{}");
  } catch {
    return {};
  }
}

const FALLBACK_RESULT: ImageResult = { url: "/assets/lulo/lulo.webp", source: "fallback" };
const inflight = new Map<string, Promise<ImageResult>>();

// Resolves one card image once per session: bundled demo image, browser cache, then /api/image.
// Requests already in flight are shared, so prefetching and the visible card never ask twice.
export function loadLessonImage(request: ImageRequest): Promise<ImageResult> {
  const key = `${request.kind}:${request.query}`;
  const cached = readImageCache()[key];
  if (cached) return Promise.resolve(cached);
  const bundled = (bundledImages as Record<string, { url: string; credit?: string; pageUrl?: string }>)[
    `${request.kind}:${request.query.toLowerCase().trim()}`
  ];
  // Bundled photos keep their original credits even without an API connection.
  if (bundled) return Promise.resolve({ ...bundled, source: bundled.credit ? "wikimedia" : "mascot" });

  const pending = inflight.get(key);
  if (pending) return pending;
  const request$ = fetch("/api/image", {
    method: "POST",
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(60000),
  })
    .then((res) => (res.ok ? (res.json() as Promise<ImageResult>) : null))
    .catch(() => null)
    .then((maybe) => {
      // Never leave the card stuck on the loading Lulo: show the fallback if the server failed.
      const result = maybe && maybe.source !== "fallback" ? maybe : FALLBACK_RESULT;
      // Data URLs are large; only remote URLs go to localStorage.
      if (!result.url.startsWith("data:") && result.source !== "fallback") {
        try {
          localStorage.setItem(IMAGE_CACHE, JSON.stringify({ ...readImageCache(), [key]: result }));
        } catch {
          // Storage full or blocked; skip caching.
        }
      }
      inflight.delete(key);
      return result;
    });
  inflight.set(key, request$);
  return request$;
}

// Start every card image of a lesson while the child reads the first card.
export function prefetchLessonImages(requests: ImageRequest[]) {
  for (const request of requests) void loadLessonImage(request);
}

// Only rendered on the client after a lesson loads; give it a `key` per request so it remounts.
export function LessonImage({
  request,
  alt,
  onResolved,
}: {
  request: ImageRequest;
  alt: string;
  onResolved?: (image: ImageResult) => void;
}) {
  const key = `${request.kind}:${request.query}`;
  const [image, setImage] = useState<ImageResult | null>(
    () => readImageCache()[key] ?? null,
  );
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (image) onResolved?.(image);
  }, [image, onResolved]);

  useEffect(() => {
    if (image) return;
    let cancelled = false;
    void loadLessonImage(request).then((result) => {
      if (!cancelled) setImage(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <figure className="lesson-photo">
      <div className="lesson-photo-frame">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={alt}
            data-loaded={loaded}
            onLoad={() => setLoaded(true)}
            onError={() => {
              if (image.source !== "fallback") {
                setLoaded(false);
                setImage({
                  url: "/assets/lulo/lulo.webp",
                  source: "fallback",
                });
              } else setLoaded(true);
            }}
            className="lesson-resolved-image"
          />
        ) : (
          <LuloAvatar size={72} scene="loading" />
        )}
      </div>
      {image?.credit && (
        <figcaption className="image-credit">
          {image.pageUrl ? (
            <a
              href={image.pageUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {image.credit}
            </a>
          ) : (
            image.credit
          )}
        </figcaption>
      )}
    </figure>
  );
}
