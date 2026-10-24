"use client";

import { useEffect, useState } from "react";
import { levelFor, type LearnerProfile } from "@/lib/engine";
import { LEVEL_NAMES, STYLE_NAMES } from "@/lib/learner-ui";
import { comparisonLessons } from "@/lib/lesson-service";
import { loadCourses, type Course } from "@/lib/course-ui";
import { requestSuggestions } from "@/lib/experience-api";
import type { Lesson } from "@/lib/schema";
import type { SuggestReply } from "@/lib/tutor-schema";
import { LessonImage } from "./ui";

export function ParentInsights({
  profiles,
  noteBusy,
}: {
  profiles: LearnerProfile[];
  noteBusy: boolean;
}) {
  const [compare, setCompare] = useState(false);
  const lessons = comparisonLessons();
  return (
    <div className="parent-insights">
      <p className="small-note">
        Señales para acompañar el aprendizaje. Los perfiles demo son ficticios;
        estas barras no son diagnósticos.
      </p>
      <div className="insight-grid">
        {profiles.map((profile) => (
          <article className="profile-insight" key={profile.id}>
            <h3>
              {profile.name} <small>{profile.age} años</small>
            </h3>
            <p className="profile-stars">
              {profile.stars} estrellas · {profile.streak.days} días de
              actividad
            </p>
            <h4>Formas de explicar</h4>
            {Object.entries(profile.styleScores).map(([style, score]) => (
              <div className="style-row" key={style}>
                <span>{STYLE_NAMES[style as keyof typeof STYLE_NAMES]}</span>
                <progress
                  aria-label={`${profile.name}: ${STYLE_NAMES[style as keyof typeof STYLE_NAMES]}`}
                  value={score}
                  max={1}
                />
                <span>{Math.round(score * 100)}%</span>
              </div>
            ))}
            <h4>Descubrimientos por tema</h4>
            {Object.entries(profile.mastery).length ? (
              Object.entries(profile.mastery).map(([topic, score]) => (
                <div className="mastery-row" key={topic}>
                  <span>{topic}</span>
                  <strong>
                    {Math.round(score)}% · {LEVEL_NAMES[levelFor(score)]}
                  </strong>
                </div>
              ))
            ) : (
              <p className="small-note">
                El primer recorrido aparecerá aquí al terminar.
              </p>
            )}
            <div className="parent-note">
              <strong>
                {profile.lastNote?.startsWith("[Resumen local]")
                  ? "Resumen local"
                  : "Nota de acompañamiento"}
              </strong>
              <p>
                {profile.lastNote?.replace("[Resumen local] ", "") ||
                  "Completa una aventura para preparar una nota."}
              </p>
            </div>
          </article>
        ))}
      </div>
      {noteBusy && (
        <p role="status" className="small-note">
          Preparando la nota de la sesión…
        </p>
      )}
      <button
        className="secondary-button"
        aria-expanded={compare}
        onClick={() => setCompare(!compare)}
      >
        Comparar Sofía y Mateo · demo
      </button>
      {compare && (
        <section className="comparison-view">
          <h3>Un mismo tema, dos formas de contarlo</h3>
          <p className="small-note">
            Clases precargadas. Sofía: historias. Mateo: visual. No se generan
            datos nuevos aquí.
          </p>
          <div className="insight-grid">
            {lessons.map((lesson, index) => (
              <article className="comparison-card" key={lesson.style}>
                <h4>{index ? "Mateo · Visual" : "Sofía · Historias"}</h4>
                <strong>{lesson.cards[0].title}</strong>
                <p>{lesson.cards[0].text}</p>
                <LessonImage
                  request={lesson.cards[0].image}
                  alt={lesson.cards[0].title}
                />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function CoursePanel({
  profile,
  cloud,
  onOpen,
  onClose,
}: {
  profile: LearnerProfile;
  cloud: boolean;
  onOpen: (lesson: Lesson, id: string) => void;
  onClose: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let live = true;
    loadCourses(profile.id, cloud)
      .then((data) => {
        if (live) {
          setCourses(data);
          setState("ready");
        }
      })
      .catch(() => {
        if (live) setState("error");
      });
    return () => {
      live = false;
    };
  }, [profile.id, cloud]);
  return (
    <section className="drawer courses-panel" aria-label="Mis cursos">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            EL CUADERNO DE {profile.name.toLocaleUpperCase("es")}
          </p>
          <h2>Mis cursos</h2>
        </div>
        <button className="text-button" onClick={onClose}>
          Cerrar cursos
        </button>
      </div>
      <p className="small-note">
        {cloud
          ? "Guardados en tu cuenta familiar."
          : "Guardados solo en este navegador."}{" "}
        Repite una clase sin esperar a Gemma.
      </p>
      {state === "loading" && <p role="status">Buscando tus cursos…</p>}
      {state === "error" && (
        <p role="alert">
          No pudimos recuperar los cursos. Cierra y vuelve a intentar.
        </p>
      )}
      {state === "ready" && !courses.length && (
        <p className="empty-courses">
          Tu próximo descubrimiento aparecerá aquí.
        </p>
      )}
      <div className="course-list">
        {courses.map((course) => (
          <article key={course.id}>
            <div>
              <h3>{course.topic}</h3>
              <p>
                {STYLE_NAMES[course.style]} · {LEVEL_NAMES[course.level]}
              </p>
              <small>
                {course.result?.completed
                  ? `${course.result.correct} de ${course.result.total} respuestas acertadas`
                  : "Aventura lista para explorar"}
              </small>
            </div>
            <button
              className="secondary-button"
              onClick={() => onOpen(course.lesson, course.id)}
            >
              Repetir {course.topic}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CreateChild({
  onCreate,
}: {
  onCreate: (name: string, age: number) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(7);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="child-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setMessage("");
        try {
          await onCreate(name.trim(), age);
          setName("");
          setMessage("Perfil creado. Ya puedes elegir una aventura.");
        } catch {
          setMessage("No pudimos guardar el perfil. Inténtalo de nuevo.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3>Crear perfil de aprendizaje</h3>
      <label>
        Nombre o apodo
        <input
          value={name}
          required
          maxLength={40}
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Edad
        <input
          type="number"
          min={4}
          max={12}
          step={1}
          required
          value={age}
          onChange={(event) => setAge(Number(event.target.value))}
        />
      </label>
      <button className="primary-button" disabled={busy || !name.trim()}>
        {busy ? "Guardando…" : "Crear perfil"}
      </button>
      <p role="status" className="small-note">
        {message}
      </p>
    </form>
  );
}

export function NextTopics({
  profile,
  onTopic,
}: {
  profile: LearnerProfile;
  onTopic: (topic: string, style?: keyof typeof STYLE_NAMES) => void;
}) {
  const [topics, setTopics] = useState<SuggestReply["topics"]>([]);
  useEffect(() => {
    let live = true;
    requestSuggestions(profile)
      .then((reply) => {
        if (live) setTopics(reply.topics.slice(0, 3));
      })
      .catch(() => {
        if (live)
          setTopics([
            {
              topic: "dinosaurios",
              why: "Sigue las pistas del pasado.",
              style: "story",
            },
            {
              topic: "volcanes",
              why: "Descubre cómo cambia la Tierra.",
              style: "game",
            },
            {
              topic: "frutas tropicales",
              why: "Explora sabores de nuestro Caribe.",
              style: "visual",
            },
          ]);
      });
    return () => {
      live = false;
    };
  }, [profile]);
  return (
    <section className="suggestion-section" aria-label="Qué aprendemos ahora">
      <div className="section-heading">
        <div>
          <p className="eyebrow">UNA PREGUNTA NOS LLEVA A OTRA</p>
          <h2>¿Qué aprendemos ahora?</h2>
        </div>
      </div>
      {topics.length ? (
        <div className="suggestion-grid">
          {topics.map((item) => (
            <button
              key={item.topic}
              className="suggestion-card"
              onClick={() => onTopic(item.topic, item.style)}
            >
              <strong>{item.topic}</strong>
              <span>{item.why}</span>
              <small>Explorar →</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="small-note" role="status">
          Buscando ideas para ti…
        </p>
      )}
    </section>
  );
}
