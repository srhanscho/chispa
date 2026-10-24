"use client";

import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import type { ImageRequest } from "@/lib/schema";
import type { ImageResult } from "@/lib/commons";
import { LuloAvatar } from "./LuloAvatar";
import bundledImages from "@/public/demo/images.json";

type Tone = "iguana" | "sea" | "mango" | "coral" | "plain";

const TONES: Record<Tone, string> = {
  iguana: "bg-[#28743a] text-white",
  sea: "bg-[#08788a] text-white",
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
      className={`min-h-14 rounded-2xl border border-black/10 px-5 font-display text-xl font-bold shadow-[0_3px_0_#1F2A4420] transition active:translate-y-0.5 active:shadow-none disabled:opacity-50 ${TONES[tone]} ${className}`}
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
      className={`rounded-3xl border-4 border-ink bg-white p-5 shadow-[0_6px_0_#1F2A44] ${className}`}
    >
      {children}
    </div>
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
    const bundled = (
      bundledImages as Record<
        string,
        { url: string; credit?: string; pageUrl?: string }
      >
    )[`${request.kind}:${request.query.toLowerCase().trim()}`];
    if (bundled) {
      // Bundled photos keep their original credits even without an API connection.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImage({ ...bundled, source: bundled.credit ? "wikimedia" : "mascot" });
      return;
    }
    fetch("/api/image", {
      method: "POST",
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(60000),
    })
      .then((res) => (res.ok ? (res.json() as Promise<ImageResult>) : null))
      .catch(() => null)
      .then((maybe) => {
        // Never leave the card stuck on the loading Lulo: show the fallback if the server failed.
        const result =
          maybe && maybe.source !== "fallback"
            ? maybe
            : {
                url: "/assets/lulo/lulo_referencia_original.png",
                source: "fallback" as const,
              };
        if (cancelled) return;
        setImage(result);
        // Data URLs are large; only remote URLs go to localStorage.
        if (!result.url.startsWith("data:") && result.source !== "fallback") {
          try {
            localStorage.setItem(
              IMAGE_CACHE,
              JSON.stringify({ ...readImageCache(), [key]: result }),
            );
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
                  url: "/assets/lulo/lulo_referencia_original.png",
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
