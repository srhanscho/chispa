# Chispa API

All routes take and return JSON. AI routes are public; account routes need a signed-in parent.

## AI routes (Gemma 4)

| Route | Body | Returns | Notes |
| --- | --- | --- | --- |
| `POST /api/lesson` | `{ topic, age, style, level }` | `Lesson` (`lib/schema.ts`) | Cached: bundled demo → memory → Supabase → Gemma. ~16 s when generated, instant when cached. |
| `POST /api/image` | `{ kind: "photo" \| "illustration", query }` | `{ url, source, credit?, pageUrl? }` | Never fails: falls back to `/lulo.svg` with `source: "fallback"`. Show `credit` under Wikimedia photos. |
| `POST /api/reexplain` | `{ question, chosen, correct, style, age }` | `{ text, speech }` | Call when the child picks a wrong answer. |
| `POST /api/note` | `{ name, styleScores, mastery, recentSessions }` | `{ note, nextStyle }` | Note for the parent after a lesson. Store it in `profile.lastNote`. |
| `POST /api/topic-from-photo` | `{ imageBase64, mimeType }` | `{ topic, hook }` | Resize the photo to ~1024 px before sending. |
| `POST /api/tutor` | `TutorRequest` (`lib/tutor-schema.ts`) | `{ text, speech, action }` | Chat with Lulo. See below. |
| `POST /api/suggest` | `{ learner }` | `{ topics: [{ topic, why, style }] }` | "¿Qué aprendemos ahora?" ideas. |

### Tutor agent (`/api/tutor`)

```json
{
  "message": "¿por qué el T-Rex tenía bracitos?",
  "learner": { "name": "Sofía", "age": 7, "styleScores": { "story": 0.8 }, "mastery": { "dinosaurios": 60 }, "recentTopics": ["dinosaurios"] },
  "lesson": { "topic": "Dinosaurios", "cards": [{ "title": "Sus bracitos", "text": "..." }] },
  "history": [{ "role": "lulo", "text": "¡Hola Sofía!" }, { "role": "child", "text": "hola" }]
}
```

`action` tells the UI what to do next:

- `{ "type": "none" }`: just show and speak the reply.
- `{ "type": "start_lesson", "topic": "volcanes" }`: start a lesson on that topic.
- `{ "type": "start_quiz" }`: the child says they are ready; jump to the quiz.

Send at most the last 10 turns in `history`.

## Account routes (Supabase)

Use the helpers in `lib/supabase-browser.ts`:

```ts
import { accountFetch, signIn, signUp, signOut, onSessionChange, loginEnabled } from "@/lib/supabase-browser";

await signIn(email, password);
const me = await accountFetch<{ user: { id: string; email: string }; children: Child[] }>("/api/me");
```

`accountFetch` adds `Authorization: Bearer <token>`. Every query is limited by Row Level Security to the signed-in parent's data. If Supabase is not configured, these routes answer `503` and `loginEnabled()` is `false`; keep using `localStorage` profiles in that case.

| Route | Body | Returns |
| --- | --- | --- |
| `GET /api/me` | | `{ user, children: [{ id, name, age, profile, updated_at }] }` |
| `GET /api/children` | | children list |
| `POST /api/children` | `{ name, age, profile? }` | the new child (`201`) |
| `PATCH /api/children/:id` | `{ name?, age?, profile? }` | the updated child |
| `DELETE /api/children/:id` | | `204` |
| `GET /api/children/:id/courses` | `?full=1` to include the lesson | courses, newest first (max 50) |
| `POST /api/children/:id/courses` | `{ lesson, result? }` | the saved course (`201`) |
| `PATCH /api/courses/:id` | `{ result }` | the updated course |

`profile` is the engine state from `lib/engine.ts` (`LearnerProfile` without `id`, `name`, `age`). `result` is `{ correct, total, avgAnswerMs, replays, confused, hintsUsed, completed }`.

### Suggested flow

1. On load: if `loginEnabled()` and there is a session, call `/api/me` and use its children instead of the demo profiles.
2. When a lesson loads: `POST /api/children/:id/courses` with the lesson; keep the returned `id`.
3. When the quiz ends: `PATCH /api/courses/:id` with the result and `PATCH /api/children/:id` with the updated profile.

## Demo mode

- `DEMO_MODE=1` (or no `GEMINI_API_KEY`) serves only lessons bundled in `public/demo/lessons`.
- `node scripts/pregen-demo.ts <baseUrl>` generates the demo lessons and downloads their images into `public/demo`, so the stage demo works without internet.
