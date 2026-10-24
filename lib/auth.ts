import "server-only";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { z } from "zod";
import { bearerToken } from "./bearer";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const authConfigured = () => Boolean(URL && PUBLISHABLE_KEY);

export type AuthResult = { user: User; db: SupabaseClient } | { error: Response };

/**
 * Verifies the parent's access token (sent as `Authorization: Bearer <token>`) and returns a
 * Supabase client that acts as that parent, so Row Level Security limits every query to their data.
 */
export async function requireParent(request: Request): Promise<AuthResult> {
  if (!URL || !PUBLISHABLE_KEY) {
    return { error: Response.json({ error: "Login is not configured on this server" }, { status: 503 }) };
  }
  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return { error: Response.json({ error: "Missing bearer token" }, { status: 401 }) };

  const db = createClient(URL, PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return { error: Response.json({ error: "Invalid session" }, { status: 401 }) };
  return { user: data.user, db };
}

type Ctx = { user: User; db: SupabaseClient };

/** Route helper: authenticate the parent, optionally validate the JSON body, run, and map DB errors. */
export async function withParent<I = undefined>(
  request: Request,
  schema: z.ZodType<I> | null,
  run: (ctx: Ctx, input: I) => Promise<unknown>,
): Promise<Response> {
  const auth = await requireParent(request);
  if ("error" in auth) return auth.error;

  let input = undefined as I;
  if (schema) {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
    input = parsed.data;
  }
  try {
    const result = await run(auth, input);
    return result instanceof Response ? result : Response.json(result);
  } catch (error) {
    console.error("[account]", error);
    return Response.json({ error: "Could not save. Try again." }, { status: 500 });
  }
}

export const notFound = () => Response.json({ error: "Not found" }, { status: 404 });
