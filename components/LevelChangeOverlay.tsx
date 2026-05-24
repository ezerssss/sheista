"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  onTrainingFinished,
  type TrainingFinishedDetail,
} from "@/lib/pet/events";
import { usePetState } from "@/hooks/usePetState";
import { PetSprite } from "@/components/pet/PetSprite";
import { ShareDialog } from "@/components/share/ShareDialog";
import type { ShareCardData, ShareTemplate } from "@/components/share/types";
import { getTierByLevel, tierColor } from "@/lib/themecp/tiers";

export function LevelChangeOverlay() {
  const { state } = usePetState();
  const [event, setEvent] = useState<TrainingFinishedDetail | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTemplate, setShareTemplate] = useState<ShareTemplate>("level");

  useEffect(() => {
    return onTrainingFinished((detail) => {
      // Only fire overlay when the level actually changed.
      if (detail.levelAfter !== detail.levelBefore) {
        setEvent(detail);
      }
    });
  }, []);

  const close = () => {
    setEvent(null);
    setShareOpen(false);
  };

  const openShare = () => {
    setShareTemplate("level");
    setShareOpen(true);
  };

  if (!event) return null;
  if (!state || state.authenticated === false) return null;

  const isLevelUp = event.levelAfter > event.levelBefore;
  const overlayOpen = !shareOpen; // hide overlay while share dialog is up
  const tierBefore = getTierByLevel(event.levelBefore);
  const tierAfter = getTierByLevel(event.levelAfter);
  const tieredUp = isLevelUp && tierAfter.id !== tierBefore.id;

  const shareData: ShareCardData = {
    cfHandle: state.cf_handle,
    cfRating: state.cf_rating,
    level: event.levelAfter,
    levelBefore: event.levelBefore,
    streakCurrent: state.streak.current,
    streakLongest: state.streak.longest,
    todayDone: state.streak.todayDone,
    akRate: state.akRate,
    totalRounds: state.totalRounds,
    heatmap: state.recentHeatmap,
  };

  return (
    <>
      <Dialog open={overlayOpen} onOpenChange={(v) => !v && close()}>
        <DialogContent
          className={
            isLevelUp
              ? "max-w-lg overflow-hidden border-2 bg-background p-0"
              : "max-w-lg overflow-hidden border border-border bg-background p-0"
          }
          style={
            isLevelUp
              ? {
                  borderColor: tieredUp
                    ? tierColor(tierAfter)
                    : "hsl(var(--accent))",
                  boxShadow: `0 0 60px ${tieredUp ? tierColor(tierAfter, 0.45) : "hsl(var(--accent) / 0.35)"}`,
                  // Solid bg + opaque-stop tint overlay (no transparency at the text area).
                  backgroundColor: "hsl(var(--background))",
                  backgroundImage: `radial-gradient(circle at 30% 0%, ${tieredUp ? tierColor(tierAfter, 0.22) : "hsl(var(--accent) / 0.18)"}, transparent 55%)`,
                }
              : undefined
          }
        >
          <DialogHeader className="sr-only">
            <DialogTitle>
              {isLevelUp ? "You leveled up" : "Level decreased"}
            </DialogTitle>
            <DialogDescription>
              {isLevelUp
                ? "Your level increased after that round."
                : "Your level decreased after that round."}
            </DialogDescription>
          </DialogHeader>

          {isLevelUp ? (
            <LevelUpContent
              event={event}
              tieredUp={tieredUp}
              tierAfterName={tierAfter.name}
              tierAfterId={tierAfter.id}
              onShare={openShare}
              onClose={close}
            />
          ) : (
            <LevelDownContent event={event} onClose={close} />
          )}
        </DialogContent>
      </Dialog>

      <ShareDialog
        open={shareOpen}
        onOpenChange={(v) => {
          setShareOpen(v);
          if (!v) setEvent(null);
        }}
        template={shareTemplate}
        onTemplateChange={setShareTemplate}
        data={shareData}
      />
    </>
  );
}

function LevelUpContent({
  event,
  tieredUp,
  tierAfterName,
  tierAfterId,
  onShare,
  onClose,
}: {
  event: TrainingFinishedDetail;
  tieredUp: boolean;
  tierAfterName: string;
  tierAfterId: string;
  onShare: () => void;
  onClose: () => void;
}) {
  const tierCss = `hsl(var(--tier-${tierAfterId}))`;
  return (
    <div className="flex flex-col items-center gap-6 px-10 py-12 text-center">
      <p
        className="label-eyebrow"
        style={{ color: tieredUp ? tierCss : "hsl(var(--accent))" }}
      >
        {tieredUp ? "tier up" : "level up"}
      </p>
      <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {tieredUp ? (
          <>
            WELCOME TO
            <br />
            <span style={{ color: tierCss }}>{tierAfterName.toUpperCase()}</span>
          </>
        ) : (
          <>
            HEY YOU
            <br />
            LEVELED UP!!!
          </>
        )}
      </h2>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-5xl font-light tabular-nums tracking-tightest text-muted-foreground">
          {event.levelBefore}
        </span>
        <ArrowUp
          className="h-10 w-10"
          strokeWidth={2.5}
          style={{ color: tieredUp ? tierCss : "hsl(var(--accent))" }}
        />
        <span
          className="font-mono text-7xl font-light tabular-nums tracking-tightest"
          style={{ color: tieredUp ? tierCss : "hsl(var(--accent))" }}
        >
          {event.levelAfter}
        </span>
      </div>
      <PetSprite mood="celebrating" pixelSize={6} />
      <p className="text-sm text-muted-foreground">
        {tieredUp ? (
          <>
            new color unlocked.{" "}
            <span style={{ color: tierCss }}>{tierAfterName}</span> from here.
          </>
        ) : (
          <>+1 level. ladder respected.</>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <Button onClick={onShare} variant="accent" size="lg">
          <Share2 className="h-4 w-4" />
          share it
        </Button>
        <Button onClick={onClose} variant="ghost" size="lg">
          nice
        </Button>
      </div>
    </div>
  );
}

function LevelDownContent({
  event,
  onClose,
}: {
  event: TrainingFinishedDetail;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 px-10 py-12 text-center">
      <p className="label-eyebrow">level down</p>
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        that one stung
      </h2>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-7xl font-light tabular-nums tracking-tightest">
          {event.levelBefore}
        </span>
        <ArrowDown
          className="h-10 w-10 text-destructive"
          strokeWidth={2.5}
        />
        <span className="font-mono text-5xl font-light tabular-nums tracking-tightest text-muted-foreground">
          {event.levelAfter}
        </span>
      </div>
      <PetSprite mood="disappointed" pixelSize={6} />
      <p className="max-w-xs text-sm text-muted-foreground">
        into the upsolve pile it goes. one round at a time. we adapt.
      </p>
      <Button onClick={onClose} variant="outline" size="lg">
        back to grind
      </Button>
    </div>
  );
}
