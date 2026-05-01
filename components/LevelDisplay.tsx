import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLevel, ratingsOfLevel } from "@/lib/themecp/levels";

export function LevelDisplay({ level, hideRatings = false }: { level: number; hideRatings?: boolean }) {
  const l = getLevel(level);
  const ratings = ratingsOfLevel(l);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Current level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">{l.level}</span>
          <span className="text-sm text-muted-foreground">target rating {l.Performance}</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {ratings.map((r, i) => (
            <Badge key={i} variant="outline" className="justify-center py-1">
              <span className="mr-1 text-muted-foreground">P{i + 1}</span>
              <span className={hideRatings ? "blur-sm select-none" : ""}>{r}</span>
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">round duration {l.time} minutes</p>
      </CardContent>
    </Card>
  );
}
