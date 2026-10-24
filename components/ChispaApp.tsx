"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { adventures, findAdventure } from "@/lib/adventures";
import {
  awardProgress,
  clearJourney,
  defaultPreferences,
  emptyProgress,
  JOURNEY_KEY,
  JourneySchema,
  PREFERENCES_KEY,
  PreferencesSchema,
  PROGRESS_KEY,
  ProgressSchema,
  readStored,
  storeLocal,
  type Journey,
  type Preferences,
  type Progress,
} from "@/lib/journey";
import { getCardSupport, isDemo, lessonService } from "@/lib/lesson-service";
import { initialLuloState, luloReducer } from "@/lib/lulo";
import { canListen, listen, speak, stopSpeaking } from "@/lib/speech";
import { AdventureArt, Icon } from "./AdventureArt";
import { LearningCard } from "./LearningCard";
import { LuloAvatar } from "./LuloAvatar";

type Stage = "start" | "loading" | "lesson" | "quiz" | "done" | "error";
const greetings = [
  "¡Hola! ¿Listo para un gran descubrimiento?",
  "Las buenas aventuras empiezan con una pregunta.",
  "Vamos a tu ritmo. ¡Yo te acompaño!",
];

export default function ChispaApp() {
  const [stage, setStage] = useState<Stage>("start");
  const [journey, setJourneyState] = useState<Journey | null>(null);
  const [resume, setResume] = useState<Journey | null>(null);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);
  const [topic, setTopic] = useState("");
  const [requestedTopic, setRequestedTopic] = useState("");
  const [homeMessage, setHomeMessage] = useState("");
  const [greeting, setGreeting] = useState(0);
  const [adultOpen, setAdultOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lulo, dispatch] = useReducer(luloReducer, initialLuloState);
  const heading = useRef<HTMLHeadingElement>(null);
  const topicInput = useRef<HTMLInputElement>(null);
  const adultPanel = useRef<HTMLElement>(null);
  const albumPanel = useRef<HTMLElement>(null);
  const adultToggle = useRef<HTMLButtonElement>(null);
  const albumToggle = useRef<HTMLButtonElement>(null);
  const answerLock = useRef(false);
  const journeyRef = useRef<Journey | null>(null);
  const requestLock = useRef(false);
  const rewarded = useRef(false);
  const stopListening = useRef<(() => void) | undefined>(undefined);
  const active = stage === "lesson" || stage === "quiz";

  useEffect(() => {
    // Read browser capabilities and local demo data only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(readStored(PROGRESS_KEY, ProgressSchema, emptyProgress));
    setPreferences(
      readStored(PREFERENCES_KEY, PreferencesSchema, defaultPreferences),
    );
    setResume(readStored(JOURNEY_KEY, JourneySchema.nullable(), null));
    setMicAvailable(canListen());
    setVoiceAvailable("speechSynthesis" in window);
    return () => {
      stopSpeaking();
      stopListening.current?.();
    };
  }, []);

  useEffect(() => {
    heading.current?.focus();
  }, [stage, journey?.step]);
  useEffect(() => {
    if (adultOpen) adultPanel.current?.focus();
  }, [adultOpen]);
  useEffect(() => {
    if (albumOpen) albumPanel.current?.focus();
  }, [albumOpen]);

  // Save at the action boundary so a quick pause/reload cannot persist an older render.
  function setJourney(next: Journey) {
    journeyRef.current = next;
    setJourneyState(next);
    storeLocal(JOURNEY_KEY, next);
  }

  function read(text: string) {
    speak(text, (speaking) =>
      dispatch(speaking ? "SPEECH_STARTED" : "SPEECH_ENDED"),
    );
  }

  function changePreferences(next: Preferences) {
    setPreferences(next);
    storeLocal(PREFERENCES_KEY, next);
  }

  async function startLesson(requested: string) {
    if (requestLock.current) return;
    const trimmed = requested.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      setHomeMessage("Escribe una idea de entre 2 y 100 letras.");
      topicInput.current?.focus();
      return;
    }
    if (isDemo && !findAdventure(trimmed)) {
      setHomeMessage(
        "Esa aventura aún no está en el cuaderno. Por ahora puedes elegir Dinosaurios, Planetas o El océano.",
      );
      topicInput.current?.focus();
      return;
    }
    requestLock.current = true;
    stopSpeaking();
    stopListening.current?.();
    setListening(false);
    setRequestedTopic(trimmed);
    setStage("loading");
    setHomeMessage("");
    setAlbumOpen(false);
    setAdultOpen(false);
    dispatch("LESSON_REQUESTED");
    try {
      const lesson = await lessonService.getLesson({
        topic: trimmed,
        age: 8,
        style: "story",
        level: "explorer",
      });
      const next: Journey = {
        stage: "lesson",
        lesson,
        step: 0,
        choice: null,
        submitted: false,
        correct: 0,
        help: 0,
        feedback: "",
      };
      setJourney(next);
      setResume(null);
      setStage("lesson");
      answerLock.current = false;
      rewarded.current = false;
      dispatch("LESSON_CARD_SHOWN");
    } catch {
      setStage("error");
      dispatch("CHILD_NEEDS_HELP");
    } finally {
      requestLock.current = false;
    }
  }

  function pause() {
    const journey = journeyRef.current;
    if (busy) return;
    stopSpeaking();
    stopListening.current?.();
    setListening(false);
    if (active && journey) {
      setResume(journey);
      storeLocal(JOURNEY_KEY, journey);
    }
    setStage("start");
    setHomeMessage("");
    dispatch("APP_READY");
  }

  function resumeJourney() {
    if (!resume) return;
    stopSpeaking();
    setJourney(resume);
    setStage(resume.stage);
    answerLock.current = resume.submitted;
    rewarded.current = false;
    dispatch(
      resume.stage === "lesson"
        ? "LESSON_CARD_SHOWN"
        : resume.submitted
          ? "CHILD_NEEDS_HELP"
          : "QUIZ_STARTED",
    );
  }

  function showCard(step: number) {
    const journey = journeyRef.current;
    if (!journey) return;
    stopSpeaking();
    setJourney({ ...journey, step, feedback: "" });
    dispatch("LESSON_CARD_SHOWN");
  }

  function startQuiz() {
    const journey = journeyRef.current;
    if (!journey) return;
    stopSpeaking();
    setJourney({
      ...journey,
      stage: "quiz",
      step: 0,
      choice: null,
      submitted: false,
      feedback: "",
    });
    setStage("quiz");
    answerLock.current = false;
    dispatch("QUIZ_STARTED");
  }

  function choose(choice: number) {
    const journey = journeyRef.current;
    if (!journey || journey.submitted || answerLock.current) return;
    setJourney({ ...journey, choice });
  }

  async function submitAnswer() {
    const journey = journeyRef.current;
    if (
      !journey ||
      journey.choice === null ||
      journey.submitted ||
      answerLock.current
    )
      return;
    answerLock.current = true;
    setBusy(true);
    stopSpeaking();
    const question = journey.lesson.quiz[journey.step];
    const correct = journey.choice === question.answerIndex;
    let feedback = (
      findAdventure(journey.lesson.topic)?.explanations[journey.step] ??
      `La respuesta es ${question.options[question.answerIndex]}.`
    ).replace(/^(¡Casi!|¡Mira esta pista!)\s*/, "");
    if (!correct) {
      dispatch("CHILD_NEEDS_HELP");
      try {
        feedback = (
          await lessonService.getReexplanation(
            journey.lesson,
            journey.step,
            journey.choice,
          )
        ).text;
      } catch {
        feedback = `Probemos de otra forma: la respuesta es «${question.options[question.answerIndex]}». ${question.hint}`;
      }
    }
    setJourney({
      ...journey,
      submitted: true,
      correct: journey.correct + (correct ? 1 : 0),
      feedback,
    });
    setBusy(false);
  }

  function nextQuestion() {
    const journey = journeyRef.current;
    if (!journey || !journey.submitted || busy) return;
    stopSpeaking();
    if (journey.step + 1 < journey.lesson.quiz.length) {
      setJourney({
        ...journey,
        step: journey.step + 1,
        choice: null,
        submitted: false,
        feedback: "",
      });
      answerLock.current = false;
      dispatch("QUIZ_STARTED");
    } else if (!rewarded.current) {
      rewarded.current = true;
      const next = awardProgress(progress, journey);
      setProgress(next);
      storeLocal(PROGRESS_KEY, next);
      clearJourney();
      setResume(null);
      setStage("done");
      dispatch("REWARD_EARNED");
    }
  }

  function helpWithCard() {
    const journey = journeyRef.current;
    if (!journey) return;
    setJourney({
      ...journey,
      help: journey.help + 1,
      feedback: getCardSupport(journey.lesson, journey.step),
    });
    dispatch("CHILD_NEEDS_HELP");
  }

  function hint() {
    const journey = journeyRef.current;
    if (!journey || journey.submitted || answerLock.current) return;
    setJourney({
      ...journey,
      help: journey.help + 1,
      feedback: journey.lesson.quiz[journey.step].hint,
    });
    dispatch("CHILD_NEEDS_HELP");
  }

  function onMic() {
    if (listening) {
      stopListening.current?.();
      setListening(false);
      return;
    }
    stopSpeaking();
    setListening(true);
    stopListening.current = listen(
      (text) => {
        setTopic(text.slice(0, 100));
        setHomeMessage("");
      },
      () => setListening(false),
      () =>
        setHomeMessage(
          "No pudimos usar el micrófono. Puedes escribir tu pregunta y tocar Vamos.",
        ),
    );
  }

  const currentAdventure = journey
    ? findAdventure(journey.lesson.topic)
    : undefined;

  return (
    <main
      className="app-shell"
      data-large-text={preferences.largeText}
      data-reduce-motion={preferences.reduceMotion}
    >
      <a className="skip-link" href="#adventure">
        Saltar a la aventura
      </a>
      <header className="app-header">
        <button
          className="brand"
          onClick={pause}
          disabled={stage === "loading" || busy}
          aria-label="Inicio de Chispa"
        >
          <span className="brand-spark">
            <Icon name="spark" size={32} />
          </span>
          chispa<span className="brand-dot">.</span>
        </button>
        <nav className="header-actions" aria-label="Mi espacio">
          <span
            className="star-counter"
            aria-label={`${progress.stars} estrellas`}
          >
            <Icon name="star" size={19} />
            <strong>{progress.stars}</strong>
          </span>
          <button
            ref={albumToggle}
            className="header-button"
            aria-expanded={albumOpen}
            aria-controls="album-panel"
            onClick={() => {
              setAlbumOpen(!albumOpen);
              setAdultOpen(false);
            }}
          >
            <Icon name="book" />
            <span>Mi álbum</span>
          </button>
          <details className="settings-menu">
            <summary className="header-button">
              <Icon name="settings" />
              <span>Lectura y movimiento</span>
            </summary>
            <div className="settings-panel">
              <strong>A tu manera</strong>
              <p>Elige cómo te resulta más cómodo aprender.</p>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.largeText}
                  onChange={(event) =>
                    changePreferences({
                      ...preferences,
                      largeText: event.target.checked,
                    })
                  }
                />
                <span>Texto más grande</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.reduceMotion}
                  onChange={(event) =>
                    changePreferences({
                      ...preferences,
                      reduceMotion: event.target.checked,
                    })
                  }
                />
                <span>Sin animaciones</span>
              </label>
              <small>
                También respetamos la preferencia de movimiento de tu
                dispositivo.
              </small>
            </div>
          </details>
        </nav>
      </header>

      {albumOpen && (
        <section
          id="album-panel"
          className="drawer album-panel"
          ref={albumPanel}
          tabIndex={-1}
          aria-labelledby="album-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">TU CUADERNO DE LOGROS</p>
              <h2 id="album-title">Mira todo lo que has descubierto</h2>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setAlbumOpen(false);
                albumToggle.current?.focus();
              }}
            >
              Cerrar álbum
            </button>
          </div>
          <div className="album-grid">
            {adventures.map((adventure) => {
              const earned = progress.stickers.includes(
                adventure.lesson.sticker.name,
              );
              return (
                <div
                  key={adventure.id}
                  className={`album-badge ${earned ? "badge-earned" : ""}`}
                >
                  <AdventureArt subject={adventure.id} />
                  <strong>{adventure.lesson.sticker.name}</strong>
                  <span>
                    {earned
                      ? "¡Ya es tuyo!"
                      : "Te espera al completar la aventura"}
                  </span>
                </div>
              );
            })}
          </div>
          {progress.stickers
            .filter(
              (name) =>
                !adventures.some(
                  (adventure) => adventure.lesson.sticker.name === name,
                ),
            )
            .map((name) => (
              <p className="extra-badge" key={name}>
                <Icon name="star" />
                {name}
              </p>
            ))}
          <p className="small-note">
            Cada aventura suma. Puedes volver a jugar sin perder tus logros.
          </p>
        </section>
      )}

      {adultOpen && (
        <section
          className="drawer adult-panel"
          ref={adultPanel}
          tabIndex={-1}
          aria-labelledby="adult-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">PARA QUIENES ACOMPAÑAN</p>
              <h2 id="adult-title">Un vistazo al recorrido</h2>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setAdultOpen(false);
                adultToggle.current?.focus();
              }}
            >
              Cerrar panel
            </button>
          </div>
          <div className="stat-grid">
            <p>
              <strong>{progress.sessions}</strong>Aventuras completadas
            </p>
            <p>
              <strong>
                {progress.correct}/{progress.questions}
              </strong>
              Respuestas acertadas
            </p>
            <p>
              <strong>{progress.help}</strong>Ayudas solicitadas
            </p>
          </div>
          <p>
            Son contadores de actividad en este navegador. No son un diagnóstico
            ni determinan cómo aprende una persona.
          </p>
          <p className="adult-tip">
            <strong>Una idea para acompañar:</strong> pregunta «¿qué
            descubriste?» y deja que lo explique con sus palabras, un dibujo o
            un ejemplo.
          </p>
        </section>
      )}

      <div id="adventure" className="adventure">
        {stage === "start" && (
          <>
            {resume && (
              <section className="resume-banner" aria-label="Aventura guardada">
                <span className="resume-icon">
                  <Icon name="book" size={28} />
                </span>
                <div>
                  <strong>Tu aventura te está esperando</strong>
                  <p>
                    {resume.lesson.topic} ·{" "}
                    {resume.stage === "lesson" ? "Descubrimiento" : "Pregunta"}{" "}
                    {resume.step + 1} de{" "}
                    {resume.stage === "lesson"
                      ? resume.lesson.cards.length
                      : resume.lesson.quiz.length}
                  </p>
                </div>
                <button
                  className="primary-button compact-button"
                  onClick={resumeJourney}
                >
                  Continuar
                  <Icon name="arrow" />
                </button>
              </section>
            )}
            <section className="welcome-grid">
              <div className="welcome-copy">
                <span className="pill-label">
                  <span className="status-dot" />
                  APRENDE A TU RITMO
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  La curiosidad nos lleva
                  <br />
                  <span>a lugares increíbles.</span>
                </h1>
                <p className="intro">
                  Soy Lulo. Elige una aventura y descubramos algo nuevo, una
                  pregunta a la vez.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => startLesson("Dinosaurios")}
                  >
                    Explorar dinosaurios
                    <Icon name="arrow" />
                  </button>
                  <button
                    className="text-button surprise-button"
                    onClick={() =>
                      startLesson(
                        adventures[
                          Math.floor(Math.random() * adventures.length)
                        ].title,
                      )
                    }
                  >
                    <Icon name="spark" size={18} />
                    Sorpréndeme
                  </button>
                </div>
                <div className="hero-promise">
                  <span>
                    <Icon name="clock" size={16} />
                    4–5 minutos por aventura
                  </span>
                  <span>
                    <Icon name="sound" size={16} />
                    Puedes leer o escuchar
                  </span>
                </div>
                <details className="how-it-works">
                  <summary>¿Cómo se juega?</summary>
                  <ol>
                    <li>
                      <strong>Descubre:</strong> mira las tarjetas y escucha si
                      quieres.
                    </li>
                    <li>
                      <strong>Juega:</strong> elige una respuesta. Siempre
                      puedes pedir ayuda.
                    </li>
                    <li>
                      <strong>Celebra:</strong> guarda tu sticker en el álbum.
                    </li>
                  </ol>
                </details>
              </div>
              <div className="mascot-world">
                <span className="world-orbit" aria-hidden="true" />
                <span className="orbit-star orbit-star-one" aria-hidden="true">
                  ✦
                </span>
                <span className="orbit-star orbit-star-two" aria-hidden="true">
                  ✧
                </span>
                <div className="mascot-bubble" role="status">
                  {greetings[greeting % greetings.length]}
                </div>
                <button
                  className="mascot-greeting"
                  onClick={() => setGreeting(greeting + 1)}
                  aria-label="Saludar a Lulo"
                >
                  <LuloAvatar key={greeting} size={290} />
                  <span>
                    Toca a Lulo para saludar <span aria-hidden="true">♡</span>
                  </span>
                </button>
                <span className="mascot-name">
                  LULO <span>Tu compañero de descubrimientos</span>
                </span>
              </div>
            </section>

            <section
              className="explore-section"
              aria-labelledby="explore-title"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">TU PRÓXIMO DESCUBRIMIENTO</p>
                  <h2 id="explore-title">¿A dónde quieres ir?</h2>
                </div>
                <span className="catalog-note">
                  Tres aventuras para empezar
                </span>
              </div>
              <div className="topic-grid">
                {adventures.map((adventure, index) => (
                  <button
                    key={adventure.id}
                    className={`topic-tile topic-${adventure.id}`}
                    onClick={() => startLesson(adventure.title)}
                    aria-label={`Explorar ${adventure.title}`}
                  >
                    <div className="topic-picture">
                      <span className="topic-number">0{index + 1}</span>
                      <AdventureArt subject={adventure.id} />
                      <span className="topic-arrow">
                        <Icon name="arrow" size={19} />
                      </span>
                    </div>
                    <div className="topic-copy">
                      <h3>{adventure.title}</h3>
                      <p>{adventure.description}</p>
                      <span>
                        <Icon name="clock" size={15} />
                        {adventure.minutes} min <i aria-hidden="true">·</i>{" "}
                        {adventure.lesson.cards.length} descubrimientos
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="your-question" aria-labelledby="question-title">
              <div>
                <span className="question-symbol">
                  <Icon name="help" size={27} />
                </span>
                <h2 id="question-title">¿Tienes una pregunta en mente?</h2>
                <p>
                  {isDemo
                    ? "Puedes escribir Dinosaurios, Planetas o El océano. Pronto tendremos más aventuras."
                    : "Escribe qué te gustaría descubrir y prepararemos una aventura."}
                </p>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  startLesson(topic);
                }}
              >
                <label className="sr-only" htmlFor="topic">
                  ¿Qué quieres aprender?
                </label>
                <div className="topic-input">
                  <input
                    ref={topicInput}
                    id="topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Por ejemplo: el océano"
                    aria-describedby="topic-message"
                  />
                  {micAvailable && (
                    <button
                      type="button"
                      className={`mic-button ${listening ? "mic-active" : ""}`}
                      onClick={onMic}
                      aria-label={
                        listening ? "Detener dictado" : "Dictar mi pregunta"
                      }
                      aria-pressed={listening}
                    >
                      <Icon name={listening ? "stop" : "mic"} />
                    </button>
                  )}
                </div>
                <button type="submit" className="secondary-button">
                  Vamos
                  <Icon name="arrow" />
                </button>
              </form>
              <p
                id="topic-message"
                className={`small-note ${homeMessage ? "form-message" : ""}`}
                role="status"
              >
                {homeMessage ||
                  (listening
                    ? "Te escucho. Revisa el texto y toca Vamos cuando esté listo."
                    : !micAvailable
                      ? "Puedes escribir; el dictado no está disponible en este navegador."
                      : "El micrófono es opcional. Tú decides cómo preguntar.")}
              </p>
            </section>
          </>
        )}

        {stage === "loading" && (
          <section className="center-stage loading-stage" aria-busy="true">
            <LuloAvatar scene="loading" size={210} />
            <p className="eyebrow">
              PREPARANDO {requestedTopic.toLocaleUpperCase("es")}
            </p>
            <h1 ref={heading} tabIndex={-1}>
              Una nueva aventura está por empezar.
            </h1>
            <p role="status">Lulo está reuniendo tus descubrimientos.</p>
            <div className="loading-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </section>
        )}
        {stage === "error" && (
          <section className="center-stage">
            <LuloAvatar scene="encourage" size={210} />
            <h1 ref={heading} tabIndex={-1}>
              Nos faltó una pequeña pista.
            </h1>
            <p role="alert">
              No pudimos preparar esta aventura. Podemos volver a intentarlo.
            </p>
            <button
              className="primary-button"
              onClick={() => startLesson(requestedTopic)}
            >
              Intentar de nuevo
              <Icon name="arrow" />
            </button>
            <button className="text-button" onClick={pause}>
              Volver al inicio
            </button>
          </section>
        )}

        {active && journey && (
          <>
            <div className="journey-top">
              <JourneyTrail stage={stage} />
              <button
                className="text-button pause-button"
                onClick={pause}
                disabled={busy}
              >
                <Icon name="pause" size={18} />
                Pausar y guardar
              </button>
            </div>
            <section className="learning-layout">
              <aside className="learning-companion">
                <LuloAvatar
                  scene={lulo.scene}
                  isSpeaking={lulo.isSpeaking}
                  size={190}
                />
                <div className="companion-note">
                  <strong>Estoy contigo.</strong>
                  <p>
                    {lulo.scene === "encourage"
                      ? "Pedir ayuda también es aprender. Vamos paso a paso."
                      : stage === "quiz"
                        ? "Piensa con calma. Puedes cambiar tu opción antes de comprobar."
                        : "Lee, escucha o pide otra explicación. Tú eliges."}
                  </p>
                </div>
                <span className="saved-note">
                  <Icon name="check" size={14} />
                  Tu avance se guarda en este navegador.
                </span>
              </aside>
              <LearningCard
                journey={journey}
                busy={busy}
                speaking={lulo.isSpeaking}
                voiceAvailable={voiceAvailable}
                heading={heading}
                onRead={read}
                onStop={stopSpeaking}
                onCard={showCard}
                onQuiz={startQuiz}
                onChoose={choose}
                onSubmit={submitAnswer}
                onNext={nextQuestion}
                onHelp={helpWithCard}
                onHint={hint}
              />
            </section>
          </>
        )}

        {stage === "done" && journey && (
          <>
            <JourneyTrail stage="done" />
            <section className="reward-layout content-enter">
              <div className="reward-copy">
                <span className="pill-label">
                  <Icon name="check" size={16} />
                  AVENTURA COMPLETADA
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  ¡Mira hasta dónde
                  <br />
                  <span>te llevó tu curiosidad!</span>
                </h1>
                <p>
                  Exploraste {journey.lesson.cards.length} descubrimientos sobre{" "}
                  {journey.lesson.topic.toLocaleLowerCase("es")} y acertaste{" "}
                  {journey.correct} de {journey.lesson.quiz.length} preguntas.
                </p>
                <div className="earned-stars">
                  <Icon name="star" size={26} />+{1 + journey.correct} estrellas{" "}
                  <small>Una por explorar y una por cada acierto.</small>
                </div>
                <div className="hero-actions">
                  <button className="primary-button" onClick={pause}>
                    Otra aventura
                    <Icon name="arrow" />
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setAlbumOpen(true);
                      setAdultOpen(false);
                    }}
                  >
                    <Icon name="book" />
                    Ver mi álbum
                  </button>
                </div>
                <div className="offline-mission">
                  <Icon name="spark" />
                  <div>
                    <strong>Lleva tu descubrimiento al mundo</strong>
                    <p>
                      {currentAdventure?.mission ??
                        "Cuéntale a alguien lo que aprendiste, con tus palabras o con un dibujo."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="reward-portrait">
                <LuloAvatar scene="reward" size={250} />
                <div
                  className={`reward-sticker art-${currentAdventure?.id ?? "book"}`}
                >
                  <AdventureArt subject={currentAdventure?.id} />
                  <strong>{journey.lesson.sticker.name}</strong>
                  <span>¡Un nuevo logro en tu álbum!</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <footer className="app-footer">
        <span className="footer-signature">
          <Icon name="spark" size={17} />
          Hecho con curiosidad y un poquito de Caribe.
        </span>
        <div>
          <span>
            {isDemo ? "Aventuras demo · Sin cuenta" : "Aprende con Lulo"}
          </span>
          <button
            ref={adultToggle}
            className="text-button"
            aria-expanded={adultOpen}
            onClick={() => {
              setAdultOpen(!adultOpen);
              setAlbumOpen(false);
            }}
          >
            Para quienes acompañan
          </button>
        </div>
      </footer>
    </main>
  );
}

function JourneyTrail({ stage }: { stage: string }) {
  const index = stage === "lesson" ? 0 : stage === "quiz" ? 1 : 2;
  return (
    <ol className="journey-trail" aria-label="Tu aventura">
      {["Descubre", "Juega", "Celebra"].map((label, step) => (
        <li
          key={label}
          className={step <= index ? "trail-reached" : ""}
          aria-current={step === index ? "step" : undefined}
        >
          <span>
            {step < index ? <Icon name="check" size={14} /> : step + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
