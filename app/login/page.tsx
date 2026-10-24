"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginEnabled, signIn, signUp } from "@/lib/supabase-browser";
import { LuloAvatar } from "@/components/LuloAvatar";

export default function LoginPage() {
  const router = useRouter();
  const enabled = loginEnabled();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const session =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(email, password);
      if (session) router.push("/");
      else setMessage("Revisa tu correo para confirmar la cuenta.");
    } catch {
      setMessage(
        "No pudimos entrar. Revisa el correo y la contraseña o vuelve a intentar.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell login-shell">
      <header className="app-header">
        <Link href="/" className="brand">
          chispa<span className="brand-dot">.</span>
        </Link>
        <Link href="/" className="text-button">
          Seguir sin cuenta
        </Link>
      </header>
      <section className="login-layout">
        <div className="login-welcome">
          <p className="eyebrow">PARA PAPÁS Y PROFES</p>
          <h1>
            Un lugar para guardar
            <br />
            sus descubrimientos.
          </h1>
          <p>Acompaña el progreso y vuelve a sus cursos cuando quieras.</p>
          <LuloAvatar size={260} />
        </div>
        <div className="login-card">
          <h2>
            {mode === "signin"
              ? "Qué bueno verte"
              : "Creemos tu cuenta familiar"}
          </h2>
          <p>
            La cuenta es opcional. Siempre puedes explorar sin iniciar sesión.
          </p>
          {enabled === null ? (
            <p role="status">Preparando el acceso…</p>
          ) : !enabled ? (
            <div className="support-note">
              <p>
                El acceso familiar aún no está configurado aquí. La demo y sus
                perfiles locales siguen disponibles.
              </p>
              <Link className="primary-button" href="/">
                Explorar con Lulo
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={submit}>
                <label htmlFor="parent-email">Correo del adulto</label>
                <input
                  id="parent-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <label htmlFor="parent-password">Contraseña</label>
                <input
                  id="parent-password"
                  type={visible ? "text" : "password"}
                  minLength={6}
                  required
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <label className="password-toggle">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(event) => setVisible(event.target.checked)}
                  />
                  Mostrar contraseña
                </label>
                <button className="primary-button" disabled={busy}>
                  {busy
                    ? "Un momento…"
                    : mode === "signin"
                      ? "Entrar"
                      : "Crear cuenta"}
                </button>
              </form>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setMessage("");
                }}
              >
                {mode === "signin"
                  ? "¿Es tu primera visita? Crear cuenta"
                  : "Ya tengo cuenta"}
              </button>
              <p role="status" className="login-message">
                {message}
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
