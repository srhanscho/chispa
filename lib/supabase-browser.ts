"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

// Browser-side auth for parents. Returns null when Supabase is not configured, so the app keeps
// working offline with localStorage profiles.
let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

export const loginEnabled = () => supabase() !== null;

export async function signUp(email: string, password: string) {
  const sb = supabase();
  if (!sb) throw new Error("Login is not configured");
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signIn(email: string, password: string) {
  const sb = supabase();
  if (!sb) throw new Error("Login is not configured");
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await supabase()?.auth.signOut();
}

export async function currentSession(): Promise<Session | null> {
  return (await supabase()?.auth.getSession())?.data.session ?? null;
}

export function onSessionChange(callback: (session: Session | null) => void) {
  const sub = supabase()?.auth.onAuthStateChange((_event, session) => callback(session));
  return () => sub?.data.subscription.unsubscribe();
}

/** fetch() for the account API (/api/me, /api/children, /api/courses) with the parent's token attached. */
export async function accountFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await currentSession();
  if (!session) throw new Error("Not signed in");
  const res = await fetch(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${await res.text()}`);
  return (res.status === 204 ? null : await res.json()) as T;
}
