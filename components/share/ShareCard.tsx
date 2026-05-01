"use client";

import { forwardRef } from "react";
import { DailyRecapTemplate } from "@/components/share/templates/DailyRecapTemplate";
import { StreakTemplate } from "@/components/share/templates/StreakTemplate";
import { LevelUpTemplate } from "@/components/share/templates/LevelUpTemplate";
import {
  FORMAT_DIMENSIONS,
  type ShareCardData,
  type ShareFormat,
  type ShareTemplate,
} from "@/components/share/types";

export const ShareCard = forwardRef<
  HTMLDivElement,
  {
    template: ShareTemplate;
    format: ShareFormat;
    data: ShareCardData;
  }
>(function ShareCard({ template, format, data }, ref) {
  const dims = FORMAT_DIMENSIONS[format];
  return (
    <div
      ref={ref}
      style={{
        width: dims.w,
        height: dims.h,
        // Force isolated stacking context + bg in case the host bg leaks
        background: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
      }}
    >
      {template === "daily" && <DailyRecapTemplate data={data} format={format} />}
      {template === "streak" && <StreakTemplate data={data} format={format} />}
      {template === "level" && <LevelUpTemplate data={data} format={format} />}
    </div>
  );
});
