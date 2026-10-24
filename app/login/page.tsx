"use client";

// Minimal parent login so the account API can be tested end to end. The UI team can restyle it freely.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginEnabled, signIn, signUp } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loginEnabled()) {
    return <main className="mx-auto max-w-md p-6">El login todavía no está configurado en este servidor.</main>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const session = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
      if (session) router.push("/");
      else setMessage("Revisa tu correo para confirmar la cuenta.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-3xl font-bold text-iguana">Para papás y profes</h1>
      <p>Crea una cuenta para guardar los cursos y el progreso de tus niños.</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-14 rounded-2xl border-4 border-ink px-4 text-lg"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-14 rounded-2xl border-4 border-ink px-4 text-lg"
        />
        <button
          disabled={busy}
          className="min-h-14 rounded-2xl border-4 border-ink bg-iguana font-display text-xl font-bold text-white disabled:opacity-50"
        >
          {mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      <button className="text-sm underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "¿No tienes cuenta? Créala" : "¿Ya tienes cuenta? Entra"}
      </button>
      {message && <p className="rounded-2xl bg-mango/40 p-3">{message}</p>}
    </main>
  );
}
