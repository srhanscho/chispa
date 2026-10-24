import { handle } from "@/lib/api";
import { resolveImage } from "@/lib/images";
import { ImageRequestSchema } from "@/lib/schema";

export async function POST(request: Request) {
  return handle(request, ImageRequestSchema, resolveImage);
}
