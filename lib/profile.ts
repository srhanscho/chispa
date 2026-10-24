import { createProfile, type LearnerProfile } from "./engine";

// Profiles live in the browser only (localStorage). Every access is guarded so private windows still work.
const KEY = "chispa:profiles";

// Two demo learners with different histories, so the demo shows two different lessons for the same topic.
export function demoProfiles(): LearnerProfile[] {
  const sofia = createProfile("Sofía", 7, "demo-sofia");
  sofia.styleScores = { story: 0.82, visual: 0.45, analogy: 0.55, stepByStep: 0.4, game: 0.6 };
  const mateo = createProfile("Mateo", 8, "demo-mateo");
  mateo.styleScores = { story: 0.4, visual: 0.85, analogy: 0.5, stepByStep: 0.6, game: 0.55 };
  return [sofia, mateo];
}

export function loadProfiles(): LearnerProfile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LearnerProfile[];
  } catch {
    // Storage blocked or corrupt: fall back to demo profiles.
  }
  return demoProfiles();
}

export function saveProfiles(profiles: LearnerProfile[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    // Ignore quota or blocked storage; the session still works in memory.
  }
}
