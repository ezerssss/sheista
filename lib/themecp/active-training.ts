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
