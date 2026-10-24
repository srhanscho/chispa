import { NoteSchema, TopicFromPhotoSchema } from "./schema";
import {
  SuggestReplySchema,
  TutorReplySchema,
  type TutorRequest,
} from "./tutor-schema";
import type { LearnerProfile } from "./engine";

export async function experiencePost(
  route: string,
  body: unknown,
  timeoutMs = 45000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(
        `No pudimos completar esta petición (${response.status}).`,
      );
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const learnerSummary = (profile: LearnerProfile) => ({
  name: profile.name,
  age: profile.age,
  styleScores: profile.styleScores,
  mastery: profile.mastery,
  recentTopics: profile.sessions.slice(-20).map((session) => session.topic),
});

export async function requestNote(profile: LearnerProfile) {
  return NoteSchema.parse(
    await experiencePost("/api/note", {
      name: profile.name,
      styleScores: profile.styleScores,
      mastery: profile.mastery,
      recentSessions: profile.sessions.slice(-20),
    }),
  );
}
export async function requestSuggestions(profile: LearnerProfile) {
  return SuggestReplySchema.parse(
    await experiencePost("/api/suggest", { learner: learnerSummary(profile) }),
  );
}
export async function requestTutor(input: TutorRequest) {
  return TutorReplySchema.parse(
    await experiencePost("/api/tutor", {
      ...input,
      history: input.history.slice(-10),
    }),
  );
}
export async function requestPhoto(imageBase64: string) {
  return TopicFromPhotoSchema.parse(
    await experiencePost("/api/topic-from-photo", {
      imageBase64,
      mimeType: "image/jpeg",
    }),
  );
}
