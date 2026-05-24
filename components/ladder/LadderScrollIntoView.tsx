"use client";

import { useEffect } from "react";

export function LadderScrollIntoView() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-current="true"]');
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, []);
  return null;
}
