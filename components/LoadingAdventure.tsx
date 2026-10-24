"use client";
import { useEffect, useRef, useState } from "react";
import { LuloAvatar } from "./LuloAvatar";

export function LoadingAdventure({
  topic,
  hook,
}: {
  topic: string;
  hook?: string;
}) {
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setStep((value) => value + 1), 4000);
    return () => clearInterval(timer);
  }, []);
  const messages = [
    `Buscando pistas sobre ${topic}…`,
    "Preparando una explicación para ti…",
    "Ordenando nuestros descubrimientos…",
    "Sigo preparando tu aventura. Gracias por esperar.",
  ];
  return (
    <section className="center-stage loading-stage" aria-busy="true">
      <LuloAvatar scene="loading" size={210} />
      <p className="eyebrow">UNA AVENTURA EN CAMINO</p>
      <h1 ref={heading} tabIndex={-1}>
        Lulo está preparando tu clase.
      </h1>
      {hook && <p>{hook}</p>}
      <p role="status" aria-live="polite">
        {messages[Math.min(step, messages.length - 1)]}
      </p>
      <p className="small-note">Una clase nueva puede tardar unos segundos.</p>
      <div className="loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}
