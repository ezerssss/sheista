"use client";

import { useEffect, useState } from "react";

export function CountdownTimer({
  startTime,
  endTime,
  onExpire,
}: {
  startTime: number;
  endTime: number;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (now >= endTime) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now >= endTime]);

  if (now < startTime) {
    const sec = Math.max(0, Math.ceil((startTime - now) / 1000));
    return (
      <div className="inline-flex items-baseline gap-2">
        <span className="label-eyebrow">starts in</span>
        <span className="font-mono text-2xl font-light tabular-nums">{sec}s</span>
      </div>
    );
  }

  const remaining = Math.max(0, endTime - now);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  const txt = hh > 0
    ? `${hh}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${mm}:${String(s).padStart(2, "0")}`;

  return (
    <div className="inline-flex items-baseline gap-2">
      <span className="label-eyebrow">remaining</span>
      <span className="font-mono text-3xl font-light tabular-nums tracking-tightest">{txt}</span>
    </div>
  );
}
