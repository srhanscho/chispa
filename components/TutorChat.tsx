"use client";

import { useEffect, useRef, useState } from "react";
import type { LearnerProfile } from "@/lib/engine";
import type { Lesson } from "@/lib/schema";
import type { TutorReply, TutorRequest } from "@/lib/tutor-schema";
import { learnerSummary, requestTutor } from "@/lib/experience-api";
import { canListen, listen } from "@/lib/speech";
import { LuloAvatar } from "./LuloAvatar";

export function TutorChat({
  lesson,
  profile,
  onAction,
  onSpeak,
}: {
  lesson: Lesson;
  profile: LearnerProfile;
  onAction: (action: TutorReply["action"]) => void;
  onSpeak: (speech: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<TutorRequest["history"]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [mic, setMic] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const live = useRef(true);
  const visible = useRef(false);
  const cancelListen = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      cancelListen.current?.();
    };
  }, []);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    list.current?.scrollTo({
      top: list.current.scrollHeight,
      behavior: "auto",
    });
  }, [history, busy]);
  async function send() {
    const text = message.trim();
    if (!text || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    const previous = history.slice(-10);
    setHistory([...history, { role: "child" as const, text }].slice(-20));
    try {
      const reply = await requestTutor({
        message: text,
        learner: learnerSummary(profile),
        lesson: {
          topic: lesson.topic,
          level: lesson.level,
          cards: lesson.cards.map(({ title, text }) => ({ title, text })),
        },
        history: previous,
      });
      if (!live.current) return;
      setHistory((all) =>
        [...all, { role: "lulo" as const, text: reply.text }].slice(-20),
      );
      if (visible.current) {
        onAction(reply.action);
        onSpeak(reply.speech);
      }
    } catch {
      if (live.current) {
        setHistory(history);
        setMessage(text);
        setError("No pude responder. Puedes reintentar o seguir con la clase.");
      }
    } finally {
      lock.current = false;
      if (live.current) {
        setBusy(false);
        input.current?.focus();
      }
    }
  }
  return (
    <div className="tutor-widget">
      <button
        className="primary-button tutor-launch"
        aria-expanded={open}
        aria-controls="tutor-chat"
        onClick={() => {
          setMic(canListen());
          visible.current = !open;
          setOpen(!open);
          if (open) {
            cancelListen.current?.();
            setListening(false);
          }
        }}
      >
        Pregúntale a Lulo
      </button>
      {open && (
        <section
          className="tutor-chat"
          id="tutor-chat"
          aria-label="Chat con Lulo"
        >
          <header>
            <LuloAvatar size={42} />
            <div>
              <strong>Conversemos con Lulo</strong>
              <small>Sobre {lesson.topic}</small>
            </div>
            <button
              className="text-button"
              onClick={() => {
                visible.current = false;
                setOpen(false);
                cancelListen.current?.();
                setListening(false);
              }}
            >
              Cerrar
            </button>
          </header>
          <div
            className="chat-history"
            ref={list}
            role="log"
            aria-live="polite"
          >
            <p className="bubble bubble-lulo">
              ¿Qué te gustaría preguntar sobre esta aventura?
            </p>
            {history.map((turn, index) => (
              <p key={index} className={`bubble bubble-${turn.role}`}>
                <span className="sr-only">
                  {turn.role === "lulo" ? "Lulo" : profile.name}:{" "}
                </span>
                {turn.text}
              </p>
            ))}
            {busy && <p className="chat-wait">Lulo está pensando…</p>}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="tutor-message">
              Tu pregunta para Lulo
            </label>
            <input
              ref={input}
              id="tutor-message"
              value={message}
              maxLength={400}
              required
              disabled={busy}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="¿Por qué…?"
            />
            <button
              className="secondary-button"
              disabled={busy || !message.trim()}
            >
              Enviar
            </button>
            {mic && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  if (listening) {
                    cancelListen.current?.();
                    setListening(false);
                  } else {
                    setListening(true);
                    cancelListen.current = listen(
                      (text) => setMessage(text.slice(0, 400)),
                      () => setListening(false),
                      () =>
                        setError(
                          "Puedes escribir tu pregunta si el micrófono no está disponible.",
                        ),
                    );
                  }
                }}
              >
                {listening ? "Detener dictado" : "Dímelo hablando"}
              </button>
            )}
          </form>
          {error && (
            <p role="alert" className="small-note">
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
