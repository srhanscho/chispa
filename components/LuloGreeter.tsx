"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { stagger, useAnimate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { LuloAvatar } from "./LuloAvatar";

// Lulo's greeting, built like a small state machine: intro → idle ⇄ hover → press → idle, or disabled.
// Motion follows the animation principles: anticipation before every jump, squash & stretch on
// launch and impact, gravity on the fall, a spring settle, and the speech bubble following through
// a few frames after the landing.

export type GreeterState = "intro" | "idle" | "hover" | "press" | "disabled";

const FRAME = 1 / 60;
// Easing curves (cubic Bézier), never linear.
const EASE_ANTICIPATE: [number, number, number, number] = [0.3, 0, 0.5, 1];
const EASE_LAUNCH: [number, number, number, number] = [0.15, 0.85, 0.35, 1];
const EASE_GRAVITY: [number, number, number, number] = [0.55, 0, 1, 0.45];
const EASE_BREATHE: [number, number, number, number] = [0.45, 0, 0.55, 1];
const SPRING_SETTLE = { type: "spring" as const, stiffness: 520, damping: 12 };
const SPRING_SWAY = { type: "spring" as const, stiffness: 220, damping: 8.5, mass: 0.9 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 420, damping: 16 };

export function LuloGreeter({
  line,
  bubbleRef,
  onGreet,
  energy = 0.6,
  halo = "#ffc21a",
  disabled = false,
  reduceMotion: reduceSetting = false,
  size = 150,
}: {
  // What Lulo says; the bubble element (rendered by the parent) gets one .greeter-word per word.
  line: string;
  bubbleRef: RefObject<HTMLElement | null>;
  // Called when the child taps Lulo; the parent picks the next line and may speak it.
  onGreet: () => void;
  // Data binding: 0..1 drives jump height and breathing speed.
  energy?: number;
  // Data binding: color of the soft halo behind Lulo.
  halo?: string;
  disabled?: boolean;
  reduceMotion?: boolean;
  size?: number;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  // The in-app "Sin animaciones" switch or the device setting both turn motion off.
  const deviceReduce = useReducedMotion();
  const reduceMotion = reduceSetting || Boolean(deviceReduce);
  const [state, setState] = useState<GreeterState>(disabled ? "disabled" : "intro");
  const idle = useRef<AnimationPlaybackControls[]>([]);
  const busy = useRef(false);

  const body = () => scope.current?.querySelector(".greeter-body") as HTMLElement | null;
  const shadow = () => scope.current?.querySelector(".greeter-shadow") as HTMLElement | null;
  const haloEl = () => scope.current?.querySelector(".greeter-halo") as HTMLElement | null;

  const stopIdle = () => {
    idle.current.forEach((controls) => controls.stop());
    idle.current = [];
  };

  const startIdle = useCallback(() => {
    const b = body();
    const h = haloEl();
    if (!b || !h || reduceMotion) return;
    const period = 3.6 - energy * 1.4;
    // Breathing: a slow float with a hint of stretch at the top, the halo breathing in counterpoint.
    idle.current = [
      animate(b, { y: [0, -5, 0], scaleY: [1, 1.025, 1], scaleX: [1, 0.99, 1] }, { duration: period, repeat: Infinity, ease: EASE_BREATHE }),
      animate(h, { scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75] }, { duration: period, repeat: Infinity, ease: EASE_BREATHE, delay: period / 4 }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, energy, reduceMotion]);

  const revealWords = useCallback(
    (startDelay: number) => {
      const bubble = bubbleRef.current;
      if (!bubble || reduceMotion) return;
      // Follow-through: the bubble lands a few frames after Lulo, overshoots and settles.
      animate(bubble, { scale: [0.3, 1], opacity: [0, 1], rotate: [-8, 0] }, { ...SPRING_SOFT, delay: startDelay });
      const words = bubble.querySelectorAll(".greeter-word");
      if (words.length)
        animate(words, { opacity: [0, 1], y: [8, 0] }, { ...SPRING_SOFT, delay: stagger(0.05, { startDelay: startDelay + 0.12 }) });
    },
    [animate, bubbleRef, reduceMotion],
  );

  // Intro: anticipation → jump (stretch) → fall (gravity) → impact (squash) → spring settle → wave.
  useEffect(() => {
    if (disabled) return;
    if (reduceMotion) {
      // No motion: show Lulo and his line right away.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("idle");
      return;
    }
    let cancelled = false;
    const b = body();
    const s = shadow();
    if (!b || !s) return;
    const jump = 24 + energy * 24;
    (async () => {
      busy.current = true;
      await animate(b, { scaleX: 1.12, scaleY: 0.84, y: 6 }, { duration: 0.24, ease: EASE_ANTICIPATE });
      // Hold the crouch for a few frames so the jump reads as intentional.
      await animate(b, { scaleX: 1.14, scaleY: 0.82, y: 7 }, { duration: 5 * FRAME, ease: EASE_BREATHE });
      animate(s, { scaleX: 0.55, opacity: 0.3 }, { duration: 0.3, ease: EASE_LAUNCH });
      await animate(b, { y: -jump, scaleX: 0.92, scaleY: 1.1 }, { duration: 0.3, ease: EASE_LAUNCH });
      animate(s, { scaleX: 1, opacity: 0.55 }, { duration: 0.22, ease: EASE_GRAVITY });
      await animate(b, { y: 0, scaleX: 0.96, scaleY: 1.05 }, { duration: 0.22, ease: EASE_GRAVITY });
      await animate(b, { scaleX: 1.14, scaleY: 0.86 }, { duration: 3 * FRAME });
      animate(b, { scaleX: 1, scaleY: 1 }, SPRING_SETTLE);
      const h = haloEl();
      if (h)
        animate(h, { scaleX: [1, 1.1, 1], scaleY: [1, 0.9, 1] }, { duration: 0.42, delay: 2 * FRAME, ease: EASE_BREATHE });
      revealWords(3 * FRAME);
      // Wave: a small counter-move (anticipation), then a loose spring sway that settles on its own.
      await animate(b, { rotate: 4 }, { duration: 0.12, ease: EASE_ANTICIPATE, delay: 0.08 });
      await animate(b, { rotate: -9 }, SPRING_SWAY);
      await animate(b, { rotate: 0 }, SPRING_SWAY);
      busy.current = false;
      if (!cancelled) {
        setState("idle");
        startIdle();
      }
    })();
    return () => {
      cancelled = true;
      stopIdle();
    };
    // Run once on mount; state changes after that go through the handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Re-reveal the words whenever the line changes after the intro.
    if (state === "intro") return;
    revealWords(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  function enter(next: GreeterState) {
    if (disabled || busy.current || reduceMotion) return;
    const b = body();
    const h = haloEl();
    if (!b || !h) return;
    setState(next);
    stopIdle();
    if (next === "hover") {
      animate(b, { rotate: -5, y: -6, scaleX: 1.03, scaleY: 1.03 }, SPRING_SOFT);
      animate(h, { scale: 1.1, opacity: 1 }, SPRING_SOFT);
    } else if (next === "press") {
      // Anticipation of the hop: squash down toward the ground.
      animate(b, { rotate: 0, y: 5, scaleX: 1.12, scaleY: 0.86 }, { duration: 0.1, ease: EASE_ANTICIPATE });
    } else {
      animate(b, { rotate: 0, y: 0, scaleX: 1, scaleY: 1 }, SPRING_SETTLE).then(startIdle);
      animate(h, { scale: 1, opacity: 0.8 }, SPRING_SOFT);
    }
  }

  async function release() {
    if (disabled || busy.current) return;
    onGreet();
    if (reduceMotion) return;
    const b = body();
    const s = shadow();
    if (!b || !s) return;
    busy.current = true;
    stopIdle();
    // A small happy hop: stretch up, fall with gravity, squash and spring back.
    animate(s, { scaleX: 0.7, opacity: 0.35 }, { duration: 0.2, ease: EASE_LAUNCH });
    await animate(b, { y: -16, scaleX: 0.94, scaleY: 1.08 }, { duration: 0.2, ease: EASE_LAUNCH });
    animate(s, { scaleX: 1, opacity: 0.55 }, { duration: 0.16, ease: EASE_GRAVITY });
    await animate(b, { y: 0, scaleX: 1, scaleY: 1 }, { duration: 0.16, ease: EASE_GRAVITY });
    await animate(b, { scaleX: 1.1, scaleY: 0.9 }, { duration: 3 * FRAME });
    await animate(b, { scaleX: 1, scaleY: 1 }, SPRING_SETTLE);
    busy.current = false;
    setState("idle");
    startIdle();
  }

  const shown = disabled ? "disabled" : state;
  return (
    <div
      ref={scope}
      className="lulo-greeter"
      data-state={shown}
      style={{ ["--greeter-halo" as string]: halo, width: size }}
    >
      <span className="greeter-halo" aria-hidden="true" />
      <span className="greeter-shadow" aria-hidden="true" />
      <button
        type="button"
        className="greeter-body"
        disabled={disabled}
        aria-label="Saludar a Lulo"
        onPointerEnter={() => enter("hover")}
        onPointerLeave={() => enter("idle")}
        onPointerDown={() => enter("press")}
        onClick={() => void release()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") enter("press");
        }}
      >
        <LuloAvatar size={size} />
      </button>
    </div>
  );
}

// Splits a line into the word spans the greeter animates.
export function GreeterWords({ line }: { line: string }) {
  return (
    <>
      {line.split(" ").map((word, i) => (
        // The space stays outside the inline-block span, or the browser drops it.
        <span key={`${line}-${i}`}>
          <span className="greeter-word">{word}</span>{" "}
        </span>
      ))}
    </>
  );
}
