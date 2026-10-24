import { ThinkingLevel } from "@google/genai";

// Gemma 4 thinking is controlled with thinkingLevel: "high" turns it on, "minimal" turns it off
// (https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api). Lessons don't need deep reasoning,
// and thinking was the main cause of ~95 s responses, so minimal is the default.
export function thinkingLevelFrom(value: string | undefined): ThinkingLevel {
  return value?.toLowerCase() === "high" ? ThinkingLevel.HIGH : ThinkingLevel.MINIMAL;
}
