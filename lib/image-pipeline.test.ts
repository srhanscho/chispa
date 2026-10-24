import { describe, expect, it, vi } from "vitest";
import { resolveImageWith, FALLBACK_IMAGE, MASCOT_IMAGE } from "./image-pipeline";
import type { ImageResult } from "./commons";

const photo = (url: string): ImageResult => ({ url, source: "wikimedia" });
const art = (url: string): ImageResult => ({ url, source: "openai" });

describe("resolveImageWith", () => {
  it("for photos, retries Wikimedia with shorter queries before paying for an illustration", async () => {
    const commons = vi.fn(async (q: string) => (q === "volcano red magma" ? photo("v.jpg") : null));
    const illustrate = vi.fn(async () => art("ai.png"));
    const result = await resolveImageWith(
      { kind: "photo", query: "illustration of volcano showing red magma inside" },
      { commons, illustrate },
    );
    expect(result.url).toBe("v.jpg");
    expect(illustrate).not.toHaveBeenCalled();
  });

  it("for illustrations, uses OpenAI first", async () => {
    const commons = vi.fn(async () => photo("x.jpg"));
    const result = await resolveImageWith(
      { kind: "illustration", query: "friendly iguana next to a volcano" },
      { commons, illustrate: async () => art("ai.png") },
    );
    expect(result.url).toBe("ai.png");
    expect(commons).not.toHaveBeenCalled();
  });

  it("for illustrations without OpenAI, falls back to a Wikimedia photo (bitmaps only, no scanned PDFs)", async () => {
    const commons = vi.fn(async (q: string, opts?: { bitmapOnly?: boolean }) =>
      q === "dolphin boat" && opts?.bitmapOnly === true ? photo("dolphin.jpg") : null,
    );
    const result = await resolveImageWith(
      { kind: "illustration", query: "friendly dolphin next to a boat" },
      { commons, illustrate: async () => null },
    );
    expect(result.url).toBe("dolphin.jpg");
  });

  it("uses Lulo's artwork for illustrations of the mascot instead of searching the web", async () => {
    const commons = vi.fn(async () => photo("random-man-with-iguana.jpg"));
    const result = await resolveImageWith(
      { kind: "illustration", query: "cute iguana wearing a sombrero vueltiao" },
      { commons, illustrate: async () => null },
    );
    expect(result).toEqual(MASCOT_IMAGE);
    expect(commons).not.toHaveBeenCalled();
  });

  it("returns Lulo's fallback when every source fails, even if a source throws", async () => {
    const result = await resolveImageWith(
      { kind: "photo", query: "something impossible" },
      {
        commons: async () => {
          throw new Error("network down");
        },
        illustrate: async () => null,
      },
    );
    expect(result).toEqual(FALLBACK_IMAGE);
  });
});
