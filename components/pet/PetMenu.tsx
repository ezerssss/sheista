"use client";

import { EyeOff, VolumeX, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PetMenu({
  muted,
  onToggleMute,
  onHide,
  className,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onHide: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-[150px] rounded-md border border-border bg-popover p-1 pet-shadow",
        className,
      )}
      style={{ animation: "bubble-in 180ms ease-out" }}
    >
      <button
        type="button"
        onClick={onToggleMute}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-foreground/[0.04]"
      >
        {muted ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        {muted ? "unmute" : "mute bubbles"}
      </button>
      <button
        type="button"
        onClick={onHide}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-foreground/[0.04]"
      >
        <EyeOff className="h-3 w-3" />
        hide for session
      </button>
    </div>
  );
}
