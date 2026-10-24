// Gemma has no documented JSON mode, so we pull the first JSON object out of its text.
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object found in model output");
  return JSON.parse(text.slice(start, end + 1));
}
