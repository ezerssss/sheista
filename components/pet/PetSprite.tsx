"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { moodVisuals } from "@/lib/pet/personality";
import type { MoodId } from "@/lib/pet/types";

const GRID = 16;
export const PET_GRID = GRID;

type Color =
  | "body"
  | "shadow"
  | "wing"
  | "outline"
  | "eye"
  | "comb"
  | "beak"
  | "leg"
  | "sparkle"
  | "dust";

type Pixel = readonly [x: number, y: number, c: Color];

type Frame = {
  pixels: Pixel[];
  // Anchor of the 'e' glyph; null for frames with baked closed eyes (sleep).
  eye: { x: number; y: number } | null;
};

const COLOR_VAR: Record<Color, string> = {
  body: "var(--pet-body)",
  shadow: "var(--pet-shadow)",
  wing: "var(--pet-wing)",
  outline: "var(--pet-outline)",
  eye: "var(--pet-outline)",
  comb: "var(--pet-comb)",
  beak: "var(--pet-beak)",
  leg: "var(--pet-leg)",
  sparkle: "var(--pet-sparkle)",
  dust: "var(--pet-dust)",
};

// Parse a 16-line, 16-char-wide string into a frame.
//  . = empty       B = body        S = belly shadow
//  W = wing        O = outline (baked closed eye, tucked feet)
//  R = comb        Y = beak        L = leg
//  e = eye (records anchor)
function parse(art: string): Frame {
  const map: Record<string, Color> = {
    O: "outline",
    B: "body",
    S: "shadow",
    W: "wing",
    R: "comb",
    Y: "beak",
    L: "leg",
    e: "eye",
  };
  const pixels: Pixel[] = [];
  let eye: Frame["eye"] = null;
  const lines = art.split("\n").filter((l) => l.length > 0);
  if (process.env.NODE_ENV !== "production") {
    if (lines.length !== GRID) {
      throw new Error(`pet frame has ${lines.length} rows, want ${GRID}`);
    }
    lines.forEach((l, y) => {
      if (l.length !== GRID) {
        throw new Error(`pet frame row ${y} has ${l.length} chars, want ${GRID}`);
      }
    });
  }
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    for (let x = 0; x < line.length; x++) {
      const c = line[x];
      const color = map[c];
      if (!color) continue;
      pixels.push([x, y, color]);
      if (c === "e" && !eye) eye = { x, y };
    }
  }
  return { pixels, eye };
}

// --- Body frames ------------------------------------------------------------
//
// This is the ORIGINAL 16x16 chicken (the one that looks right). Do not
// restyle the silhouette — new action frames must be minimal deltas of
// FRAME_STAND: change only legs, wings, or head position.
//
// Authoring rules (all frames):
//  - exactly 16 lines x 16 chars, chicken faces right; scaleX(-1) mirrors it
//  - red comb on top, yellow beak forward, single dot eye at (10,5),
//    rounded body with belly shadow, two legs on rows 14-15
//  - airborne frames tuck the feet into a small 'LL' nub on row 14
//  - sleep frames bake a closed eye ('OO') and omit 'e' so mood overlays
//    and blinking are skipped entirely

const FRAME_STAND = parse(`
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
........BBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
........L..L....
.......LL..LL...
`);

// Walking frame A — back leg pulled back, front leg planted.
const FRAME_WALK_A = parse(`
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
........BBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
........L...L...
......LL...LLL..
`);

// Walking frame B — back leg planted, front leg lifted forward.
const FRAME_WALK_B = parse(`
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
........BBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
.......L....L...
......LLL...LL..
`);

// Run drive — legs stretched wide into the stride.
const FRAME_RUN_A = parse(`
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
........BBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
......L.....L...
.....LL......LL.
`);

// Run contact — legs gathered under the body.
const FRAME_RUN_B = parse(`
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
........BBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
.........L.L....
........LL.LL...
`);

// Wing raised over the back (standing stretch).
const FRAME_FLAP = parse(`
................
................
...........R....
..........RBR...
.....WW..BBBBY..
......WW.BeBBY..
.......WBBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
........L..L....
.......LL..LL...
`);

// Airborne, wing up, feet tucked.
const FRAME_FLY_A = parse(`
................
................
...........R....
..........RBR...
.....WW..BBBBY..
......WW.BeBBY..
.......WBBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
.........LL.....
................
`);

// Airborne, wing swept down past the belly, feet tucked.
const FRAME_FLY_B = parse(`
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
........BBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBB.
...WWBSSSSSSBBB.
..WWWBSSSSSBBBB.
.WWW..BBBBBBBB..
.......BBBBBB...
.........LL.....
................
`);

// Airborne, wing spread flat behind — descending glide.
const FRAME_GLIDE = parse(`
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
........BBBBBB..
.......BBBBBBBB.
.WWWWWBBBBBBBBB.
..WWWBBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
.........LL.....
................
`);

// Head dipped one row, beak angling down toward the ground.
const FRAME_PECK_A = parse(`
................
................
................
...........R....
..........RBR...
.........BBBBY..
........BBeBBY..
.......BBBBBBBY.
......BBBBBBBBB.
.....BBBBBBBBBB.
.....BSSSSSSBBB.
.....BSSSSSBBBB.
......BBBBBBBB..
.......BBBBBB...
........L..L....
.......LL..LL...
`);

// Beak at the ground, tail up.
const FRAME_PECK_B = parse(`
................
................
................
................
................
....B...........
....BBB.........
.....BBBBBB.....
.....BBBBBBBB...
....BBBBBBBBBB..
....BSSSSSSBBB..
....BSSSSSBBBBR.
.....BBBBBBBeBR.
......BBBBBBBBY.
........L..L..Y.
.......LL..LL...
`);

// Sleeping loaf — legs tucked, eyes shut (the original sitting pose).
const FRAME_SLEEP_A = parse(`
................
................
................
...........R....
..........RBR...
.........BBBBY..
.........BOOBY..
........BBBBBB..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBBB
.....BSSSSSSBBBB
.....BSSSSSBBBB.
......BBBBBBBB..
.......OOOOOO...
................
`);

// Exhale — the head settles 1px lower into the breast.
const FRAME_SLEEP_B = parse(`
................
................
................
................
...........R....
..........RBR...
.........BBBBY..
........BBOOBY..
.......BBBBBBBB.
......BBBBBBBBB.
.....BBBBBBBBBBB
.....BSSSSSSBBBB
.....BSSSSSBBBB.
......BBBBBBBB..
.......OOOOOO...
................
`);

// --- Actions ----------------------------------------------------------------

export type PetAction =
  | "stand"
  | "walk"
  | "run"
  | "fly"
  | "glide"
  | "peck"
  | "flap"
  | "sleep";

const SEQUENCES: Record<PetAction, { frames: Frame[]; ms: number }> = {
  stand: { frames: [FRAME_STAND], ms: 0 },
  walk: { frames: [FRAME_WALK_A, FRAME_WALK_B], ms: 180 },
  run: { frames: [FRAME_RUN_A, FRAME_RUN_B], ms: 110 },
  fly: { frames: [FRAME_FLY_A, FRAME_FLY_B], ms: 140 },
  glide: { frames: [FRAME_GLIDE], ms: 0 },
  peck: {
    frames: [FRAME_PECK_A, FRAME_PECK_B, FRAME_PECK_B, FRAME_PECK_A],
    ms: 130,
  },
  flap: { frames: [FRAME_FLAP, FRAME_STAND], ms: 160 },
  sleep: { frames: [FRAME_SLEEP_A, FRAME_SLEEP_B], ms: 1200 },
};

// How long one-shot idle behaviors run before reverting to stand.
const MICRO_MS: Record<"peck" | "flap", number> = {
  peck: 4 * 130 * 2, // two peck loops
  flap: 2 * 160 * 3, // three wing stretches
};

// --- Mood eye overrides -------------------------------------------------------

// Offsets are relative to the current frame's eye anchor, so mood eyes track
// the head through peck frames. dx is toward the tail (-) / beak (+).
function eyeOverlay(
  mood: MoodId,
  blink: boolean,
): { hide: boolean; add: readonly (readonly [number, number])[] } {
  // Blink overrides everything except moods whose eyes are already closed.
  if (blink && mood !== "celebrating" && mood !== "proud" && mood !== "sleepy") {
    return { hide: true, add: [[-1, 0], [0, 0]] };
  }

  switch (mood) {
    case "urgent":
      // Wide alert eye — 2 pixels stacked.
      return { hide: false, add: [[0, -1]] };
    case "focused":
      // Concentrated narrow eye.
      return { hide: true, add: [[-1, 0], [0, 0]] };
    case "celebrating":
      // Closed happy arc ^_^
      return { hide: true, add: [[-1, 1], [0, 0], [1, 1]] };
    case "proud":
      // Smug half-lidded eye.
      return { hide: true, add: [[-1, 0], [0, -1]] };
    case "chilling":
      // Half-closed — lower lid only.
      return { hide: true, add: [[-1, 1], [0, 1]] };
    case "sleepy":
    case "disappointed":
      // Closed — low horizontal dash.
      return { hide: true, add: [[-1, 1], [0, 1], [1, 1]] };
    case "worried":
      // Squinted small eye.
      return { hide: true, add: [[0, 0]] };
    default:
      // nudging / comeback — default open eye.
      return { hide: false, add: [] };
  }
}

// --- Particles ----------------------------------------------------------------

export type PetEffect = { kind: "dust" | "feather"; key: number } | null;

function ParticleLayer({
  mood,
  action,
  effect,
  animate,
}: {
  mood: MoodId;
  action: PetAction;
  effect: PetEffect;
  animate: boolean;
}) {
  const visuals = moodVisuals(mood);
  return (
    <>
      {visuals.particle === "zzz" && (
        <g className={animate ? "pet-particle-zzz" : undefined}>
          <rect x={13} y={3} width={1} height={1} fill="var(--pet-outline)" />
          <rect x={14} y={2} width={1} height={1} fill="var(--pet-outline)" />
        </g>
      )}
      {visuals.particle === "sparkle" && (
        <g className={animate ? "pet-particle-sparkle" : undefined}>
          <rect x={2} y={3} width={1} height={1} fill="var(--pet-sparkle)" />
          <rect x={14} y={5} width={1} height={1} fill="var(--pet-sparkle)" />
          <rect x={1} y={9} width={1} height={1} fill="var(--pet-sparkle)" />
          <rect x={15} y={11} width={1} height={1} fill="var(--pet-sparkle)" />
        </g>
      )}
      {visuals.particle === "sweat" && (
        <g>
          <rect x={13} y={5} width={1} height={1} fill="var(--pet-beak)" />
          <rect x={14} y={6} width={1} height={1} fill="var(--pet-beak)" />
        </g>
      )}
      {animate && action === "run" && (
        <g className="pet-particle-dust-loop">
          <rect x={3} y={14} width={1} height={1} fill="var(--pet-dust)" />
          <rect x={2} y={15} width={1} height={1} fill="var(--pet-dust)" />
          <rect x={5} y={15} width={1} height={1} fill="var(--pet-dust)" />
        </g>
      )}
      {animate && effect?.kind === "dust" && (
        <g key={`fx-${effect.key}`} className="pet-particle-dust">
          <rect x={5} y={14} width={1} height={1} fill="var(--pet-dust)" />
          <rect x={7} y={15} width={1} height={1} fill="var(--pet-dust)" />
          <rect x={9} y={14} width={1} height={1} fill="var(--pet-dust)" />
          <rect x={10} y={15} width={1} height={1} fill="var(--pet-dust)" />
          <rect x={7} y={13} width={1} height={1} fill="var(--pet-dust)" />
        </g>
      )}
      {animate && effect?.kind === "feather" && (
        <g key={`fx-${effect.key}`} className="pet-particle-feather">
          <rect x={3} y={5} width={1} height={1} fill="var(--pet-wing)" />
          <rect x={4} y={6} width={1} height={1} fill="var(--pet-wing)" />
        </g>
      )}
    </>
  );
}

// --- Component ------------------------------------------------------------

export type PetSpriteProps = {
  mood: MoodId;
  facing?: "left" | "right";
  action?: PetAction;
  /** Enables occasional peck/flap micro-behaviors while standing. */
  idle?: boolean;
  /** false = fully static frame (PNG export, reduced motion). */
  animate?: boolean;
  /** One-shot particle burst; bump `key` to replay. */
  effect?: PetEffect;
  pixelSize?: number;
  className?: string;
};

export function PetSprite({
  mood,
  facing = "right",
  action = "stand",
  idle = false,
  animate = true,
  effect = null,
  pixelSize = 4,
  className,
}: PetSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [blink, setBlink] = useState(false);
  const [microAction, setMicroAction] = useState<"peck" | "flap" | null>(null);

  // Idle micro-behaviors only apply while plainly standing.
  const effective: PetAction =
    action === "stand" && microAction ? microAction : action;

  // Frame cycling for the current action.
  useEffect(() => {
    setFrameIndex(0);
    const seq = SEQUENCES[effective];
    if (!animate || seq.frames.length <= 1) return;
    const interval = window.setInterval(
      () => setFrameIndex((i) => (i + 1) % seq.frames.length),
      seq.ms,
    );
    return () => window.clearInterval(interval);
  }, [effective, animate]);

  // Slow random blink.
  useEffect(() => {
    if (!animate) return;
    let cancelled = false;
    const schedule = () => {
      const next = 4000 + Math.random() * 3500;
      window.setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setBlink(false);
          schedule();
        }, 140);
      }, next);
    };
    schedule();
    return () => {
      cancelled = true;
    };
  }, [animate]);

  // Occasional peck or wing stretch while idling.
  useEffect(() => {
    setMicroAction(null);
    if (!idle || !animate || action !== "stand") return;
    let cancelled = false;
    let clearTimer: number | undefined;
    const schedule = () => {
      const next = 5000 + Math.random() * 5000;
      window.setTimeout(() => {
        if (cancelled) return;
        const pick = Math.random() < 0.6 ? "peck" : "flap";
        setMicroAction(pick);
        clearTimer = window.setTimeout(() => {
          if (cancelled) return;
          setMicroAction(null);
          schedule();
        }, MICRO_MS[pick]);
      }, next);
    };
    schedule();
    return () => {
      cancelled = true;
      if (clearTimer) window.clearTimeout(clearTimer);
    };
  }, [idle, animate, action]);

  const seq = SEQUENCES[effective];
  const frame = seq.frames[frameIndex % seq.frames.length];

  // Mood/blink eye overlay, anchored to this frame's eye.
  let pixels: readonly Pixel[] = frame.pixels;
  if (frame.eye) {
    const overlay = eyeOverlay(mood, blink && animate);
    if (overlay.hide) pixels = pixels.filter((p) => p[2] !== "eye");
    if (overlay.add.length > 0) {
      const { x, y } = frame.eye;
      pixels = [
        ...pixels,
        ...overlay.add.map(
          ([dx, dy]) => [x + dx, y + dy, "eye"] as const,
        ),
      ];
    }
  }

  // The original warm palette. Sparkle is gold on purpose — the theme accent
  // is green and reads as a glitch on the cream body, never use it here.
  const cssVars: React.CSSProperties = {
    // @ts-expect-error CSS custom properties
    "--pet-body": "#f6efe1",
    "--pet-shadow": "#dccfb3",
    "--pet-wing": "#ddcda6",
    "--pet-outline": "#221a14",
    "--pet-comb": "#d94545",
    "--pet-beak": "#e8a01c",
    "--pet-leg": "#c8801a",
    "--pet-sparkle": "#f2c94c",
    "--pet-dust": "#d8cdb2",
  };

  return (
    <div
      className={cn("inline-block image-pixelated", className)}
      style={{
        width: GRID * pixelSize,
        height: GRID * pixelSize,
        ...cssVars,
      }}
      aria-label={`pet chicken: ${mood}`}
      role="img"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: facing === "left" ? "scaleX(-1)" : undefined,
          transformOrigin: "center",
        }}
      >
        <svg
          viewBox={`0 0 ${GRID} ${GRID}`}
          width="100%"
          height="100%"
          shapeRendering="crispEdges"
          style={{ display: "block" }}
        >
          {pixels.map(([x, y, c], i) => (
            <rect
              key={`${i}-${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={COLOR_VAR[c]}
            />
          ))}
          <ParticleLayer
            mood={mood}
            action={effective}
            effect={effect}
            animate={animate}
          />
        </svg>
      </div>
    </div>
  );
}
