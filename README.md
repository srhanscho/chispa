# Chispa — learn with Lula

Chispa is an AI tutor for kids aged 6–10. A child says what they want to learn ("¡dinosaurios!"), and Lula, a curious iguana from Barranquilla, builds a short lesson with pictures, reads it aloud, and ends with a quiz. An adaptive engine learns **how each child learns** and changes the teaching style of the next lesson.

Built for Hacktoberfest Barranquilla 2026. All text and reasoning run on **Gemma 4** through the Gemini API.

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

Open http://localhost:3000. Without a `GEMINI_API_KEY` the app serves the cached demo lesson in `public/demo/dinosaurios.json`, so the UI works from the first minute.

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
