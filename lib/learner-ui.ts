import { z } from "zod";
import {
  createProfile,
  recordSession,
  type LearnerProfile,
  type SessionLog,
} from "./engine";
import { STYLES } from "./schema";

export const STYLE_NAMES = {
  story: "Historias",
  visual: "Visual",
  analogy: "Analogías",
  stepByStep: "Paso a paso",
  game: "Juego",
};
export const LEVEL_NAMES = {
  explorer: "Explorador",
  adventurer: "Aventurero",
  expert: "Experto",
};

const ChildSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(40),
  age: z.number().int().min(4).max(12),
  profile: z.record(z.string(), z.unknown()).default({}),
});
export const MeSchema = z.object({
  user: z.object({ id: z.string(), email: z.string().optional() }),
  children: z.array(ChildSchema),
});
export type Child = z.infer<typeof ChildSchema>;

export function childProfile(child: Child): LearnerProfile {
  const base = createProfile(child.name, child.age, child.id);
  const data = child.profile;
  const scores = z
    .record(z.enum(STYLES), z.number().min(0).max(1))
    .safeParse(data.styleScores);
  const uses = z
    .record(z.enum(STYLES), z.number().int().nonnegative())
    .safeParse(data.styleUses);
  const mastery = z
    .record(z.string(), z.number().min(0).max(100))
    .safeParse(data.mastery);
  const sessions = z
    .array(
      z.object({
        topic: z.string(),
        style: z.enum(STYLES),
        correct: z.number().nonnegative(),
        total: z.number().positive(),
        avgAnswerMs: z.number().nonnegative(),
        replays: z.number().nonnegative(),
        confused: z.number().nonnegative(),
        hintsUsed: z.number().nonnegative(),
        completed: z.boolean(),
        at: z.string(),
      }),
    )
    .max(20)
    .safeParse(data.sessions);
  const stickers = z
    .array(
      z.object({
        topic: z.string(),
        imageUrl: z.string(),
        earnedAt: z.string(),
      }),
    )
    .safeParse(data.stickers);
  const streak = z
    .object({ days: z.number().int().nonnegative(), lastDate: z.string() })
    .safeParse(data.streak);
  return {
    ...base,
    styleScores: scores.success ? scores.data : base.styleScores,
    styleUses: uses.success ? uses.data : base.styleUses,
    mastery: mastery.success ? mastery.data : {},
    sessions: sessions.success ? sessions.data : [],
    stickers: stickers.success ? stickers.data : [],
    stars:
      typeof data.stars === "number" &&
      Number.isSafeInteger(data.stars) &&
      data.stars >= 0
        ? data.stars
        : 0,
    streak: streak.success ? streak.data : base.streak,
    lastNote: typeof data.lastNote === "string" ? data.lastNote : undefined,
  };
}

export function profilePayload(profile: LearnerProfile) {
  const { id, name, age, ...state } = profile;
  void id;
  void name;
  void age;
  return { profile: state };
}

export function completeProfile(
  profile: LearnerProfile,
  session: SessionLog,
  imageUrl: string,
): LearnerProfile {
  const updated = recordSession(profile, session);
  const date = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota",
  }).format(new Date(session.at));
  const prior = new Date(`${date}T12:00:00Z`);
  prior.setUTCDate(prior.getUTCDate() - 1);
  const yesterday = prior.toISOString().slice(0, 10);
  return {
    ...updated,
    stars: profile.stars + 1 + session.correct,
    stickers: profile.stickers.some(
      (sticker) => sticker.topic === session.topic,
    )
      ? profile.stickers
      : [
          ...profile.stickers,
          { topic: session.topic, imageUrl, earnedAt: session.at },
        ],
    streak: {
      days:
        profile.streak.lastDate === date
          ? profile.streak.days
          : profile.streak.lastDate === yesterday
            ? profile.streak.days + 1
            : 1,
      lastDate: date,
    },
  };
}
