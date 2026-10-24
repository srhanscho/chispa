# Chispa — learn with Lulo

Chispa is an AI tutor for kids aged 6–10. A child says what they want to learn ("¡dinosaurios!"), and Lulo, a curious young iguana from Barranquilla, builds a short lesson with pictures, reads it aloud, and ends with a quiz. An adaptive engine learns **how each child learns** and changes the teaching style of the next lesson.

Built for Hacktoberfest Barranquilla 2026. The backend supports **Gemma 4** through the Gemini API. The current frontend opens a local demo by default, without provider calls or API keys.

## Frontend de Lulo

La imagen oficial del ZIP está en `public/assets/lulo/`. La rama `front2` incorpora tres aventuras completas: Dinosaurios, Planetas y El océano. Cada una tiene 4–5 descubrimientos, tres preguntas, lectura opcional, ayudas, estrellas y álbum visual. Las respuestas se seleccionan y se confirman con Comprobar; los temas desconocidos muestran una explicación sin abrir otro contenido.

La investigación y las decisiones de diseño están en [UX/UI de front2](docs/UX_UI_FRONT2.md), con fuentes de NN/g, W3C y CAST, nuevas ideas priorizadas y una propuesta de validación con usuarios. Incluye controles de texto grande y movimiento, saludo interactivo de Lulo y una misión opcional fuera de pantalla al terminar.

`lib/lesson-service.ts` separa el mock del adaptador HTTP. Para utilizar las rutas existentes, establece `NEXT_PUBLIC_LESSON_SOURCE=http` antes de compilar y configura las variables privadas de `.env.example`. El modo demo no activa el motor adaptativo; el panel adulto muestra únicamente contadores, sin diagnósticos. Los cambios recientes de configuración y rendimiento de Gemma se conservan.

Los JSON originales se guardan en `docs/lulo/especificaciones/`. `lib/lulo.ts` usa su mapa de eventos para cambiar entre inicio, carga, clase, trivia, apoyo y premio. `LuloAvatar` muestra el PNG original con movimientos CSS suaves y respeta `prefers-reduced-motion`. La voz actualiza un indicador al empezar, terminar, fallar o cancelarse. No hay sincronización labial, seis poses nuevas ni un archivo `.riv`: esas piezas siguen pendientes del diseño y rig de Rive.

Se guardan contadores y stickers (`chispa:lulo-progress:v1`), preferencias (`chispa:preferences:v1`) y la aventura pausada (`chispa:journey:v1`) en `localStorage`. Pausar y guardar permite continuar incluso después de recargar, conservando las respuestas ya evaluadas. Los datos se validan al recuperarlos. Si el navegador bloquea el almacenamiento, la sesión funciona en memoria. No se solicitan nombres ni fotos. El dictado opcional depende del servicio del navegador; escribir siempre está disponible.

Para probar: `npm ci`, `npm run dev`, `npm run lint`, `npm test`, `npm run build`. No hacen falta claves para la demo. Las fuentes Baloo 2 y Nunito necesitan conexión durante la compilación inicial. Los visuales educativos son SVG locales y decorativos, sin descargas de imágenes ni dependencia de proveedores. Lulo conserva su imagen oficial.

Si el equipo corporativo bloquea terminales, usa un entorno autorizado o importa el repositorio desde la interfaz web de Vercel, seleccionando Next.js y sus valores predeterminados. La demo no requiere variables de entorno. Primero hay que subir a GitHub los cambios locales para que Vercel los reciba.

## How it works

| Piece | Technology |
| --- | --- |
| Lessons, quiz, re-explanations, photo-to-topic, notes for parents | Gemma 4 (`gemma-4-26b-a4b-it`) via `@google/genai` |
| Real photos | Wikimedia Commons API (free, openly licensed, credited) |
| Illustrations | OpenAI Images API, cached so each image is paid once |
| Voice | Web Speech API (speech synthesis and recognition) |
| Adaptive engine | `lib/engine.ts`: per-style scores with epsilon-greedy selection, per-topic mastery |
| Storage | `localStorage` in the browser; no accounts, no database |

The engine tracks five teaching styles (story, visual, analogy, step by step, game). After each lesson it scores the session from quiz accuracy, "No entendí" taps and abandonment, moves the used style's score toward that outcome, and picks the best style 80% of the time while exploring another 20% of the time.

## Getting started

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY and OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000. The frontend demo uses the supplied fixture in `docs/lulo/demo/lesson_dinosaurios.json`. In HTTP mode, the existing backend falls back to `public/demo/dinosaurios.json` when no `GEMINI_API_KEY` is configured.

```bash
npm test        # unit tests for the engine, JSON parsing and Wikimedia parsing
npm run build
```

## Project structure

```
app/                 pages and API routes (lesson, image, reexplain, note, topic-from-photo)
components/          ChispaApp (main flow) and shared UI
lib/schema.ts        Zod contract shared by UI and AI layers
lib/gemma.ts         Gemma client and prompts
lib/engine.ts        adaptive engine
lib/images.ts        Wikimedia → OpenAI → fallback, with caching
lib/speech.ts        text-to-speech and speech recognition
lib/profile.ts       learner profiles in localStorage
public/demo/         cached demo lesson
```

## Privacy

Learner profiles stay in the browser. Gemma is an open model, so a school can run it on its own server and keep children's data local.

## License

[MIT](LICENSE)
