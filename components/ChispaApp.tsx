"use client";

import { useEffect, useRef, useState } from "react";
import { levelFor, pickStyle, recordSession, type LearnerProfile, type SessionLog } from "@/lib/engine";
import { demoProfiles, loadProfiles, saveProfiles } from "@/lib/profile";
import { canListen, listen, speak, stopSpeaking } from "@/lib/speech";
import type { Lesson, Reexplain } from "@/lib/schema";
import { Button, Card, LessonImage, Lulo } from "./ui";

type Stage = "start" | "loading" | "lesson" | "quiz" | "done" | "error";

interface Signals {
  correct: number;
  replays: number;
  confused: number;
  hintsUsed: number;
  answerMs: number[];
}

const emptySignals = (): Signals => ({ correct: 0, replays: 0, confused: 0, hintsUsed: 0, answerMs: [] });

// Clock reads live outside the component so the React compiler treats them as event-time only.
const nowMs = () => Date.now();
const nowIso = () => new Date().toISOString();

export default function ChispaApp() {
  const [profiles, setProfiles] = useState<LearnerProfile[]>(demoProfiles);
  const [activeId, setActiveId] = useState("demo-sofia");
  const [stage, setStage] = useState<Stage>("start");
  const [topic, setTopic] = useState("");
  const [listening, setListening] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [step, setStep] = useState(0);
  const [signals, setSignalsState] = useState<Signals>(emptySignals);
  const [feedback, setFeedback] = useState<Reexplain | null>(null);
  const [micAvailable, setMicAvailable] = useState(false);
  const questionShownAt = useRef(0);
  // The ref holds the live counters; state mirrors it for rendering.
  const signalsRef = useRef<Signals>(emptySignals());

  function setSignals(update: Signals | ((s: Signals) => Signals)) {
    signalsRef.current = typeof update === "function" ? update(signalsRef.current) : update;
    setSignalsState(signalsRef.current);
  }

  // localStorage and the speech APIs only exist in the browser, so they load after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfiles(loadProfiles());
    setMicAvailable(canListen());
  }, []);

  const profile = profiles.find((p) => p.id === activeId) ?? profiles[0];

  function updateProfile(next: LearnerProfile) {
    const all = profiles.map((p) => (p.id === next.id ? next : p));
    setProfiles(all);
    saveProfiles(all);
  }

  async function startLesson(requested: string) {
    if (requested.trim().length < 2) return;
    setStage("loading");
    setSignals(emptySignals());
    setStep(0);
    setFeedback(null);
    const style = pickStyle(profile);
    const level = levelFor(profile.mastery[requested] ?? 0);
    try {
      const res = await fetch("/api/lesson", {
        method: "POST",
        body: JSON.stringify({ topic: requested, age: profile.age, style, level }),
      });
      if (!res.ok) throw new Error(await res.text());
      const next = (await res.json()) as Lesson;
      setLesson(next);
      setStage("lesson");
      speak(next.cards[0].speech);
    } catch (error) {
      console.error(error);
      setStage("error");
    }
  }

  function onMic() {
    setListening(true);
    listen(
      (text) => {
        setTopic(text);
        startLesson(text);
      },
      () => setListening(false),
    );
  }

  function nextCard() {
    if (!lesson) return;
    if (step + 1 < lesson.cards.length) {
      setStep(step + 1);
      speak(lesson.cards[step + 1].speech);
    } else {
      stopSpeaking();
      setStep(0);
      setStage("quiz");
      questionShownAt.current = nowMs();
      speak(lesson.quiz[0].question);
    }
  }

  async function answer(optionIndex: number) {
    if (!lesson || feedback) return;
    const question = lesson.quiz[step];
    const isCorrect = optionIndex === question.answerIndex;
    const elapsed = nowMs() - questionShownAt.current;
    setSignals((s) => ({ ...s, correct: s.correct + (isCorrect ? 1 : 0), answerMs: [...s.answerMs, elapsed] }));

    if (isCorrect) {
      speak("¡Qué chévere, muy bien!");
      goToNextQuestion();
      return;
    }
    const res = await fetch("/api/reexplain", {
      method: "POST",
      body: JSON.stringify({
        question: question.question,
        chosen: question.options[optionIndex],
        correct: question.options[question.answerIndex],
        style: lesson.style,
        age: profile.age,
      }),
    });
    const explanation: Reexplain = res.ok
      ? await res.json()
      : { text: `¡Casi! Era "${question.options[question.answerIndex]}".`, speech: "¡Casi! Vamos con la siguiente." };
    setFeedback(explanation);
    speak(explanation.speech);
  }

  function goToNextQuestion() {
    if (!lesson) return;
    setFeedback(null);
    if (step + 1 < lesson.quiz.length) {
      setStep(step + 1);
      questionShownAt.current = nowMs();
      speak(lesson.quiz[step + 1].question);
    } else {
      finish(true);
    }
  }

  function finish(completed: boolean) {
    if (!lesson) return;
    stopSpeaking();
    const s = signalsRef.current;
    const session: SessionLog = {
      topic: lesson.topic,
      style: lesson.style,
      correct: s.correct,
      total: lesson.quiz.length,
      avgAnswerMs: s.answerMs.length ? s.answerMs.reduce((a, b) => a + b, 0) / s.answerMs.length : 0,
      replays: s.replays,
      confused: s.confused,
      hintsUsed: s.hintsUsed,
      completed,
      at: nowIso(),
    };
    const stars = (completed ? 1 : 0) + s.correct;
    updateProfile({ ...recordSession(profile, session), stars: profile.stars + stars });
    setStage(completed ? "done" : "start");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lulo size={56} />
          <h1 className="text-3xl font-bold text-iguana">Chispa</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border-4 border-ink bg-mango px-3 py-1 font-display font-bold">
            ⭐ {profile.stars}
          </span>
          <select
            aria-label="Niño"
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="rounded-xl border-4 border-ink bg-white px-2 py-1 font-display"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {stage === "start" && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">¡Hola, {profile.name}! ¿Qué quieres aprender hoy?</h2>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              startLesson(topic);
            }}
          >
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Dinosaurios, planetas, el mar..."
              className="min-h-14 flex-1 rounded-2xl border-4 border-ink px-4 text-xl"
            />
            <Button type="submit">¡Vamos!</Button>
          </form>
          {micAvailable && (
            <Button tone="sea" onClick={onMic} disabled={listening}>
              {listening ? "Te escucho..." : "🎤 Dímelo hablando"}
            </Button>
          )}
          <EngineSummary profile={profile} />
        </Card>
      )}

      {stage === "loading" && (
        <Card className="flex flex-col items-center gap-3 text-center">
          <Lulo size={120} thinking />
          <p className="font-display text-2xl">Lulo está preparando tu clase...</p>
        </Card>
      )}

      {stage === "error" && (
        <Card className="flex flex-col items-center gap-3 text-center">
          <Lulo size={96} />
          <p className="font-display text-2xl">¡Ay! Lulo se enredó. ¿Lo intentamos otra vez?</p>
          <Button onClick={() => setStage("start")}>Volver</Button>
        </Card>
      )}

      {stage === "lesson" && lesson && (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-bold text-sea">
            {lesson.topic} · tarjeta {step + 1} de {lesson.cards.length}
          </p>
          <h2 className="text-2xl font-bold">{lesson.cards[step].title}</h2>
          <LessonImage key={lesson.cards[step].image.query} request={lesson.cards[step].image} alt={lesson.cards[step].title} />
          <p className="text-xl leading-relaxed">{lesson.cards[step].text}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              tone="plain"
              onClick={() => {
                setSignals((s) => ({ ...s, replays: s.replays + 1 }));
                speak(lesson.cards[step].speech);
              }}
            >
              🔁 Otra vez
            </Button>
            <Button
              tone="coral"
              onClick={() => {
                setSignals((s) => ({ ...s, confused: s.confused + 1 }));
                speak("¡Tranquilo! Mira el dibujo y lo leemos otra vez.");
              }}
            >
              🤔 No entendí
            </Button>
          </div>
          <Button onClick={nextCard}>{step + 1 < lesson.cards.length ? "Siguiente →" : "¡A la trivia!"}</Button>
        </Card>
      )}

      {stage === "quiz" && lesson && (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-bold text-sea">
            Trivia · pregunta {step + 1} de {lesson.quiz.length}
          </p>
          <h2 className="text-2xl font-bold">{lesson.quiz[step].question}</h2>
          <div className="flex flex-col gap-3">
            {lesson.quiz[step].options.map((option, i) => (
              <Button key={option} tone="plain" disabled={!!feedback} onClick={() => answer(i)}>
                {option}
              </Button>
            ))}
          </div>
          {!feedback && (
            <button
              className="self-start text-sm underline"
              onClick={() => {
                setSignals((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }));
                speak(lesson.quiz[step].hint);
              }}
            >
              💡 Pista
            </button>
          )}
          {feedback && (
            <div className="flex flex-col gap-3 rounded-2xl bg-mango/40 p-4">
              <p className="text-lg">{feedback.text}</p>
              <Button onClick={goToNextQuestion}>Seguir</Button>
            </div>
          )}
        </Card>
      )}

      {stage === "done" && lesson && (
        <Card className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold text-iguana">¡Lo lograste!</h2>
          <p className="text-xl">
            Acertaste {signals.correct} de {lesson.quiz.length} y ganaste ⭐ {1 + signals.correct}
          </p>
          <LessonImage key={lesson.sticker.query} request={{ kind: "illustration", query: lesson.sticker.query }} alt={lesson.sticker.name} />
          <p className="font-display text-xl">Nuevo sticker: {lesson.sticker.name}</p>
          <Button onClick={() => setStage("start")}>Aprender otra cosa</Button>
        </Card>
      )}
    </main>
  );
}

const STYLE_LABELS: Record<string, string> = {
  story: "Historias",
  visual: "Visual",
  analogy: "Analogías",
  stepByStep: "Paso a paso",
  game: "Juego",
};

// Small view of the adaptive engine, so the jury can see why two kids get different lessons.
function EngineSummary({ profile }: { profile: LearnerProfile }) {
  return (
    <details className="rounded-2xl bg-sand p-3">
      <summary className="cursor-pointer font-display font-bold">Cómo aprende {profile.name}</summary>
      <ul className="mt-2 flex flex-col gap-1">
        {Object.entries(profile.styleScores)
          .sort((a, b) => b[1] - a[1])
          .map(([style, score]) => (
            <li key={style} className="flex items-center gap-2">
              <span className="w-28 text-sm">{STYLE_LABELS[style]}</span>
              <span className="h-3 flex-1 rounded-full bg-white">
                <span className="block h-3 rounded-full bg-sea" style={{ width: `${Math.round(score * 100)}%` }} />
              </span>
              <span className="w-10 text-right text-sm">{Math.round(score * 100)}</span>
            </li>
          ))}
      </ul>
      {profile.lastNote && <p className="mt-2 text-sm">{profile.lastNote}</p>}
    </details>
  );
}
