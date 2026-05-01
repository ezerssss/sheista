"use client";

import HeatMap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

type DayValue = { date: string; count: number };

export function CalendarHeatmap({
  values,
  startDate,
  endDate,
}: {
  values: DayValue[];
  startDate: Date;
  endDate: Date;
}) {
  return (
    <HeatMap
      startDate={startDate}
      endDate={endDate}
      values={values}
      classForValue={(v) => {
        if (!v || v.count === 0) return "color-empty";
        if (v.count >= 4) return "color-scale-4";
        if (v.count === 3) return "color-scale-3";
        if (v.count === 2) return "color-scale-2";
        return "color-scale-1";
      }}
      titleForValue={(v) =>
        !v || v.count === 0 ? "no training" : `${v.date}: ${v.count} round${v.count === 1 ? "" : "s"}`
      }
      showWeekdayLabels
    />
  );
}
