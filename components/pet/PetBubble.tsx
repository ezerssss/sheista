"use client";

import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type BubbleAction =
  | null
  | { kind: "share"; template: "daily" | "streak" | "level"; onShare: () => void };

export function PetBubble({
  text,
  action,
  className,
}: {
  text: string;
  action?: BubbleAction;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative w-max max-w-[360px] rounded-md border border-border bg-popover px-4 py-2.5 text-sm leading-snug text-popover-foreground pet-shadow",
        className,
      )}
      style={{ animation: "bubble-in 220ms ease-out" }}
    >
      <p className="font-mono lowercase tracking-tight">{text}</p>
      {action && action.kind === "share" && (
        <button
          type="button"
          onClick={action.onShare}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent/80"
        >
          <Share2 className="h-3 w-3" />
          share this
        </button>
      )}
      {/* Tail pointing down to the chicken below */}
      <span
        aria-hidden
        className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-r border-b border-border bg-popover"
      />
    </div>
  );
}
