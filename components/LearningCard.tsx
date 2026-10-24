"use client";

import { useEffect, useRef, type RefObject } from "react";
import { findAdventure } from "@/lib/adventures";
import type { Journey } from "@/lib/journey";
import { AdventureArt, Icon } from "./AdventureArt";

interface Props {
  journey: Journey;
  busy: boolean;
  speaking: boolean;
  voiceAvailable: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  onRead: (text: string) => void;
  onStop: () => void;
  onCard: (index: number) => void;
  onQuiz: () => void;
  onChoose: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onHelp: () => void;
  onHint: () => void;
}

export function LearningCard({
  journey,
  busy,
  speaking,
  voiceAvailable,
  heading,
  onRead,
  onStop,
  onCard,
  onQuiz,
  onChoose,
  onSubmit,
  onNext,
  onHelp,
  onHint,
}: Props) {
  const { lesson, stage, step, choice, submitted, feedback } = journey;
  const card = lesson.cards[step];
  const question = lesson.quiz[step];
  const isLesson = stage === "lesson";
  const count = isLesson ? lesson.cards.length : lesson.quiz.length;
  const subject = findAdventure(lesson.topic)?.id;
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) feedbackRef.current?.focus();
  }, [submitted]);

  function audioButton(text: string, label: string) {
    return (
      <button
        className="soft-button"
        onClick={() => (speaking ? onStop() : onRead(text))}
        disabled={!voiceAvailable}
        aria-label={speaking ? "Detener lectura" : label}
      >
        <Icon name={speaking ? "stop" : "sound"} />
        {speaking ? "Detener" : "Escuchar"}
      </button>
    );
  }

  return (
    <article className="learning-card" aria-busy={busy}>
      <div className="card-progress-label">
        <span>
          {isLesson ? "Descubrimiento" : "Pregunta"} {step + 1} de {count}
        </span>
        <span>{lesson.topic}</span>
      </div>
      <progress
        aria-label={
          isLesson ? "Progreso de descubrimientos" : "Progreso de preguntas"
        }
        value={step + 1}
        max={count}
      />

      {isLesson ? (
        <div key={`card-${step}`} className="content-enter">
          <h1 ref={heading} tabIndex={-1}>
            {card.title}
          </h1>
          <figure className={`lesson-art art-${subject ?? "book"}`}>
            <AdventureArt subject={subject} detail={step} />
            <figcaption>
              Una ilustración para imaginar el descubrimiento
            </figcaption>
          </figure>
          <p className="reading-text">{card.text}</p>
          <div className="learning-tools">
            {audioButton(card.speech, "Escuchar este descubrimiento")}
            <button className="soft-button" onClick={onHelp}>
              <Icon name="help" />
              No entendí
            </button>
          </div>
          {!voiceAvailable && (
            <p className="small-note">
              La voz no está disponible aquí. Puedes leer todo en pantalla.
            </p>
          )}
          {feedback && (
            <div className="support-note" role="status">
              <span className="support-symbol">
                <Icon name="spark" />
              </span>
              <div>
                <strong>Probemos de otra forma</strong>
                <p>{feedback}</p>
                {voiceAvailable && (
                  <button
                    className="text-button"
                    onClick={() => onRead(feedback)}
                  >
                    Escuchar la ayuda
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="card-navigation">
            <button
              className="secondary-button"
              disabled={step === 0}
              onClick={() => onCard(step - 1)}
            >
              <Icon name="back" />
              Anterior
            </button>
            <button
              className="primary-button"
              onClick={() => (step + 1 < count ? onCard(step + 1) : onQuiz())}
            >
              {step + 1 < count ? "Siguiente" : "Ir a las preguntas"}
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      ) : (
        <div key={`question-${step}`} className="content-enter">
          <p className="eyebrow">¡AHORA TE TOCA A TI!</p>
          <h1 ref={heading} tabIndex={-1}>
            {question.question}
          </h1>
          <p className="question-guide">
            Elige una opción y después toca «Comprobar».
          </p>
          <fieldset className="answer-list" disabled={submitted || busy}>
            <legend className="sr-only">
              Opciones para {question.question}
            </legend>
            {question.options.map((option, index) => {
              const right = submitted && index === question.answerIndex;
              const picked = choice === index;
              return (
                <label
                  key={option}
                  className={`answer-choice ${picked ? "choice-picked" : ""} ${right ? "choice-right" : ""}`}
                >
                  <input
                    type="radio"
                    name={`question-${step}`}
                    checked={picked}
                    value={index}
                    onChange={() => onChoose(index)}
                  />
                  <span className="choice-letter" aria-hidden="true">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="choice-copy">
                    {option}
                    {submitted && picked && !right && (
                      <small>Tu elección</small>
                    )}
                    {right && (
                      <small>
                        <Icon name="check" size={14} />
                        Respuesta correcta
                      </small>
                    )}
                  </span>
                  <span className="choice-marker" aria-hidden="true">
                    {right || picked ? <Icon name="check" size={18} /> : null}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div className="learning-tools">
            {audioButton(question.question, "Escuchar la pregunta")}
            {!submitted && (
              <button className="soft-button" disabled={busy} onClick={onHint}>
                <Icon name="help" />
                Una pista
              </button>
            )}
          </div>
          {feedback && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              className={`answer-feedback ${submitted && choice === question.answerIndex ? "feedback-success" : ""}`}
              role="status"
              aria-live="polite"
            >
              <strong>
                {submitted
                  ? choice === question.answerIndex
                    ? "¡Lo descubriste!"
                    : "¡Gracias por intentarlo!"
                  : "Una pequeña pista"}
              </strong>
              <p>{feedback}</p>
              {submitted && voiceAvailable && (
                <button
                  className="text-button"
                  onClick={() => onRead(feedback)}
                >
                  Escuchar la explicación
                </button>
              )}
            </div>
          )}
          {busy && (
            <p className="small-note" role="status">
              Lulo está preparando una explicación…
            </p>
          )}
          <div className="question-action">
            {submitted ? (
              <button className="primary-button" onClick={onNext}>
                {step + 1 < count ? "Siguiente pregunta" : "Ver mi logro"}
                <Icon name="arrow" />
              </button>
            ) : (
              <>
                <button
                  className="primary-button"
                  disabled={choice === null || busy}
                  onClick={onSubmit}
                >
                  {busy ? "Un momento…" : "Comprobar"}
                  <Icon name="check" />
                </button>
                <p className="small-note">
                  {choice === null
                    ? "Puedes pedir una pista si la necesitas."
                    : "Puedes cambiar tu elección antes de comprobar."}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
