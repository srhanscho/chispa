"use client";

import { useState } from "react";
import Link from "next/link";
import { LuloAvatar } from "@/components/LuloAvatar";

const slides = [
  {
    title: "Lulo",
    subtitle: "Aprender empieza con una pregunta",
    body: "Lulo acompaña a niñas y niños con clases cortas, voz y preguntas.",
    note: "0:00–0:25. Presenta a Lulo y el problema: una explicación puede no conectar. Queremos que la siguiente explicación use las señales del recorrido anterior.",
  },
  {
    title: "Un mismo tema, dos explicaciones",
    subtitle: "Sofía y Mateo exploran dinosaurios",
    body: "La demo compara historias y explicaciones visuales. El perfil registra señales, sin diagnosticar a nadie.",
    note: "0:25–0:55. Abre el panel Para quienes acompañan y la comparación. Muestra que las dos clases están precargadas para una demostración estable.",
  },
  {
    title: "Una conversación con Lulo",
    subtitle: "Leer, escuchar y preguntar",
    body: "Elige un tema, abre una tarjeta y pregunta en el chat. Lulo puede proponer otro tema o comenzar las preguntas.",
    note: "0:55–1:40. Haz la demo real: una tarjeta, una pregunta al tutor y una respuesta de trivia. Si no hay conexión, muestra la clase guardada y explica qué partes requieren IA.",
  },
  {
    title: "Las señales guían la próxima clase",
    subtitle: "Motor adaptativo y nota para acompañantes",
    body: "Aciertos, ayudas y tiempos actualizan el perfil. Gemma prepara una nota. Los cursos permiten volver a una clase sin regenerarla.",
    note: "1:40–2:25. Muestra las barras y el dominio por tema. El motor calcula las señales; Gemma genera explicaciones y notas. Si la nota es local, su etiqueta lo indica.",
  },
  {
    title: "Gemma y una experiencia que acompaña",
    subtitle: "Un prototipo con identidad del Caribe",
    body: "Gemma explica y conversa. Lulo evalúa el recorrido y conserva el progreso. Un despliegue propio requiere verificar el modelo, la licencia y el hardware.",
    note: "2:25–3:00. Cierra con la visión: Gemma enseña, evalúa y aprende de cada niño. Explica que la adaptación actual combina el motor del proyecto con el modelo. Invita a probar la demo.",
  },
];

export default function PitchPage() {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);
  const slide = slides[index];
  return (
    <main
      className="pitch-shell"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setIndex(Math.min(4, index + 1));
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setIndex(Math.max(0, index - 1));
        }
      }}
    >
      <header>
        <Link href="/" className="brand">
          lulo.
        </Link>
        <Link href="/" className="text-button">
          Abrir demo
        </Link>
        <a href="/pitch/Chispa-pitch.pptx" className="text-button" download>
          Descargar presentación
        </a>
      </header>
      <section
        className="pitch-slide"
        aria-roledescription="diapositiva"
        aria-label={`${index + 1} de 5`}
      >
        <div>
          <p className="eyebrow">LULO · PRESENTACIÓN DE 3 MINUTOS</p>
          <h1>{slide.title}</h1>
          <h2>{slide.subtitle}</h2>
          <p>{slide.body}</p>
        </div>
        <LuloAvatar size={300} />
      </section>
      <nav aria-label="Diapositivas">
        <button
          className="secondary-button"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Anterior
        </button>
        <span aria-live="polite">{index + 1} / 5</span>
        <button
          className="primary-button"
          disabled={index === 4}
          onClick={() => setIndex(index + 1)}
        >
          Siguiente
        </button>
        <button
          className="text-button"
          aria-expanded={notes}
          onClick={() => setNotes(!notes)}
        >
          Guion del presentador
        </button>
      </nav>
      {notes && (
        <aside className="pitch-notes">
          <p>{slide.note}</p>
          <p>
            Ensayo pendiente: realizar dos pasadas con el compañero y
            cronometrar la demo real.
          </p>
        </aside>
      )}
    </main>
  );
}
