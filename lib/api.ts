import "server-only";
import { ZodError, type z } from "zod";

// Shared helper for route handlers: validate input, run, and map errors to JSON responses.
export async function handle<I, O>(
  request: Request,
  schema: z.ZodType<I>,
  run: (input: I) => Promise<O>,
): Promise<Response> {
  let input: I;
  try {
    input = schema.parse(await request.json());
  } catch (error) {
    const message = error instanceof ZodError ? error.issues : "Invalid JSON body";
    return Response.json({ error: message }, { status: 400 });
  }
  try {
    return Response.json(await run(input));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "The AI could not answer. Try again." }, { status: 502 });
  }
}
