"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { moodVisuals } from "@/lib/pet/personality";
import type { MoodId } from "@/lib/pet/types";

const GRID = 16;

type Color =
  | "body"
  | "shadow"
  | "outline"
  | "eye"
  | "comb"
  | "beak"
  | "leg"
  | "sparkle";

type Pixel = readonly [x: number, y: number, c: Color];

const COLOR_VAR: Record<Color, string> = {
  body: "var(--pet-body)",
  shadow: "var(--pet-shadow)",
  outline: "var(--pet-outline)",
  eye: "var(--pet-outline)",
  comb: "var(--pet-comb)",
  beak: "var(--pet-beak)",
  leg: "var(--pet-leg)",
  sparkle: "var(--pet-sparkle)",
};

// Parse a 16-line, 16-char-wide string into pixel coordinates.
//  . = empty   B = body    S = shadow    O = outline (also eye)
//  R = comb    Y = beak    L = leg
function parse(art: string): Pixel[] {
  const map: Record<string, Color> = {
    O: "outline",
    B: "body",
    S: "shadow",
    R: "comb",
    Y: "beak",
    L: "leg",
    e: "eye",
  };
  const pixels: Pixel[] = [];
  const lines = art.split("\n").filter((l) => l.length > 0);
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    for (let x = 0; x < line.length; x++) {
      const c = line[x];
      const color = map[c];
      if (color) pixels.push([x, y, color]);
    }
  }
  return pixels;
}

// --- Body templates -------------------------------------------------------

// Standing chicken. Faces right by default; CSS scaleX(-1) flips it.
// 16x16 grid. Lines must be exactly 16 chars.
//
// Anatomy: red comb on top, yellow beak forward, single dot eye,
// rounded white body with belly shadow, two yellow legs and feet.
const FRAME_STANDING = parse(`
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

// Sitting / sleeping pose — body lower, legs tucked, smaller silhouette.
const FRAME_SITTING = parse(`
................
................
................
...........R....
..........RBR...
.........BBBBY..
.........BeBBY..
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

// --- Mood eye overrides ---------------------------------------------------

// The standing/walking frames put a single black eye at (10,5).
// For mood variations we add or replace pixels relative to that anchor.

const EYE_X = 10;
const EYE_Y = 5;

function eyeOverlay(mood: MoodId, blink: boolean): {
  removeEye: boolean;
  add: Pixel[];
} {
  // Blink overrides everything except moods that are already closed.
  if (
    blink &&
    mood !== "celebrating" &&
    mood !== "proud" &&
    mood !== "sleepy"
  ) {
    return {
      removeEye: true,
      add: [
        [EYE_X - 1, EYE_Y, "outline"],
        [EYE_X, EYE_Y, "outline"],
      ],
    };
  }

  switch (mood) {
    case "urgent":
      // Wide alert eye — 2 pixels stacked.
      return { removeEye: false, add: [[EYE_X, EYE_Y - 1, "eye"]] };
    case "focused":
      // Concentrated narrow eye.
      return { removeEye: true, add: [[EYE_X, EYE_Y, "eye"], [EYE_X - 1, EYE_Y, "eye"]] };
    case "celebrating":
      // Closed-smile eye ^_^
      return {
        removeEye: true,
        add: [
          [EYE_X - 1, EYE_Y + 1, "eye"],
          [EYE_X, EYE_Y, "eye"],
        ],
      };
    case "proud":
      // Smug closed eye.
      return {
        removeEye: true,
        add: [
          [EYE_X - 1, EYE_Y, "eye"],
          [EYE_X, EYE_Y - 1, "eye"],
        ],
      };
    case "chilling":
      // Half-closed eye — bottom half only.
      return {
        removeEye: true,
        add: [[EYE_X, EYE_Y + 1, "eye"]],
      };
    case "sleepy":
      // Closed sleeping eye — small horizontal dash.
      return {
        removeEye: true,
        add: [
          [EYE_X - 1, EYE_Y + 1, "eye"],
          [EYE_X, EYE_Y + 1, "eye"],
        ],
      };
    case "worried":
      // Squinted small eye.
      return { removeEye: true, add: [[EYE_X, EYE_Y, "eye"]] };
    case "disappointed":
      // Closed sad eye — slumped one row down.
      return {
        removeEye: true,
        add: [
          [EYE_X - 1, EYE_Y + 1, "eye"],
          [EYE_X, EYE_Y + 1, "eye"],
        ],
      };
    default:
      // nudging — default open eye, no changes.
      return { removeEye: false, add: [] };
  }
}

// --- Particle layer (zzz, sparkle, sweat) ---------------------------------

function ParticleLayer({ mood }: { mood: MoodId }) {
  const visuals = moodVisuals(mood);
  if (visuals.particle === "none") return null;

  if (visuals.particle === "zzz") {
    return (
      <g style={{ animation: "pet-zzz 2.4s ease-out infinite" }}>
        <rect x={13} y={3} width={1} height={1} fill="var(--pet-outline)" />
        <rect x={14} y={2} width={1} height={1} fill="var(--pet-outline)" />
      </g>
    );
  }

  if (visuals.particle === "sparkle") {
    return (
      <g style={{ animation: "pet-sparkle 1.4s ease-in-out infinite" }}>
        <rect x={2} y={3} width={1} height={1} fill="var(--pet-sparkle)" />
        <rect x={14} y={5} width={1} height={1} fill="var(--pet-sparkle)" />
        <rect x={1} y={9} width={1} height={1} fill="var(--pet-sparkle)" />
        <rect x={15} y={11} width={1} height={1} fill="var(--pet-sparkle)" />
      </g>
    );
  }

  if (visuals.particle === "sweat") {
    return (
      <g>
        <rect x={13} y={5} width={1} height={1} fill="var(--pet-beak)" />
        <rect x={14} y={6} width={1} height={1} fill="var(--pet-beak)" />
      </g>
    );
  }

  return null;
}

// --- Component ------------------------------------------------------------

export type PetSpriteProps = {
  mood: MoodId;
  facing?: "left" | "right";
  walking?: boolean;
  pixelSize?: number;
  className?: string;
};

export function PetSprite({
  mood,
  facing = "right",
  walking = false,
  pixelSize = 4,
  className,
}: PetSpriteProps) {
  // Independent timers: a leg-cycle when walking, and a slow blink.
  const [walkTick, setWalkTick] = useState(false);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!walking) return;
    const interval = window.setInterval(() => setWalkTick((t) => !t), 180);
    return () => window.clearInterval(interval);
  }, [walking]);

  useEffect(() => {
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
  }, []);

  // Pick the frame based on mood + walk state.
  const baseFrame = (() => {
    if (mood === "sleepy") return FRAME_SITTING;
    if (walking) return walkTick ? FRAME_WALK_B : FRAME_WALK_A;
    return FRAME_STANDING;
  })();

  // Eye overlay — replace the default eye pixel for mood variations.
  const overlay = eyeOverlay(mood, blink);
  const composed = baseFrame.filter((p) => {
    if (!overlay.removeEye) return true;
    return !(p[0] === EYE_X && p[1] === EYE_Y && p[2] === "eye");
  });
  const allPixels = [...composed, ...overlay.add];

  const cssVars: React.CSSProperties = {
    // @ts-expect-error CSS custom properties
    "--pet-body": "#f6efe1",
    "--pet-shadow": "#dccfb3",
    "--pet-outline": "#221a14",
    "--pet-comb": "#d94545",
    "--pet-beak": "#e8a01c",
    "--pet-leg": "#c8801a",
    "--pet-sparkle": "hsl(var(--accent))",
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
          {allPixels.map(([x, y, c], i) => (
            <rect
              key={`${i}-${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={COLOR_VAR[c]}
            />
          ))}
          <ParticleLayer mood={mood} />
        </svg>
      </div>
    </div>
  );
}
