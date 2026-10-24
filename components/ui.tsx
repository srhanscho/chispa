"use client";

import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import type { ImageRequest } from "@/lib/schema";
import type { ImageResult } from "@/lib/commons";

type Tone = "iguana" | "sea" | "mango" | "coral" | "plain";

const TONES: Record<Tone, string> = {
  iguana: "bg-iguana text-white",
  sea: "bg-sea text-white",
  mango: "bg-mango text-ink",
  coral: "bg-coral text-white",
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
      className={`min-h-14 rounded-2xl border-4 border-ink px-5 font-display text-xl font-bold shadow-[0_4px_0_#1F2A44] transition active:translate-y-1 active:shadow-none disabled:opacity-50 ${TONES[tone]} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border-4 border-ink bg-white p-5 shadow-[0_6px_0_#1F2A44] ${className}`}>
      {children}
    </div>
  );
}

// Lulo's artwork is 451x512, so the width follows the height to keep proportions.
export function Lulo({ size = 96, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/lulo.svg"
      alt="Lulo, el iguano"
      width={Math.round(size * (451 / 512))}
      height={size}
      className={thinking ? "animate-bounce" : ""}
    />
  );
}

// Cache resolved images in localStorage by request so the same image is never fetched (or paid) twice.
const IMAGE_CACHE = "chispa:images";

function readImageCache(): Record<string, ImageResult> {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE) ?? "{}");
  } catch {
    return {};
  }
}

// Only rendered on the client after a lesson loads; give it a `key` per request so it remounts.
export function LessonImage({ request, alt }: { request: ImageRequest; alt: string }) {
  const key = `${request.kind}:${request.query}`;
  const [image, setImage] = useState<ImageResult | null>(() => readImageCache()[key] ?? null);

  useEffect(() => {
    if (image) return;
    let cancelled = false;
    fetch("/api/image", { method: "POST", body: JSON.stringify(request) })
      .then((res) => (res.ok ? (res.json() as Promise<ImageResult>) : null))
      .then((result) => {
        if (cancelled || !result) return;
        setImage(result);
        // Data URLs are large; only remote URLs go to localStorage.
        if (!result.url.startsWith("data:") && result.source !== "fallback") {
          try {
            localStorage.setItem(IMAGE_CACHE, JSON.stringify({ ...readImageCache(), [key]: result }));
          } catch {
            // Storage full or blocked; skip caching.
          }
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <figure className="flex flex-col items-center gap-1">
      <div className="flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border-4 border-ink bg-sand">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <Lulo size={72} thinking />
        )}
      </div>
      {image?.credit && (
        <figcaption className="text-xs text-ink/60">
          {image.pageUrl ? (
            <a href={image.pageUrl} target="_blank" rel="noreferrer" className="underline">
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
