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

  it("asks Wikimedia for the subject of the original prompt on every retry", async () => {
    const commons = vi.fn(async () => null);
    await resolveImageWith(
      { kind: "photo", query: "dinosaur as tall as a building" },
      { commons, illustrate: async () => null },
    );
    expect(commons.mock.calls.length).toBeGreaterThan(1);
    for (const [, opts] of commons.mock.calls as unknown as [string, { mustContain?: string }][]) {
      expect(opts.mustContain).toBe("dinos");
    }
  });

  it("does not search the web when the prompt names no concrete subject", async () => {
    const commons = vi.fn(async () => photo("random.jpg"));
    const result = await resolveImageWith({ kind: "photo", query: "huge" }, { commons, illustrate: async () => null });
    expect(commons).not.toHaveBeenCalled();
    expect(result).toEqual(FALLBACK_IMAGE);
  });

  it("lets Gemma's vision pick the candidate that really shows the card", async () => {
    const candidates = [photo("stork.jpg"), photo("dino-skeleton.jpg"), photo("dino-toy.jpg")];
    const choose = vi.fn(async () => 1);
    const result = await resolveImageWith(
      { kind: "photo", query: "dinosaur skeleton museum" },
      { commons: async () => null, commonsMany: async () => candidates, choose, illustrate: async () => null },
    );
    expect(result.url).toBe("dino-skeleton.jpg");
    expect(choose).toHaveBeenCalledWith("dinosaur skeleton museum", candidates);
  });

  it("tries the next search when Gemma rejects every candidate, then falls back to Lulo", async () => {
    const commonsMany = vi.fn(async () => [photo("wrong.jpg")]);
    const result = await resolveImageWith(
      { kind: "photo", query: "dinosaur footprint fossil" },
      { commons: async () => null, commonsMany, choose: async () => -1, illustrate: async () => null },
    );
    expect(commonsMany.mock.calls.length).toBeGreaterThan(1);
    expect(result).toEqual(FALLBACK_IMAGE);
  });

  it("uses the first candidate when the vision check itself fails", async () => {
    const result = await resolveImageWith(
      { kind: "photo", query: "volcano eruption" },
      {
        commons: async () => null,
        commonsMany: async () => [photo("volcano.jpg"), photo("other.jpg")],
        choose: async () => {
          throw new Error("quota");
        },
        illustrate: async () => null,
      },
    );
    expect(result.url).toBe("volcano.jpg");
  });

  it("does not wait longer than the vision time limit", async () => {
    const started = Date.now();
    const result = await resolveImageWith(
      { kind: "photo", query: "volcano eruption" },
      {
        commons: async () => null,
        commonsMany: async () => [photo("volcano.jpg")],
        choose: () => new Promise<number>(() => {}),
        chooseTimeoutMs: 30,
        illustrate: async () => null,
      },
    );
    expect(result.url).toBe("volcano.jpg");
    expect(Date.now() - started).toBeLessThan(1000);
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
