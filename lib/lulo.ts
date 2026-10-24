import integration from "../docs/lulo/especificaciones/04_lulo_plan_integracion_rive.json";

export type LuloScene = "home" | "loading" | "lesson" | "quiz" | "encourage" | "reward";
export type LuloEvent = "APP_READY" | "LESSON_REQUESTED" | "LESSON_CARD_SHOWN" | "SPEECH_STARTED" | "SPEECH_ENDED" | "QUIZ_STARTED" | "CHILD_NEEDS_HELP" | "REWARD_EARNED";
export const initialLuloState = { scene: "home" as LuloScene, isSpeaking: false };
export type LuloState = typeof initialLuloState;

// Only visual state crosses this boundary: no learner data or lesson text.
export function luloReducer(state: LuloState, event: LuloEvent): LuloState {
  if (event === "SPEECH_STARTED") return { ...state, isSpeaking: true };
  if (event === "SPEECH_ENDED") return { ...state, isSpeaking: false };
  const mapping = integration.frontend_event_mapping.find((entry) => entry.ui_event === event);
  return mapping && "scene" in mapping
    ? { ...state, scene: mapping.scene as LuloScene }
    : state;
}
