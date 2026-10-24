"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { canListen, listen, speak, stopSpeaking } from "@/lib/speech";
import { initialLuloState, luloReducer } from "@/lib/lulo";
import { getCardSupport, isDemo, lessonService } from "@/lib/lesson-service";
import type { Lesson } from "@/lib/schema";
import { LuloAvatar } from "./LuloAvatar";
import { Button } from "./ui";

type Stage = "start" | "loading" | "lesson" | "quiz" | "done" | "error";
type Progress = { stars: number; sessions: number; correct: number; questions: number; help: number; stickers: string[] };
const EMPTY: Progress = { stars: 0, sessions: 0, correct: 0, questions: 0, help: 0, stickers: [] };
const STORAGE_KEY = "chispa:lulo-progress:v1";

function loadProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (value && ["stars", "sessions", "correct", "questions", "help"].every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0)
      && Array.isArray(value.stickers) && value.stickers.every((s: unknown) => typeof s === "string")) return value;
  } catch { /* Demo works when storage is blocked. */ }
  return EMPTY;
}

export default function ChispaApp() {
  const [stage, setStage] = useState<Stage>("start");
  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [answering, setAnswering] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [help, setHelp] = useState(0);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [adultOpen, setAdultOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [lulo, dispatch] = useReducer(luloReducer, initialLuloState);
  const heading = useRef<HTMLHeadingElement>(null);
  const answerLock = useRef(false);
  const requestLock = useRef(false);
  const stopListening = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    // Read browser capabilities and local counters after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(loadProgress());
    setMicAvailable(canListen());
    setVoiceAvailable("speechSynthesis" in window);
    dispatch("APP_READY");
    return () => { stopSpeaking(); stopListening.current?.(); };
  }, []);

  useEffect(() => { heading.current?.focus(); }, [stage, step]);

  function read(text: string) {
    speak(text, (speaking) => dispatch(speaking ? "SPEECH_STARTED" : "SPEECH_ENDED"));
  }

  async function startLesson(requested: string) {
    if (requestLock.current || requested.trim().length < 2 || requested.trim().length > 100) return;
    requestLock.current = true;
    stopSpeaking(); stopListening.current?.(); setListening(false);
    setStage("loading"); dispatch("LESSON_REQUESTED");
    setFeedback(""); setCorrect(0); setHelp(0); setStep(0); setSelected(null);
    answerLock.current = false;
    try {
      const next = await lessonService.getLesson({ topic: requested.trim(), age: 8, style: "story", level: "explorer" });
      setLesson(next); setStage("lesson"); dispatch("LESSON_CARD_SHOWN");
    } catch { setStage("error"); dispatch("CHILD_NEEDS_HELP"); }
    finally { requestLock.current = false; }
  }

  function onMic() {
    stopSpeaking(); setListening(true);
    stopListening.current = listen((text) => setTopic(text.slice(0, 100)), () => setListening(false));
  }

  function showCard(index: number) {
    stopSpeaking(); setFeedback(""); setStep(index); dispatch("LESSON_CARD_SHOWN");
  }

  function startQuiz() {
    stopSpeaking(); setFeedback(""); setStep(0); setStage("quiz"); dispatch("QUIZ_STARTED");
  }

  async function answer(index: number) {
    if (!lesson || answerLock.current) return;
    answerLock.current = true;
    stopSpeaking(); setAnswering(true); setSelected(index);
    const question = lesson.quiz[step];
    if (index === question.answerIndex) {
      setCorrect((value) => value + 1);
      setFeedback("¡Qué chévere! Descubriste la respuesta. Sigamos explorando.");
    } else {
      dispatch("CHILD_NEEDS_HELP");
      try { setFeedback((await lessonService.getReexplanation(lesson, step, index)).text); }
      catch { setFeedback(`¡Casi! La respuesta es «${question.options[question.answerIndex]}». Vamos a aprenderlo juntos.`); }
    }
    setAnswering(false);
  }

  function nextQuestion() {
    if (!lesson) return;
    stopSpeaking();
    if (step + 1 < lesson.quiz.length) {
      setStep(step + 1); setSelected(null); setFeedback(""); answerLock.current = false; dispatch("QUIZ_STARTED");
    } else {
      const next: Progress = { stars: progress.stars + 1 + correct, sessions: progress.sessions + 1,
        correct: progress.correct + correct, questions: progress.questions + lesson.quiz.length,
        help: progress.help + help, stickers: [...new Set([...progress.stickers, lesson.sticker.name])] };
      setProgress(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep in-memory progress. */ }
      setStage("done"); dispatch("REWARD_EARNED");
    }
  }

  function home() {
    stopSpeaking(); stopListening.current?.(); setListening(false);
    setStage("start"); setFeedback(""); setTopic(""); dispatch("APP_READY");
  }

  const card = lesson?.cards[step];
  const question = lesson?.quiz[step];
  const active = stage === "lesson" || stage === "quiz";

  return (
    <main className="app-shell">
      <a className="skip-link" href="#adventure">Saltar a la aventura</a>
      <header className="app-header">
        <button className="brand" onClick={home} disabled={stage === "loading" || answering} aria-label="Chispa, volver al inicio"><span className="brand-spark" aria-hidden="true">✳</span> chispa<span className="brand-dot">.</span></button>
        <nav aria-label="Mi espacio" className="header-actions">
          <span className="star-counter" aria-label={`${progress.stars} estrellas`}>★ <span>{progress.stars}</span></span>
          <button className="quiet-button" aria-expanded={albumOpen} onClick={() => setAlbumOpen(!albumOpen)}>Mi álbum</button>
          <button className="quiet-button adult-toggle" aria-expanded={adultOpen} onClick={() => setAdultOpen(!adultOpen)}>Para adultos</button>
        </nav>
      </header>
      {albumOpen && <section className="drawer" aria-label="Mi álbum"><h2>Mi álbum de descubrimientos</h2><p>{progress.stickers.length ? progress.stickers.join(" · ") : "Tu primer sticker te espera al terminar una aventura."}</p></section>}
      {adultOpen && <section className="drawer adult-panel" aria-label="Panel adulto demo"><p className="eyebrow">ACOMPAÑAMIENTO · DEMO LOCAL</p><h2>Cada descubrimiento cuenta</h2><div className="stat-grid"><p><strong>{progress.sessions}</strong>Aventuras completadas</p><p><strong>{progress.correct}/{progress.questions}</strong>Respuestas acertadas</p><p><strong>{progress.help}</strong>Ayudas solicitadas</p></div><p>Estos contadores describen la actividad de esta demo. No son un diagnóstico ni determinan cómo aprende un niño. Se guardan solo en este navegador.</p></section>}

      <div id="adventure" className="adventure">
        {stage === "start" && <>
          <section className="welcome-grid">
            <div className="welcome-copy"><p className="eyebrow"><span className="tiny-spark">✦</span> LA CURIOSIDAD ES EL COMIENZO</p><h1 ref={heading} tabIndex={-1}>Pequeñas preguntas.<br /><span>Grandes aventuras.</span></h1><p className="intro">¡Hola! Soy Lulo, tu compañero de descubrimientos. ¿Qué vamos a explorar juntos hoy?</p><form className="topic-form" onSubmit={(event) => { event.preventDefault(); startLesson(topic); }}><label htmlFor="topic">Quiero aprender sobre…</label><div className="topic-input"><input id="topic" value={topic} minLength={2} maxLength={100} required onChange={(event) => setTopic(event.target.value)} placeholder="Dinosaurios, planetas, el mar…" />{micAvailable && <button type="button" className="mic-button" onClick={onMic} disabled={listening} aria-label="Dictar el tema">{listening ? "•••" : "🎙"}</button>}</div><Button type="submit" disabled={topic.trim().length < 2}>¡Vamos a descubrir! <span aria-hidden="true">↗</span></Button></form><p className="form-help" role="status">{listening ? "Te escucho. Después puedes revisar el texto." : isDemo ? "Demo sin claves: cualquier tema abre la aventura de Dinosaurios." : "Elige un tema y prepara tu próxima aventura."}</p>{!micAvailable && <p className="form-help">Puedes escribir tu idea; este navegador no admite dictado.</p>}</div>
            <div className="mascot-world"><span className="world-orbit" aria-hidden="true" /><span className="floating-note">¡Aprendamos algo chévere!</span><LuloAvatar size={320} /><span className="mascot-caption">LULO <span>Tu amigo explorador</span></span></div>
          </section>
          <section className="explore-section" aria-label="Ideas para explorar"><div className="section-heading"><h2>Una idea para empezar</h2><span>Elige tu próxima aventura</span></div><div className="topic-grid">{[{ icon: "🦕", title: "Dinosaurios", caption: "Un viaje a un mundo gigante", tone: "mint" }, { icon: "🪐", title: "Planetas", caption: "Próximamente en la demo", tone: "lavender" }, { icon: "🐋", title: "Animales", caption: "Próximamente en la demo", tone: "peach" }].map((item) => <button key={item.title} className={`topic-tile ${item.tone}`} disabled={isDemo && item.title !== "Dinosaurios"} onClick={() => { setTopic(item.title); startLesson(item.title); }}><span className="topic-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.title}</strong><small>{isDemo ? item.caption : "Una nueva aventura por descubrir"}</small></span><span aria-hidden="true">↗</span></button>)}</div></section>
          <div className="journey-strip"><span>01 <strong>Descubre</strong></span><span aria-hidden="true">····</span><span>02 <strong>Juega y aprende</strong></span><span aria-hidden="true">····</span><span>03 <strong>Colecciona logros</strong></span></div>
        </>}

        {stage === "loading" && <section className="center-stage" aria-busy="true"><LuloAvatar scene="loading" /><p className="eyebrow">UNA AVENTURA EN CAMINO</p><h1 ref={heading} tabIndex={-1}>Estoy preparando algo chévere para ti…</h1><p role="status">Buscando grandes descubrimientos para pequeñas preguntas.</p></section>}
        {stage === "error" && <section className="center-stage"><LuloAvatar scene="encourage" /><h1 ref={heading} tabIndex={-1}>¡Uy! Nos enredamos un poquito.</h1><p role="alert">Podemos volver a intentarlo juntos.</p><Button onClick={() => startLesson(topic)}>Intentar de nuevo</Button><button className="quiet-button" onClick={home}>Volver al inicio</button></section>}

        {active && lesson && <section className="learning-layout"><aside className="learning-companion"><p className="eyebrow">TU COMPAÑERO DE AVENTURA</p><LuloAvatar scene={lulo.scene} isSpeaking={lulo.isSpeaking} size={220} /><p className="companion-note">{lulo.scene === "encourage" ? "Vamos a mirarlo de otra forma. ¡Tú puedes!" : stage === "quiz" ? "Tómate tu tiempo. Estoy contigo." : "Cada pregunta nos lleva a un descubrimiento."}</p><button className="quiet-button" onClick={home} disabled={answering}>Salir de la aventura</button></aside><div className="lesson-panel"><div className="lesson-topline"><span>{stage === "lesson" ? lesson.topic : "Juega con lo que aprendiste"}</span><span>{step + 1} / {stage === "lesson" ? lesson.cards.length : lesson.quiz.length}</span></div><progress aria-label={stage === "lesson" ? "Progreso de la clase" : "Progreso de la trivia"} value={step + 1} max={stage === "lesson" ? lesson.cards.length : lesson.quiz.length} />
          {stage === "lesson" && card && <><p className="eyebrow">DESCUBRIMIENTO {String(step + 1).padStart(2, "0")}</p><h1 ref={heading} tabIndex={-1}>{card.title}</h1><LessonVisual index={step} title={card.title} demo={isDemo} /><p className="lesson-text">{card.text}</p><div className="lesson-tools"><button className="tool-button" disabled={!voiceAvailable} onClick={() => read(card.speech)}>♪ Escuchar</button><button className="tool-button" onClick={() => { setFeedback(""); dispatch("LESSON_CARD_SHOWN"); if (voiceAvailable) read(card.speech); }}>↻ Otra vez</button><button className="tool-button" onClick={() => { setHelp(help + 1); dispatch("CHILD_NEEDS_HELP"); setFeedback(getCardSupport(lesson, step)); }}>♡ No entendí</button></div>{!voiceAvailable && <p className="form-help">La lectura en voz alta no está disponible. Puedes leer el texto.</p>}{feedback && <p className="feedback" role="status">{feedback}</p>}<div className="lesson-navigation"><Button tone="plain" disabled={step === 0} onClick={() => showCard(step - 1)}>← Anterior</Button><Button onClick={() => step + 1 < lesson.cards.length ? showCard(step + 1) : startQuiz()}>{step + 1 < lesson.cards.length ? "Siguiente →" : "¡A la trivia! →"}</Button></div></>}
          {stage === "quiz" && question && <><p className="eyebrow">TU TURNO DE EXPLORAR</p><h1 ref={heading} tabIndex={-1}>{question.question}</h1><p className="quiz-intro">Elige una respuesta. Aquí también aprendemos al intentar.</p><div className="answer-options">{question.options.map((option, index) => <button key={option} className={`answer-option ${selected === index ? "is-selected" : ""} ${selected !== null && !answering && index === question.answerIndex ? "is-correct" : ""}`} disabled={selected !== null} onClick={() => answer(index)}><span className="option-letter">{String.fromCharCode(65 + index)}</span>{option}{selected !== null && !answering && index === question.answerIndex && <span aria-label="Respuesta correcta">✓</span>}</button>)}</div><div className="lesson-tools"><button className="tool-button" disabled={!voiceAvailable} onClick={() => read(question.question)}>♪ Escuchar pregunta</button><button className="tool-button" disabled={selected !== null} onClick={() => { setHelp(help + 1); setFeedback(question.hint); dispatch("CHILD_NEEDS_HELP"); }}>✧ Una pista</button></div><div role="status" aria-live="polite">{answering ? <p className="feedback">Veamos esta idea juntos…</p> : feedback && <p className="feedback">{feedback}</p>}</div>{selected !== null && !answering && <Button onClick={nextQuestion}>{step + 1 < lesson.quiz.length ? "Seguir explorando →" : "¡Ver mi premio! →"}</Button>}</>}
        </div></section>}

        {stage === "done" && lesson && <section className="center-stage reward-stage"><p className="eyebrow">OTRA AVENTURA EN TU HISTORIA</p><LuloAvatar scene="reward" size={220} /><h1 ref={heading} tabIndex={-1}>¡Lo lograste, explorador!</h1><p>Descubriste algo nuevo y acertaste {correct} de {lesson.quiz.length} preguntas.</p><div className="earned-stars">★ +{1 + correct} estrellas</div><p className="form-help">Una por participar y una por cada respuesta acertada.</p><div className="reward-sticker"><span aria-hidden="true">🦕</span><strong>{lesson.sticker.name}</strong><small>Ya está en tu álbum</small></div><Button onClick={home}>Descubrir otra aventura ↗</Button><button className="quiet-button" onClick={() => { setAlbumOpen(true); home(); }}>Abrir mi álbum</button></section>}
      </div>
      <footer className="app-footer"><span>Hecho con curiosidad y un poquito de Caribe.</span><span>{isDemo ? "Demo interactiva · Aprende a tu ritmo" : "Aprende a tu ritmo con Lulo"}</span></footer>
    </main>
  );
}

function LessonVisual({ index, title, demo }: { index: number; title: string; demo: boolean }) {
  return <figure className={`lesson-visual visual-${index % 3}`}><span className="visual-label">{demo ? "CUADERNO DE EXPLORACIÓN" : "TU ESPACIO PARA IMAGINAR"}</span><span className="visual-decoration" aria-hidden="true">✧</span><span className="discovery-icon" role="img" aria-label={demo ? ["Dinosaurio", "Tiranosaurio", "Alimentación", "Plantas", "Fósil"][index] ?? "Dinosaurio" : "Libro de descubrimientos"}>{demo ? ["🦕", "🦖", "🦴", "🌿", "🐚"][index] ?? "🦕" : "📖"}</span><figcaption>{title}<small>Ilustración de apoyo · imagina y descubre</small></figcaption></figure>;
}
