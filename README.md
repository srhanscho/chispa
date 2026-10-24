# Lulo — an AI tutor that learns how each kid learns

Lulo is an AI tutor for kids aged 6–12. A child says what they want to learn ("¡dinosaurios!"), and Lulo, a curious young iguana from Barranquilla, builds a short lesson with pictures, reads it aloud, and ends with a quiz. An adaptive engine learns **how each child learns** and changes the teaching style of the next lesson.

Built for Hacktoberfest Barranquilla 2026. The backend supports **Gemma 4** through the Gemini API. The frontend uses the server routes by default, with bundled lesson fallbacks and an explicit demo mode that needs no API keys.

## Frontend de Lulo

La imagen oficial del ZIP está en `public/assets/lulo/`. La rama `front2` incorpora tres aventuras completas: Dinosaurios, Planetas y El océano. Cada una tiene 4–5 descubrimientos, tres preguntas, lectura opcional, ayudas, estrellas y álbum visual. Las respuestas se seleccionan y se confirman con Comprobar; los temas desconocidos muestran una explicación sin abrir otro contenido.

La investigación y las decisiones de diseño están en [UX/UI de front2](docs/UX_UI_FRONT2.md), con fuentes de NN/g, W3C y CAST, nuevas ideas priorizadas y una propuesta de validación con usuarios. Incluye controles de texto grande y movimiento, saludo interactivo de Lulo y una misión opcional fuera de pantalla al terminar.

La actualización de [tareas de experiencia](docs/FRONT_TASKS.md) añade perfiles adaptativos, comparación Sofía/Mateo, cursos, chat con Lulo, sugerencias, foto y pitch. El servicio usa `/api/*` por defecto; `NEXT_PUBLIC_LESSON_SOURCE=demo` selecciona clases locales. El panel muestra estilos, dominio y nota de sesión; si la API de notas falla, identifica el resumen como local. El login de papás es opcional y aparece solo cuando está configurado.

Los JSON originales se guardan en `docs/lulo/especificaciones/`. `lib/lulo.ts` usa su mapa de eventos para cambiar entre inicio, carga, clase, trivia, apoyo y premio. `LuloAvatar` muestra el PNG original con movimientos CSS suaves y respeta `prefers-reduced-motion`. La voz actualiza un indicador al empezar, terminar, fallar o cancelarse. No hay sincronización labial, seis poses nuevas ni un archivo `.riv`: esas piezas siguen pendientes del diseño y rig de Rive.

Los invitados guardan perfiles, cursos completos, stickers y racha en `localStorage`; cada aventura pausada comprueba el perfil dueño. Con cuenta se usan los niños y cursos del servidor mediante `accountFetch`. La foto es opcional: se reduce a 1024 px, muestra vista previa y se envía solo al confirmar. El dictado depende del navegador; escribir siempre está disponible.

Para probar: `npm ci`, `npm run dev`, `npm run lint`, `npm test`, `npm run build`. La demo no requiere claves. Las fuentes Baloo 2 y Nunito necesitan conexión durante la compilación inicial. Las fotos muestran crédito y tienen respaldo local. `/pitch` incluye cinco diapositivas, guion y presentación descargable.

Si el equipo corporativo bloquea terminales, usa un entorno autorizado o importa el repositorio desde la interfaz web de Vercel, seleccionando Next.js y sus valores predeterminados. La demo no requiere variables de entorno. Primero hay que subir a GitHub los cambios locales para que Vercel los reciba.

## How it works

| Piece                                                             | Technology                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Lessons, quiz, re-explanations, photo-to-topic, notes for parents | Gemma 4 (`gemma-4-26b-a4b-it`) via `@google/genai`                                               |
| Real photos                                                       | Wikimedia Commons API (free, openly licensed, credited)                                          |
| Illustrations                                                     | OpenAI Images API, cached so each image is paid once                                             |
| Voice                                                             | Web Speech API (speech synthesis and recognition)                                                |
| Adaptive engine                                                   | `lib/engine.ts`: per-style scores with epsilon-greedy selection, per-topic mastery               |
| Tutor agent                                                       | `/api/tutor` (chat with Lulo, returns actions) and `/api/suggest` (next topics)                  |
| Accounts                                                          | Optional Supabase login for parents, saved courses and synced profiles; `localStorage` otherwise |

The engine tracks five teaching styles (story, visual, analogy, step by step, game). After each lesson it scores the session from quiz accuracy, "No entendí" taps and abandonment, moves the used style's score toward that outcome, and picks the best style 80% of the time while exploring another 20% of the time.

## Getting started

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY and OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000. Lessons use the API by default and bundled lessons when unavailable. Set `NEXT_PUBLIC_LESSON_SOURCE=demo` for local practice. Real tutor, photo and note generation require server credentials.

```bash
npm test        # unit tests for the engine, JSON parsing and Wikimedia parsing
npm run build
```

See [docs/API.md](docs/API.md) for every route and the suggested UI flow.

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

Guest profiles stay in the browser. Optional parent accounts sync profiles and courses to the configured server. AI requests send the current learner summary and lesson to the server; photos are sent only after confirmation. Deployment and provider choices determine where data is processed.

## License

[MIT](LICENSE)
