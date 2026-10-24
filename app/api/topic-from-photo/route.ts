import { z } from "zod";
import { handle } from "@/lib/api";
import { topicFromPhoto } from "@/lib/gemma";

const PhotoRequestSchema = z.object({
  imageBase64: z.string().max(8_000_000),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export async function POST(request: Request) {
  return handle(request, PhotoRequestSchema, ({ imageBase64, mimeType }) =>
    topicFromPhoto(imageBase64, mimeType),
  );
}
