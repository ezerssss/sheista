"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Zap, Frown, Trophy, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emitTrainingFinished } from "@/lib/pet/events";

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
    </div>
  );
}
