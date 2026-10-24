"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { requestPhoto } from "@/lib/experience-api";

export async function resizePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024)
    throw new Error("Elige una imagen de hasta 12 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No pudimos preparar la foto.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PhotoTopic({
  onTopic,
}: {
  onTopic: (topic: string, hook: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="photo-topic" aria-label="Aprender con una foto">
      <div>
        <h3>¿Qué tienes cerca?</h3>
        <p>Tómale foto a algo y busquemos una aventura.</p>
      </div>
      <input
        ref={input}
        className="sr-only"
        type="file"
        tabIndex={-1}
        accept="image/*"
        capture="environment"
        aria-label="Seleccionar foto para aprender"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setError("");
          setBusy(true);
          try {
            const resized = await resizePhoto(file);
            if (live.current) setPreview(resized);
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "No pudimos abrir esa foto.",
            );
          } finally {
            setBusy(false);
            event.target.value = "";
          }
        }}
      />
      <button
        className="secondary-button"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        Tómale foto a algo
      </button>
      {preview && (
        <div className="photo-preview">
          <NextImage
            src={preview}
            alt="Foto que elegiste para sugerir un tema"
            width={1024}
            height={1024}
            unoptimized
          />
          <p className="small-note">
            Al continuar, enviamos esta foto para buscar un tema. No se añade al
            álbum.
          </p>
          <button
            className="primary-button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const reply = await requestPhoto(preview.split(",")[1]);
                if (live.current) onTopic(reply.topic, reply.hook);
              } catch {
                setError(
                  "No pudimos reconocer el tema. Puedes escribirlo y seguir aprendiendo.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Buscando una pista…" : "Descubrir con esta foto"}
          </button>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setPreview("")}
          >
            Quitar foto
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
