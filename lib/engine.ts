import { STYLES, type Level, type Style } from "./schema";

// Adaptive engine: plain numbers decide, Gemma interprets and explains.

export const LEARNING_RATE = 0.3;
export const EPSILON = 0.2;
export const CONFUSED_PENALTY = 0.1;
export const ABANDON_PENALTY = 0.3;
export const MASTERY_GAIN = 12;
export const MASTERY_LOSS = 4;
export const MAX_SESSIONS = 20;

export interface SessionLog {
  topic: string;
  style: Style;
  correct: number;
  total: number;
  avgAnswerMs: number;
  replays: number;
  confused: number;
  hintsUsed: number;
  completed: boolean;
  at: string;
}

export interface Sticker {
  topic: string;
  imageUrl: string;
  earnedAt: string;
}

export interface LearnerProfile {
  id: string;
  name: string;
  age: number;
  styleScores: Record<Style, number>;
  styleUses: Record<Style, number>;
  mastery: Record<string, number>;
  stars: number;
  stickers: Sticker[];
  streak: { days: number; lastDate: string };
  sessions: SessionLog[];
  lastNote?: string;
}

type Rng = () => number;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const byStyle = (value: number) =>
  Object.fromEntries(STYLES.map((style) => [style, value])) as Record<Style, number>;

export function createProfile(name: string, age: number, id = crypto.randomUUID()): LearnerProfile {
  return {
    id,
    name,
    age,
    styleScores: byStyle(0.5),
    styleUses: byStyle(0),
    mastery: {},
    stars: 0,
    stickers: [],
    streak: { days: 0, lastDate: "" },
    sessions: [],
  };
}

export function sessionOutcome(session: SessionLog): number {
  const accuracy = session.total > 0 ? session.correct / session.total : 0;
  const penalty = CONFUSED_PENALTY * session.confused + (session.completed ? 0 : ABANDON_PENALTY);
  return clamp(accuracy - penalty, 0, 1);
}

export function recordSession(profile: LearnerProfile, session: SessionLog): LearnerProfile {
  const outcome = sessionOutcome(session);
  const previousScore = profile.styleScores[session.style];
  const wrong = session.total - session.correct;
  const previousMastery = profile.mastery[session.topic] ?? 0;

  return {
    ...profile,
    styleScores: {
      ...profile.styleScores,
      [session.style]: previousScore + LEARNING_RATE * (outcome - previousScore),
    },
    styleUses: { ...profile.styleUses, [session.style]: profile.styleUses[session.style] + 1 },
    mastery: {
      ...profile.mastery,
      [session.topic]: clamp(previousMastery + session.correct * MASTERY_GAIN - wrong * MASTERY_LOSS, 0, 100),
    },
    sessions: [...profile.sessions, session].slice(-MAX_SESSIONS),
  };
}

export function pickStyle(profile: LearnerProfile, rng: Rng = Math.random): Style {
  if (rng() < EPSILON) return STYLES[Math.floor(rng() * STYLES.length)];
  return STYLES.reduce((best, style) =>
    profile.styleScores[style] > profile.styleScores[best] ? style : best,
  );
}

export function levelFor(mastery: number): Level {
  if (mastery >= 80) return "expert";
  if (mastery >= 40) return "adventurer";
  return "explorer";
}

export const STYLE_DESCRIPTIONS: Record<Style, string> = {
  story: "Tell it as a short story with a character the child can follow.",
  visual: "Use very little text; lean on images and size comparisons with familiar things.",
  analogy: "Connect every idea to something the child already knows from daily life.",
  stepByStep: "Give one clear fact per card, in order.",
  game: "Ask the child a playful question on every card before explaining.",
};
