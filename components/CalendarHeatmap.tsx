"use client";

import HeatMap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

type DayValue = { date: string; count: number };

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function CalendarHeatmap({
  values,
  startDate,
  endDate,
  todayKey,
}: {
  values: DayValue[];
  startDate: Date;
  endDate: Date;
  /**
   * Server-computed YYYY-MM-DD in the user's timezone. Without it we fall
   * back to the browser clock, which can disagree with the server buckets.
   */
  todayKey?: string;
}) {
  const today = todayKey ?? fmt(new Date());

  const valuesWithToday = values.some((v) => v.date === today)
    ? values
    : [...values, { date: today, count: 0 }];

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="min-w-[640px] pb-[2px] pt-[1px]">
        <HeatMap
          startDate={startDate}
          endDate={endDate}
          values={valuesWithToday}
          gutterSize={2}
          showWeekdayLabels={false}
          classForValue={(v) => {
            let cls: string;
            if (!v || v.count === 0) cls = "color-empty";
            else if (v.count >= 4) cls = "color-scale-4";
            else if (v.count === 3) cls = "color-scale-3";
            else if (v.count === 2) cls = "color-scale-2";
            else cls = "color-scale-1";
            if ((v as DayValue | undefined)?.date === today) cls += " color-today";
            return cls;
          }}
          titleForValue={(v) => {
            if (!v || v.count === 0) {
              return (v as DayValue | undefined)?.date === today
                ? "today — no practice yet"
                : "no practice";
            }
            const suffix = (v as DayValue).date === today ? " · today" : "";
            return `${(v as DayValue).date}: ${v.count} problem${v.count === 1 ? "" : "s"}${suffix}`;
          }}
        />
      </div>
    </div>
  );
}
