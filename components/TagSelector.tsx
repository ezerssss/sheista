"use client";

import { allTags } from "@/lib/themecp/tags";
import { cn } from "@/lib/utils";

export function TagSelector({
  selected,
  onToggle,
  onClear,
  onRandom,
}: {
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  onRandom: () => void;
}) {
  const tags = allTags();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">Theme</p>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onRandom}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Random
          </button>
          <span className="text-border">·</span>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => {
          const on = selected.includes(t.value);
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onToggle(t.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground",
              )}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
