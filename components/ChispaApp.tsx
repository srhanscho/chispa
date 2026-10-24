"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import {
  levelFor,
  pickStyle,
  type LearnerProfile,
  type SessionLog,
} from "@/lib/engine";
import type { Lesson, Style } from "@/lib/schema";
import { completeProfile } from "@/lib/learner-ui";
import { saveCourse, finishCourse } from "@/lib/course-ui";
import { requestNote } from "@/lib/experience-api";
import { useLearners } from "./useLearners";
import {
  ParentInsights,
  CoursePanel,
  CreateChild,
  NextTopics,
} from "./ExperiencePanels";
import { TutorChat } from "./TutorChat";
import { PhotoTopic } from "./PhotoTopic";
import { LoadingAdventure } from "./LoadingAdventure";
import { LessonImage, prefetchLessonImages } from "./ui";
import { adventures, findAdventure } from "@/lib/adventures";
import {
  clearJourney,
  defaultPreferences,
  JOURNEY_KEY,
  JourneySchema,
  PREFERENCES_KEY,
  PreferencesSchema,
  readStored,
  storeLocal,
  type Journey,
  type Preferences,
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

type Tab = "home" | "courses" | "album" | "family";

const TABS: { id: Tab; label: string; icon: "home" | "book" | "star" | "family" }[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "courses", label: "Mis cursos", icon: "book" },
  { id: "album", label: "Álbum", icon: "star" },
  { id: "family", label: "Familia", icon: "family" },
];

export default function ChispaApp() {
  const learners = useLearners();
  const { profile } = learners;
  const [stage, setStage] = useState<Stage>("start");
  const [journey, setJourneyState] = useState<Journey | null>(null);
  const [resume, setResume] = useState<Journey | null>(null);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [photoHook, setPhotoHook] = useState("");
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
  const owner = useRef<LearnerProfile | null>(null);
  const questionStartedAt = useRef(0);
  const readCounts = useRef(new Map<string, number>());
  const stopListening = useRef<(() => void) | undefined>(undefined);
  const active = stage === "lesson" || stage === "quiz";
  const tab: Tab = coursesOpen ? "courses" : albumOpen ? "album" : adultOpen ? "family" : "home";

  useEffect(() => {
    // Read browser capabilities and local demo data only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const currentLesson = journey?.lesson;
  useEffect(() => {
    // Resolve every card image (and the sticker) while the child reads the first card.
    if (!currentLesson) return;
    prefetchLessonImages([
      ...currentLesson.cards.map((card) => card.image),
      { kind: "illustration", query: currentLesson.sticker.query },
    ]);
  }, [currentLesson]);
  useEffect(() => {
    if (adultOpen) adultPanel.current?.focus();
  }, [adultOpen]);
  useEffect(() => {
    if (albumOpen) albumPanel.current?.focus();
  }, [albumOpen]);
  useEffect(() => {
    if (journey?.learnerId && journey.learnerId !== profile.id) {
      stopSpeaking();
      owner.current = null;
      journeyRef.current = null;
      // A profile change must not leave another learner's lesson or reward visible.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJourneyState(null);
      setStage("start");
      setHomeMessage("Cambió el perfil. Elige una aventura para continuar.");
    }
  }, [journey?.learnerId, profile.id]);

  // Save at the action boundary so a quick pause/reload cannot persist an older render.
  function setJourney(next: Journey) {
    journeyRef.current = next;
    setJourneyState(next);
    storeLocal(JOURNEY_KEY, next);
  }

  function read(text: string) {
    const current = journeyRef.current;
    if (
      active &&
      current?.stage === "lesson" &&
      text === current.lesson.cards[current.step].speech
    ) {
      const key = `${current.courseId}:${current.step}`;
      const count = readCounts.current.get(key) ?? 0;
      readCounts.current.set(key, count + 1);
      if (count)
        setJourney({ ...current, replays: (current.replays ?? 0) + 1 });
    }
    speak(text, (speaking) =>
      dispatch(speaking ? "SPEECH_STARTED" : "SPEECH_ENDED"),
    );
  }

  function changePreferences(next: Preferences) {
    setPreferences(next);
    storeLocal(PREFERENCES_KEY, next);
  }

  async function startLesson(
    requested: string,
    suggestedStyle?: Style,
    hook = "",
  ) {
    if (requestLock.current) return;
    const trimmed = requested.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      setHomeMessage("Escribe una idea de entre 2 y 100 letras.");
      topicInput.current?.focus();
      return;
    }
    requestLock.current = true;
    stopSpeaking();
    stopListening.current?.();
    setListening(false);
    setRequestedTopic(trimmed);
    setPhotoHook(hook);
    setStage("loading");
    setHomeMessage("");
    setAlbumOpen(false);
    setAdultOpen(false);
    setCoursesOpen(false);
    dispatch("LESSON_REQUESTED");
    try {
      const lesson = await lessonService.getLesson({
        topic: trimmed,
        age: profile.age,
        style: suggestedStyle ?? pickStyle(profile),
        level: levelFor(profile.mastery[trimmed] ?? 0),
      });
      await beginLesson(lesson);
    } catch {
      setStage("error");
      dispatch("CHILD_NEEDS_HELP");
    } finally {
      requestLock.current = false;
    }
  }

  async function beginLesson(lesson: Lesson, existingCourseId?: string) {
    let courseId = existingCourseId;
    owner.current = profile;
    if (!courseId) {
      try {
        courseId = await saveCourse(
          profile,
          lesson,
          learners.isCloud(profile.id),
        );
      } catch {
        learners.setAccountMessage(
          "La clase está lista. No pudimos guardarla en tu cuenta.",
        );
      }
    }
    const next: Journey = {
      stage: "lesson",
      lesson,
      step: 0,
      choice: null,
      submitted: false,
      correct: 0,
      help: 0,
      feedback: "",
      learnerId: profile.id,
      courseId,
      replays: 0,
      confused: 0,
      hintsUsed: 0,
      answerMs: [],
    };
    setJourney(next);
    setResume(null);
    setStage("lesson");
    setCoursesOpen(false);
    setAdultOpen(false);
    setAlbumOpen(false);
    readCounts.current.clear();
    answerLock.current = false;
    rewarded.current = false;
    dispatch("LESSON_CARD_SHOWN");
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

  // The tab bar switches between home and the three panels; only one is open at a time.
  function openTab(next: Tab) {
    setCoursesOpen(next === "courses");
    setAlbumOpen(next === "album");
    setAdultOpen(next === "family");
    if (next === "home" && stage === "done") pause();
  }

  function resumeJourney() {
    if (!resume) return;
    if (resume.learnerId && resume.learnerId !== profile.id) return;
    if (!resume.learnerId && profile.id !== "demo-sofia") return;
    owner.current = profile;
    stopSpeaking();
    setJourney(resume);
    setStage(resume.stage);
    answerLock.current = resume.submitted;
    rewarded.current = false;
    questionStartedAt.current = Date.now();
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
    questionStartedAt.current = Date.now();
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
    const elapsed = questionStartedAt.current
      ? Math.max(0, Date.now() - questionStartedAt.current)
      : 0;
    let feedback = `La respuesta es ${question.options[question.answerIndex]}. ${question.hint}`;
    if (!correct) {
      dispatch("CHILD_NEEDS_HELP");
      try {
        feedback = (
          await lessonService.getReexplanation(
            journey.lesson,
            journey.step,
            journey.choice,
            (owner.current ?? profile).age,
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
      answerMs: [...(journey.answerMs ?? []), elapsed],
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
      questionStartedAt.current = Date.now();
    } else if (!rewarded.current) {
      rewarded.current = true;
      const learner = owner.current ?? profile;
      const times = journey.answerMs ?? [];
      const session: SessionLog = {
        topic: journey.lesson.topic,
        style: journey.lesson.style,
        correct: journey.correct,
        total: journey.lesson.quiz.length,
        avgAnswerMs: times.length
          ? times.reduce((sum, time) => sum + time, 0) / times.length
          : 0,
        replays: journey.replays ?? 0,
        confused: journey.confused ?? 0,
        hintsUsed: journey.hintsUsed ?? 0,
        completed: true,
        at: new Date().toISOString(),
      };
      const updated = completeProfile(
        learner,
        session,
        "/assets/lulo/lulo.webp",
      );
      learners.updateProfile(updated);
      void finalizeSession(updated, session, journey.courseId);
      clearJourney();
      setResume(null);
      setStage("done");
      dispatch("REWARD_EARNED");
    }
  }

  async function finalizeSession(
    updated: LearnerProfile,
    session: SessionLog,
    courseId?: string,
  ) {
    setNoteBusy(true);
    try {
      await finishCourse(
        courseId,
        updated,
        session,
        learners.isCloud(updated.id),
      );
    } catch {
      learners.setAccountMessage(
        "El avance sigue disponible aquí. No pudimos sincronizarlo con la cuenta.",
      );
    }
    let lastNote: string;
    try {
      lastNote = (await requestNote(updated)).note;
    } catch {
      lastNote = `[Resumen local] ${updated.name} completó ${session.topic} con ${session.correct} aciertos de ${session.total}. Pidió ${session.confused + session.hintsUsed} ayudas. Podemos repasar con otro ejemplo.`;
    }
    const latest = learners.getProfile(updated.id) ?? updated;
    if (latest.sessions.at(-1)?.at === session.at) {
      const withNote = { ...latest, lastNote };
      learners.updateProfile(withNote);
      if (learners.isCloud(withNote.id)) {
        try {
          await finishCourse(undefined, withNote, session, true);
        } catch {
          learners.setAccountMessage(
            "La nota está disponible aquí. Su sincronización quedó pendiente.",
          );
        }
      }
    }
    setNoteBusy(false);
  }

  function helpWithCard() {
    const journey = journeyRef.current;
    if (!journey) return;
    setJourney({
      ...journey,
      help: journey.help + 1,
      confused: (journey.confused ?? 0) + 1,
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
      hintsUsed: (journey.hintsUsed ?? 0) + 1,
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

  function updateSticker(imageUrl: string, topic: string, learnerId: string) {
    const learner = learners.getProfile(learnerId);
    if (
      !learner ||
      !learner.stickers.some(
        (sticker) => sticker.topic === topic && sticker.imageUrl !== imageUrl,
      )
    )
      return;
    const next = {
      ...learner,
      stickers: learner.stickers.map((sticker) =>
        sticker.topic === topic ? { ...sticker, imageUrl } : sticker,
      ),
    };
    learners.updateProfile(next);
    const last = next.sessions.at(-1);
    if (last && learners.isCloud(next.id))
      void finishCourse(undefined, next, last, true).catch(() =>
        learners.setAccountMessage(
          "El sticker se ve aquí. Su sincronización quedó pendiente.",
        ),
      );
  }

  const currentAdventure = journey
    ? findAdventure(journey.lesson.topic)
    : undefined;
  const progress = {
    stars: profile.stars,
    sessions: profile.sessions.length,
    correct: profile.sessions.reduce(
      (sum, session) => sum + session.correct,
      0,
    ),
    questions: profile.sessions.reduce(
      (sum, session) => sum + session.total,
      0,
    ),
    help: profile.sessions.reduce(
      (sum, session) => sum + session.confused + session.hintsUsed,
      0,
    ),
    stickers: profile.stickers.map(
      (sticker) =>
        findAdventure(sticker.topic)?.lesson.sticker.name ?? sticker.topic,
    ),
  };

  return (
    <main
      className="app-shell"
      data-mode={active || stage === "loading" ? "focus" : "browse"}
      data-large-text={preferences.largeText}
      data-reduce-motion={preferences.reduceMotion}
    >
      <a className="skip-link" href="#adventure">
        Saltar a la aventura
      </a>
      <header className="app-topbar">
        <button
          className="brand"
          onClick={() => (active ? pause() : openTab("home"))}
          disabled={stage === "loading" || busy}
          aria-label="Inicio de Chispa"
        >
          <span className="brand-lulo" aria-hidden="true">
            <LuloAvatar size={46} />
          </span>
          Chispa
        </button>
        <div className="topbar-actions">
          <span
            className="star-counter"
            aria-label={`${progress.stars} estrellas`}
          >
            <Icon name="star" size={19} />
            <strong>{progress.stars}</strong>
          </span>
          <label className="learner-chip">
            <span className="sr-only">Perfil de aprendizaje</span>
            <select
              value={profile.id}
              disabled={active || stage === "loading" || busy}
              onChange={(event) => {
                learners.setActiveId(event.target.value);
                setCoursesOpen(false);
              }}
            >
              {learners.profiles.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <details className="settings-menu">
            <summary className="icon-button" aria-label="Lectura y movimiento">
              <Icon name="settings" />
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
        </div>
      </header>
      {learners.accountMessage && (
        <p className="account-message" role="status">
          {learners.accountMessage}
        </p>
      )}
      {coursesOpen && (
        <CoursePanel
          key={profile.id}
          profile={profile}
          cloud={learners.isCloud(profile.id)}
          onClose={() => setCoursesOpen(false)}
          onOpen={(lesson, id) => void beginLesson(lesson, id)}
        />
      )}

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
            <div className="family-actions">
              {learners.loginAvailable && !learners.signedIn && (
                <Link href="/login" className="primary-button compact-button">
                  Entrar como familia
                </Link>
              )}
              {learners.signedIn && (
                <button
                  className="secondary-button compact-button"
                  onClick={() =>
                    void learners
                      .signOut()
                      .catch(() =>
                        learners.setAccountMessage(
                          "No pudimos cerrar la sesión. Inténtalo de nuevo.",
                        ),
                      )
                  }
                >
                  Cerrar sesión
                </button>
              )}
              <Link href="/pitch" className="text-button">
                Ver el pitch
              </Link>
            </div>
          </div>
          <ParentInsights profiles={learners.profiles} noteBusy={noteBusy} />
          {learners.signedIn && <CreateChild onCreate={learners.addChild} />}
          <p className="adult-tip">
            <strong>Una idea para acompañar:</strong> pregunta «¿qué
            descubriste?» y deja que lo explique con sus palabras, un dibujo o
            un ejemplo.
          </p>
        </section>
      )}

      <div id="adventure" className="adventure">
        {stage === "start" && tab === "home" && (
          <>
            {resume &&
              (resume.learnerId
                ? resume.learnerId === profile.id
                : profile.id === "demo-sofia") && (
                <section
                  className="resume-banner"
                  aria-label="Aventura guardada"
                >
                  <span className="resume-icon">
                    <Icon name="book" size={28} />
                  </span>
                  <div>
                    <strong>Tu aventura te está esperando</strong>
                    <p>
                      {resume.lesson.topic} ·{" "}
                      {resume.stage === "lesson"
                        ? "Descubrimiento"
                        : "Pregunta"}{" "}
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
            <section className="greeting-card" aria-labelledby="greeting-title">
              <button
                className="greeting-lulo"
                onClick={() => setGreeting(greeting + 1)}
                aria-label="Saludar a Lulo"
              >
                <LuloAvatar key={greeting} size={150} />
              </button>
              <div className="greeting-body">
                <p className="greeting-bubble" role="status">
                  {greetings[greeting % greetings.length]}
                </p>
                <h1 id="greeting-title" ref={heading} tabIndex={-1}>
                  ¡Hola, {profile.name}! ¿Qué quieres aprender hoy?
                </h1>
                <form
                  className="ask-form"
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
                      placeholder="Dinosaurios, planetas, el mar..."
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
                  <button type="submit" className="primary-button">
                    ¡Vamos!
                  </button>
                </form>
                <p
                  id="topic-message"
                  className={`small-note ${homeMessage ? "form-message" : ""}`}
                  role="status"
                >
                  {homeMessage ||
                    (listening
                      ? "Te escucho. Revisa el texto y toca ¡Vamos! cuando esté listo."
                      : isDemo
                        ? "En modo demo puedes pedir Dinosaurios, Planetas o El océano."
                        : micAvailable
                          ? "Escríbelo o díselo a Lulo con el micrófono."
                          : "Escribe lo que quieras descubrir.")}
                </p>
                <div className="quick-topics" aria-label="Ideas rápidas">
                  {adventures.map((adventure) => (
                    <button
                      key={adventure.id}
                      className="topic-chip"
                      onClick={() => startLesson(adventure.title)}
                    >
                      {adventure.title}
                    </button>
                  ))}
                  <button
                    className="topic-chip chip-surprise"
                    onClick={() =>
                      startLesson(
                        adventures[
                          Math.floor(Math.random() * adventures.length)
                        ].title,
                      )
                    }
                  >
                    <Icon name="spark" size={16} />
                    Sorpréndeme
                  </button>
                </div>
              </div>
            </section>

            <section
              className="explore-section"
              aria-labelledby="explore-title"
            >
              <div className="section-heading">
                <h2 id="explore-title">Aventuras</h2>
                <span className="catalog-note">4–5 minutos cada una</span>
              </div>
              <div className="topic-grid">
                {adventures.map((adventure) => (
                  <button
                    key={adventure.id}
                    className={`topic-tile topic-${adventure.id}`}
                    onClick={() => startLesson(adventure.title)}
                    aria-label={`Explorar ${adventure.title}`}
                  >
                    <div className="topic-picture">
                      <AdventureArt subject={adventure.id} />
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

            <PhotoTopic
              onTopic={(topic, hook) =>
                void startLesson(topic, undefined, hook)
              }
            />
            <NextTopics
              profile={profile}
              onTopic={(topic, style) => void startLesson(topic, style)}
            />
          </>
        )}

        {stage === "loading" && (
          <LoadingAdventure
            key={requestedTopic}
            topic={requestedTopic}
            hook={photoHook}
          />
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
            <div className="journey-top focus-bar">
              <button
                className="icon-button"
                onClick={pause}
                disabled={busy}
                aria-label="Pausar y guardar"
                title="Pausar y guardar"
              >
                <Icon name="close" />
              </button>
              <JourneyTrail stage={stage} />
              <span className="focus-topic">{journey.lesson.topic}</span>
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
            {stage === "lesson" && (
              <TutorChat
                key={`${journey.courseId ?? journey.lesson.topic}:${profile.id}`}
                lesson={journey.lesson}
                profile={profile}
                onSpeak={read}
                onAction={(action) => {
                  if (action.type === "start_lesson")
                    void startLesson(action.topic);
                  else if (action.type === "start_quiz") startQuiz();
                }}
              />
            )}
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
                    onClick={() => openTab("album")}
                  >
                    <Icon name="star" />
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
                  <LessonImage
                    key={journey.lesson.sticker.query}
                    request={{
                      kind: "illustration",
                      query: journey.lesson.sticker.query,
                    }}
                    alt={journey.lesson.sticker.name}
                    onResolved={(image) =>
                      updateSticker(
                        image.url,
                        journey.lesson.topic,
                        journey.learnerId ?? profile.id,
                      )
                    }
                  />
                  <strong>{journey.lesson.sticker.name}</strong>
                  <span>¡Un nuevo logro en tu álbum!</span>
                </div>
              </div>
            </section>
            <NextTopics
              profile={profile}
              onTopic={(topic, style) => void startLesson(topic, style)}
            />
          </>
        )}
      </div>

      {!active && stage !== "loading" && (
        <nav className="app-tabbar" aria-label="Secciones">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              ref={
                entry.id === "album"
                  ? albumToggle
                  : entry.id === "family"
                    ? adultToggle
                    : undefined
              }
              className="tab-button"
              aria-current={tab === entry.id ? "page" : undefined}
              onClick={() => openTab(entry.id)}
            >
              <Icon name={entry.icon} size={24} />
              <span>{entry.label}</span>
            </button>
          ))}
        </nav>
      )}
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
