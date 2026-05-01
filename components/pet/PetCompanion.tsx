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
import { PetSprite } from "@/components/pet/PetSprite";
import { PetBubble, type BubbleAction } from "@/components/pet/PetBubble";
import { PetMenu } from "@/components/pet/PetMenu";

const MUTED_KEY = "sheista:pet-muted";
const HIDDEN_KEY = "sheista:pet-hidden-session";
const CELEBRATE_MS = 8_000;
const PIXEL_SIZE = 4;
const PET_SIZE = 16 * PIXEL_SIZE; // 64px sprite
const GROUND_OFFSET = 16; // px from bottom of viewport
const WALK_SPEED = 80; // px/sec horizontal
const HOP_SPEED = 240; // px/sec vertical (faster — chickens hop)
const ARRIVE_X = 2;
const ARRIVE_Y = 1;

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
  const [walking, setWalking] = useState(false);

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

    const startX = window.innerWidth - PET_SIZE - 24;
    xRef.current = startX;
    yRef.current = 0;
    if (containerRef.current) {
      containerRef.current.style.left = `${startX}px`;
      containerRef.current.style.bottom = `${GROUND_OFFSET}px`;
    }
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

      // No share suggestion when leveling down — read the room.
      const milestone =
        state && state.authenticated && detail.levelAfter >= detail.levelBefore
          ? detectMilestone(
              state.streak.current + (state.streak.todayDone ? 0 : 1),
              detail,
            )
          : null;
      const text =
        detail.levelAfter > detail.levelBefore
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
        gateBlocked: state.gateBlocked,
        recentHeatmap: state.recentHeatmap,
      },
      activeTraining: active,
      recentlyFinished,
      hoursUntilLocalMidnight,
      localHour,
    };
    return getMood(ctx);
  }, [state, active, recentlyFinished]);

  // Movement loop (rAF). Writes position directly to the DOM so we don't
  // re-render the React tree at 60fps.
  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    let lastTime = performance.now();
    let lastWalking = walking;
    let lastFacing: "left" | "right" = facing;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const tgt = targetRef.current;
      let isWalking = false;

      if (tgt !== null) {
        const dx = tgt.x - xRef.current;
        const dy = tgt.y - yRef.current;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        const goingDown = dy < 0;
        const goingUp = dy > 0;

        // Movement priority:
        //  - hop DOWN before walking (chicken jumps off perch first)
        //  - walk X first when going UP to a perch (align horizontally first)
        //  - same level: just walk X
        if (goingDown && ady > ARRIVE_Y) {
          const stepY = Math.min(ady, HOP_SPEED * dt);
          yRef.current += Math.sign(dy) * stepY;
        } else if (adx > ARRIVE_X) {
          const stepX = Math.min(adx, WALK_SPEED * dt);
          xRef.current += Math.sign(dx) * stepX;
          isWalking = true;
          // Update facing when actively moving.
          const newFacing = dx > 0 ? "right" : "left";
          if (newFacing !== lastFacing) {
            lastFacing = newFacing;
            setFacing(newFacing);
          }
        } else if (goingUp && ady > ARRIVE_Y) {
          const stepY = Math.min(ady, HOP_SPEED * dt);
          yRef.current += Math.sign(dy) * stepY;
        } else {
          // Arrived. Lock onto perch if applicable.
          if (tgt.element && perchedOn.current !== tgt.element) {
            perchedOn.current = tgt.element;
          }
        }

        if (containerRef.current) {
          containerRef.current.style.left = `${xRef.current}px`;
          containerRef.current.style.bottom = `${yRef.current + GROUND_OFFSET}px`;
        }
      }

      if (isWalking !== lastWalking) {
        lastWalking = isWalking;
        setWalking(isWalking);
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [mounted, walking, facing]);

  // Target picker — re-scans on route change, then re-picks on a schedule.
  // Faster cadence when perched (pacing back and forth on a button).
  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted, pathname, mood]);

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
          walking={walking}
          pixelSize={PIXEL_SIZE}
        />
      </button>
    </div>
  );
}
