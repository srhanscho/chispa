import { z } from "zod";
import { handle } from "@/lib/api";
import { writeNote } from "@/lib/gemma";
import { StyleSchema } from "@/lib/schema";

const NoteRequestSchema = z.object({
  name: z.string(),
  styleScores: z.record(StyleSchema, z.number()),
  mastery: z.record(z.string(), z.number()),
  recentSessions: z.array(z.unknown()).max(20),
});

export async function POST(request: Request) {
  return handle(request, NoteRequestSchema, writeNote);
}
