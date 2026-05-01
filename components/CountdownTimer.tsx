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
    return <span className="font-mono text-sm">Starts in {sec}s</span>;
  }

  const remaining = Math.max(0, endTime - now);
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  const txt = hh > 0 ? `${hh}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;

  return <span className="font-mono text-2xl tabular-nums">{txt}</span>;
}
