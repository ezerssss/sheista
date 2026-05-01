"use client";

import { allTags } from "@/lib/themecp/tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Theme</span>
        <Button variant="ghost" size="sm" onClick={onRandom}>
          Random
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear (no theme)
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => {
          const on = selected.includes(t.value);
          return (
            <button key={t.value} onClick={() => onToggle(t.value)} type="button">
              <Badge variant={on ? "default" : "outline"} className="cursor-pointer">
                {t.name}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
