"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePetState } from "@/hooks/usePetState";
import {
  getActiveTraining,
  type ActiveTraining,
} from "@/lib/themecp/active-training";
import {
  createMessagePicker,
  detectMilestone,
  getMood,
  type MoodContext,
} from "@/lib/pet/personality";
import { onTrainingFinished, type TrainingFinishedDetail } from "@/lib/pet/events";
import {
  PetSprite,
  PET_GRID,
  type PetAction,
  type PetEffect,
} from "@/components/pet/PetSprite";
import { PetBubble, type BubbleAction } from "@/components/pet/PetBubble";
import { PetMenu } from "@/components/pet/PetMenu";

const MUTED_KEY = "sheista:pet-muted";
const HIDDEN_KEY = "sheista:pet-hidden-session";
const CELEBRATE_MS = 8_000;
const PIXEL_SIZE = 4;
const PET_SIZE = PET_GRID * PIXEL_SIZE; // 64px sprite
const GROUND_OFFSET = 2; // px from bottom of viewport — feet on the edge
const WALK_SPEED = 80; // px/sec horizontal
const RUN_SPEED = 200; // px/sec when the target is far
const RUN_THRESHOLD = 220; // start running beyond this |dx|
const RUN_STOP = 60; // hysteresis: drop back to a walk under this
const FLY_SPEED = 160; // px/sec ascending to a perch
const GLIDE_SPEED = 120; // px/sec descending
const FLY_DRIFT = 40; // px/sec horizontal correction while ascending
const ARRIVE_X = 2;
const ARRIVE_Y = 1;

// While moving, the sprite action comes from locomotion; otherwise from mood.
type MoveAction = Extract<PetAction, "walk" | "run" | "fly" | "glide">;

// Time-based perch behavior.
const STAY_ON_PERCH_PROB = 0.7; // chance of pacing on current perch instead of leaving
const PERCH_PACE_DELAY_MIN = 1_800;
const PERCH_PACE_DELAY_MAX = 3_400;
const ROAM_DELAY_MIN = 6_000;
const ROAM_DELAY_MAX = 11_000;

type Target = {
  x: number;
  y: number; // CSS bottom value (0 = ground)
  element: HTMLElement | null;
};

export function PetCompanion() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, refresh } = usePetState();

  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<ActiveTraining | null>(null);
  const [recentlyFinished, setRecentlyFinished] =
    useState<TrainingFinishedDetail | null>(null);

  const [bubble, setBubble] = useState<{ text: string; action: BubbleAction } | null>(
    null,
  );
  const [muted, setMuted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [facing, setFacing] = useState<"left" | "right">("left");
  const [moveAction, setMoveAction] = useState<MoveAction | null>(null);
  const [airborne, setAirborne] = useState(false);
  const [effect, setEffect] = useState<PetEffect>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const effectKey = useRef(0);

  // Position (refs only — written directly to DOM in rAF to avoid re-renders).
  const xRef = useRef(0);
  const yRef = useRef(0);
  const targetRef = useRef<Target | null>(null);
  const perchedOn = useRef<HTMLElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef(createMessagePicker());
  const bubbleHideTimer = useRef<number | null>(null);
  const nextBubbleTimer = useRef<number | null>(null);
  const targetTimer = useRef<number | null>(null);

  // Mount + hydrate persisted toggles + active training + initial position.
  useEffect(() => {
    setMounted(true);
    setMuted(localStorage.getItem(MUTED_KEY) === "1");
    setHidden(sessionStorage.getItem(HIDDEN_KEY) === "1");
    setActive(getActiveTraining());

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);

    const startX = window.innerWidth - PET_SIZE - 24;
    xRef.current = startX;
    yRef.current = 0;
    if (containerRef.current) {
      containerRef.current.style.left = `${startX}px`;
      containerRef.current.style.bottom = `${GROUND_OFFSET}px`;
    }
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Re-poll localStorage for active training every 5s.
  useEffect(() => {
    if (!mounted) return;
    const t = window.setInterval(() => {
      setActive(getActiveTraining());
    }, 5_000);
    return () => window.clearInterval(t);
  }, [mounted]);

  // Listen for training-finished events.
  useEffect(() => {
    return onTrainingFinished((detail) => {
      setRecentlyFinished(detail);
      setActive(null);
      void refresh();

      const isDaily = detail.kind === "daily";
      // No share suggestion when leveling down — read the room. For daily
      // bites, strip the AK flag so only streak milestones can suggest a
      // share (a one-problem day is not an "AK").
      const milestone =
        state && state.authenticated && detail.levelAfter >= detail.levelBefore
          ? detectMilestone(
              state.streak.current + (state.streak.todayDone ? 0 : 1),
              isDaily ? { ...detail, isAk: false } : detail,
            )
          : null;
      const DAILY_LINES = [
        "light day. still counts.",
        "one problem a day keeps the rust away.",
        "bite logged. streak safe.",
      ];
      const text = isDaily
        ? DAILY_LINES[Math.floor(Math.random() * DAILY_LINES.length)]
        : detail.levelAfter > detail.levelBefore
          ? "AK?! +1 level. earned."
          : detail.levelAfter < detail.levelBefore
            ? "ouch. -1. shake it off."
            : detail.isAk
              ? "frame perfect."
              : "got 'em next time.";
      const action: BubbleAction = milestone
        ? {
            kind: "share",
            template: milestone.template,
            onShare: () => router.push(`/dashboard?share=${milestone.template}`),
          }
        : null;
      showBubble(text, action);

      window.setTimeout(() => setRecentlyFinished(null), CELEBRATE_MS);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, state, router]);

  // Compute mood.
  const mood = useMemo(() => {
    if (!state || state.authenticated === false) return "chilling" as const;
    const now = new Date();
    const localHour = now.getHours();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const hoursUntilLocalMidnight =
      (midnight.getTime() - now.getTime()) / 3600_000;

    const ctx: MoodContext = {
      state: {
        cf_handle: state.cf_handle,
        cf_rating: state.cf_rating,
        level: state.level,
        streak: state.streak,
        totalRounds: state.totalRounds,
        akRate: state.akRate,
        avgRecentPerf: state.avgRecentPerf,
        lastFinishedAt: state.lastFinishedAt,
        lastPracticeAt: state.lastPracticeAt,
        daysIdle: state.daysIdle,
        todayBiteDone: state.todayBiteDone,
        gateBlocked: state.gateBlocked,
        recentHeatmap: state.recentHeatmap,
        todayKey: state.todayKey,
      },
      activeTraining: active,
      recentlyFinished,
      hoursUntilLocalMidnight,
      localHour,
    };
    return getMood(ctx);
  }, [state, active, recentlyFinished]);

  // Movement loop (rAF). Writes position directly to the DOM so we don't
  // re-render the React tree at 60fps; React state (action/facing/airborne)
  // is only touched on transitions.
  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    let lastTime = performance.now();
    let lastMove: MoveAction | null = null;
    let lastFacing: "left" | "right" = "left";
    let running = false;

    const fireEffect = (kind: "dust" | "feather") => {
      effectKey.current += 1;
      setEffect({ kind, key: effectKey.current });
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const tgt = targetRef.current;
      let move: MoveAction | null = null;

      if (tgt !== null) {
        const dx = tgt.x - xRef.current;
        const dy = tgt.y - yRef.current;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);

        const faceToward = () => {
          const newFacing = dx > 0 ? "right" : "left";
          if (newFacing !== lastFacing) {
            lastFacing = newFacing;
            setFacing(newFacing);
          }
        };

        // Movement priority:
        //  - glide DOWN off a perch first (diagonal — x corrects mid-air)
        //  - then cover X on foot: run when far, walk when close
        //  - then fly UP to the perch (slight x drift allowed)
        if (dy < 0 && ady > ARRIVE_Y) {
          yRef.current -= Math.min(ady, GLIDE_SPEED * dt);
          if (adx > ARRIVE_X) {
            xRef.current += Math.sign(dx) * Math.min(adx, WALK_SPEED * dt);
            faceToward();
          }
          move = "glide";
        } else if (adx > ARRIVE_X) {
          if (running ? adx < RUN_STOP : adx > RUN_THRESHOLD) running = !running;
          const speed = running ? RUN_SPEED : WALK_SPEED;
          xRef.current += Math.sign(dx) * Math.min(adx, speed * dt);
          faceToward();
          move = running ? "run" : "walk";
        } else if (dy > ARRIVE_Y) {
          yRef.current += Math.min(ady, FLY_SPEED * dt);
          if (adx > 0.5) {
            xRef.current += Math.sign(dx) * Math.min(adx, FLY_DRIFT * dt);
          }
          move = "fly";
        } else {
          // Arrived. Lock onto perch if applicable.
          running = false;
          if (tgt.element && perchedOn.current !== tgt.element) {
            perchedOn.current = tgt.element;
          }
        }

        // Solid landing: coming out of the air, plant the feet exactly.
        const wasAirborne = lastMove === "fly" || lastMove === "glide";
        const isAirborne = move === "fly" || move === "glide";
        if (wasAirborne && !isAirborne) {
          yRef.current = tgt.y;
          fireEffect("dust");
        }
        if (!wasAirborne && move === "fly") fireEffect("feather");

        if (containerRef.current) {
          containerRef.current.style.left = `${xRef.current}px`;
          containerRef.current.style.bottom = `${yRef.current + GROUND_OFFSET}px`;
        }
      }

      if (move !== lastMove) {
        const isAirborne = move === "fly" || move === "glide";
        const wasAirborne = lastMove === "fly" || lastMove === "glide";
        if (isAirborne !== wasAirborne) setAirborne(isAirborne);
        lastMove = move;
        setMoveAction(move);
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [mounted]);

  // Target picker — re-scans on route change, then re-picks on a schedule.
  // Faster cadence when perched (pacing back and forth on a button).
  useEffect(() => {
    if (!mounted) return;
    if (reducedMotion) return; // stays put — no roaming under reduced motion
    if (mood === "sleepy") return;

    const pickAndSchedule = () => {
      pickNewTarget();
      const onPerch = perchedOn.current !== null;
      const min = onPerch ? PERCH_PACE_DELAY_MIN : ROAM_DELAY_MIN;
      const max = onPerch ? PERCH_PACE_DELAY_MAX : ROAM_DELAY_MAX;
      const delay = min + Math.random() * (max - min);
      targetTimer.current = window.setTimeout(pickAndSchedule, delay);
    };

    const initial = window.setTimeout(pickAndSchedule, 1_400);
    return () => {
      window.clearTimeout(initial);
      if (targetTimer.current) window.clearTimeout(targetTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, pathname, mood, reducedMotion]);

  function pickNewTarget() {
    if (typeof window === "undefined") return;
    const margin = 16;
    const maxX = window.innerWidth - PET_SIZE - margin;

    // If currently perched, mostly pace within button bounds (chicken
    // walking around on top of the button); occasionally hop off.
    if (perchedOn.current && document.contains(perchedOn.current)) {
      if (Math.random() < STAY_ON_PERCH_PROB) {
        const rect = perchedOn.current.getBoundingClientRect();
        // Pick a new X anywhere within the button's footprint, but keep
        // the chicken from hanging off the edge.
        const usableW = Math.max(0, rect.width - PET_SIZE * 0.6);
        const newX = rect.left - PET_SIZE * 0.2 + Math.random() * usableW;
        targetRef.current = {
          x: Math.max(margin, Math.min(maxX, newX)),
          y: window.innerHeight - rect.top - GROUND_OFFSET,
          element: perchedOn.current,
        };
        return;
      }
      // Falling through means we're leaving the perch.
      perchedOn.current = null;
    }

    // Pick a global target — perch button or random wander.
    const perches = Array.from(
      document.querySelectorAll<HTMLElement>("[data-pet-perch]"),
    );
    const visible = perches.filter((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.bottom > 0 &&
        r.top < window.innerHeight &&
        r.right > 0 &&
        r.left < window.innerWidth &&
        r.width > 0 &&
        r.height > 0
      );
    });

    if (visible.length > 0) {
      const target = visible[Math.floor(Math.random() * visible.length)];
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - PET_SIZE / 2;
      targetRef.current = {
        x: Math.max(margin, Math.min(maxX, centerX)),
        y: window.innerHeight - rect.top - GROUND_OFFSET,
        element: target,
      };
    } else {
      // Wander along the ground.
      targetRef.current = {
        x: margin + Math.random() * Math.max(0, maxX - margin),
        y: 0,
        element: null,
      };
    }
  }

  // Schedule auto-bubbles. Skip during focused (round in progress).
  useEffect(() => {
    if (!mounted || !state || state.authenticated === false || muted) return;
    if (mood === "focused") return;

    const schedule = (delay: number) => {
      if (nextBubbleTimer.current) window.clearTimeout(nextBubbleTimer.current);
      nextBubbleTimer.current = window.setTimeout(() => {
        const variant = pickerRef.current.pick(mood);
        if (variant.kind === "share") {
          showBubble(variant.text, {
            kind: "share",
            template: variant.template,
            onShare: () => router.push(`/dashboard?share=${variant.template}`),
          });
        } else {
          showBubble(variant.text, null);
        }
        schedule(60_000 + Math.random() * 60_000);
      }, delay);
    };

    schedule(8_000 + Math.random() * 7_000);
    return () => {
      if (nextBubbleTimer.current) window.clearTimeout(nextBubbleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, mounted, muted, state?.authenticated, router]);

  function showBubble(text: string, action: BubbleAction) {
    setBubble({ text, action });
    if (bubbleHideTimer.current) window.clearTimeout(bubbleHideTimer.current);
    bubbleHideTimer.current = window.setTimeout(() => setBubble(null), 6_000);
  }

  function pat() {
    setMenuOpen(false);
    if (muted) return;
    const variant = pickerRef.current.pick(mood);
    if (variant.kind === "share") {
      showBubble(variant.text, {
        kind: "share",
        template: variant.template,
        onShare: () => router.push(`/dashboard?share=${variant.template}`),
      });
    } else {
      showBubble(variant.text, null);
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTED_KEY, next ? "1" : "0");
    setMenuOpen(false);
    if (next) setBubble(null);
  }

  function hideForSession() {
    setHidden(true);
    sessionStorage.setItem(HIDDEN_KEY, "1");
  }

  if (!mounted) return null;
  if (!state || state.authenticated === false) return null;
  if (hidden) return null;

  // Initial inline position to avoid a top-left flash on first paint.
  // The rAF loop overwrites these via direct DOM mutation thereafter.
  const initialLeft = xRef.current || (window.innerWidth - PET_SIZE - 24);
  const initialBottom = (yRef.current || 0) + GROUND_OFFSET;

  // Locomotion wins; otherwise mood decides between sleeping and standing.
  const action: PetAction =
    moveAction ?? (mood === "sleepy" ? "sleep" : "stand");

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed z-40 select-none"
      style={{
        width: PET_SIZE,
        height: PET_SIZE,
        left: `${initialLeft}px`,
        bottom: `${initialBottom}px`,
      }}
    >
      {/* Ground-contact shadow; lifts away while airborne. */}
      <div
        aria-hidden
        className="absolute left-1/2 rounded-full"
        style={{
          bottom: -2,
          width: PET_SIZE * 0.6,
          height: 7,
          background:
            "radial-gradient(ellipse, hsl(0 0% 0% / 0.30), transparent 70%)",
          transition: "transform 200ms ease, opacity 200ms ease",
          transform: `translateX(-50%) scale(${airborne ? 0.5 : 1})`,
          opacity: airborne ? 0.15 : 0.55,
        }}
      />
      {(menuOpen || bubble) && (
        <div className="pointer-events-auto absolute bottom-full left-1/2 mb-2 -translate-x-1/2 flex flex-col items-center gap-2">
          {menuOpen ? (
            <PetMenu
              muted={muted}
              onToggleMute={toggleMute}
              onHide={hideForSession}
            />
          ) : (
            bubble && <PetBubble text={bubble.text} action={bubble.action} />
          )}
        </div>
      )}
      <button
        type="button"
        onClick={pat}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen((o) => !o);
        }}
        className="pointer-events-auto block cursor-pointer transition-transform active:scale-95"
        aria-label={`pet chicken (${mood})`}
        style={{ width: PET_SIZE, height: PET_SIZE }}
      >
        <PetSprite
          mood={mood}
          facing={facing}
          action={action}
          idle={moveAction === null && mood !== "sleepy"}
          animate={!reducedMotion}
          effect={effect}
          pixelSize={PIXEL_SIZE}
        />
      </button>
    </div>
  );
}
