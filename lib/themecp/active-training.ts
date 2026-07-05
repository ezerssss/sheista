import type { TrainingProblem } from "@/types/themecp";

export const TRAINING_KEY = "sheista:active-training";

export type ActiveTraining = {
  id: string;
  level: number;
  startTime: number;
  endTime: number;
  problems: TrainingProblem[];
  tagFilter: string[];
};

export function newRoundId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getActiveTraining(): ActiveTraining | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TRAINING_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as ActiveTraining;
    if (t.endTime <= Date.now()) {
      localStorage.removeItem(TRAINING_KEY);
      return null;
    }
    if (!t.id) {
      t.id = newRoundId();
      localStorage.setItem(TRAINING_KEY, JSON.stringify(t));
    }
    return t;
  } catch {
    return null;
  }
}

export function setActiveTraining(t: ActiveTraining): void {
  localStorage.setItem(TRAINING_KEY, JSON.stringify(t));
}

export function clearActiveTraining(): void {
  localStorage.removeItem(TRAINING_KEY);
}

// ---------------------------------------------------------------------------
// Daily bite — a single ~15-minute problem. Deliberately a separate
// localStorage record so every getActiveTraining() consumer (RoundRoom,
// SmartCTA resume, pet "focused" mood) is untouched.

export const DAILY_KEY = "sheista:active-daily";

export type ActiveDaily = {
  id: string;
  problem: TrainingProblem;
  source: "upsolve" | "weak-tag" | "random";
  startTime: number;
  // The 15-minute mark. Soft: passing it changes copy, never expires the bite.
  softEndTime: number;
};

export function getActiveDaily(): ActiveDaily | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as ActiveDaily;
    // A bite only expires when the calendar day it was started on has passed
    // (browser clock — TimezoneSync keeps it aligned with the profile zone).
    const started = new Date(d.startTime);
    const now = new Date();
    const sameDay =
      started.getFullYear() === now.getFullYear() &&
      started.getMonth() === now.getMonth() &&
      started.getDate() === now.getDate();
    if (!sameDay) {
      localStorage.removeItem(DAILY_KEY);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function setActiveDaily(d: ActiveDaily): void {
  localStorage.setItem(DAILY_KEY, JSON.stringify(d));
}

export function clearActiveDaily(): void {
  localStorage.removeItem(DAILY_KEY);
}
