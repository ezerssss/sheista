"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Zap, Frown, Trophy, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emitTrainingFinished } from "@/lib/pet/events";
import {
  PetSprite,
  type PetAction,
  type PetEffect,
} from "@/components/pet/PetSprite";
import type { MoodId } from "@/lib/pet/types";

const LAB_ACTIONS: PetAction[] = [
  "stand",
  "walk",
  "run",
  "fly",
  "glide",
  "peck",
  "flap",
  "sleep",
];
const LAB_MOODS: MoodId[] = [
  "chilling",
  "nudging",
  "urgent",
  "worried",
  "focused",
  "celebrating",
  "disappointed",
  "proud",
  "sleepy",
  "comeback",
];

// Dev-only stage to QA every sprite action x mood combo in isolation.
function PetLab() {
  const [action, setAction] = useState<PetAction>("stand");
  const [mood, setMood] = useState<MoodId>("chilling");
  const [effect, setEffect] = useState<PetEffect>(null);

  const fire = (kind: "dust" | "feather") =>
    setEffect((e) => ({ kind, key: (e?.key ?? 0) + 1 }));

  return (
    <div className="flex flex-col gap-1.5 border-t border-border pt-2">
      <p className="label-eyebrow">pet lab</p>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as PetAction)}
            className="rounded border border-border bg-background px-1 py-0.5 text-xs"
          >
            {LAB_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value as MoodId)}
            className="rounded border border-border bg-background px-1 py-0.5 text-xs"
          >
            {LAB_MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => fire("dust")}
              className="rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              dust
            </button>
            <button
              type="button"
              onClick={() => fire("feather")}
              className="rounded border border-border px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              feather
            </button>
          </div>
        </div>
        <PetSprite
          mood={mood}
          action={action}
          idle={action === "stand"}
          effect={effect}
          pixelSize={4}
        />
      </div>
    </div>
  );
}

export function PreviewPanel() {
  const [show, setShow] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const dev = process.env.NODE_ENV === "development";
    const param =
      new URLSearchParams(window.location.search).get("dev") === "1";
    setShow(dev || param);
  }, []);

  if (!show) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed left-4 top-20 z-50 rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground pet-shadow hover:text-foreground"
      >
        dev
      </button>
    );
  }

  return (
    <div className="fixed left-4 top-20 z-50 flex w-[200px] flex-col gap-1.5 rounded-md border border-border bg-popover p-3 pet-shadow">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">dev preview</p>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="collapse"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        fires training-finished events so you can see the chicken + overlay states.
      </p>
      <div className="grid gap-1.5 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="justify-start text-xs"
          onClick={() =>
            emitTrainingFinished({
              isAk: true,
              performance: 95,
              levelBefore: 41,
              levelAfter: 42,
            })
          }
        >
          <ArrowUp className="h-3 w-3" />
          level up (AK)
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="justify-start text-xs"
          onClick={() =>
            emitTrainingFinished({
              isAk: false,
              performance: 50,
              levelBefore: 42,
              levelAfter: 41,
            })
          }
        >
          <ArrowDown className="h-3 w-3" />
          level down
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="justify-start text-xs"
          onClick={() =>
            emitTrainingFinished({
              isAk: true,
              performance: 88,
              levelBefore: 109,
              levelAfter: 109,
            })
          }
        >
          <Trophy className="h-3 w-3" />
          AK at max level
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="justify-start text-xs"
          onClick={() =>
            emitTrainingFinished({
              isAk: true,
              performance: 99,
              levelBefore: 29,
              levelAfter: 30,
            })
          }
        >
          <Zap className="h-3 w-3" />
          milestone level (30)
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="justify-start text-xs"
          onClick={() =>
            emitTrainingFinished({
              isAk: false,
              performance: 30,
              levelBefore: 1,
              levelAfter: 1,
            })
          }
        >
          <Frown className="h-3 w-3" />
          miss at min level
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="justify-start text-xs"
          onClick={() =>
            emitTrainingFinished({
              kind: "daily",
              isAk: true,
              performance: 0,
              levelBefore: 41,
              levelAfter: 41,
            })
          }
        >
          <Timer className="h-3 w-3" />
          daily bite finished
        </Button>
      </div>
      <PetLab />
    </div>
  );
}
