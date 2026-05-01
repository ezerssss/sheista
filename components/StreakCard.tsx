import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";

export function StreakCard({
  current,
  longest,
  todayDone,
}: {
  current: number;
  longest: number;
  todayDone: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Streak</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame className={`h-6 w-6 ${current > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              <span className="text-3xl font-bold">{current}</span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {todayDone ? "today complete" : current > 0 ? "do today before midnight" : "start one today"}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" /> longest
            </div>
            <div className="text-xl font-semibold">{longest}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
