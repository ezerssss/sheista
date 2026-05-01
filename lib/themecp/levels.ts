import levelData from "@/public/data/level.json";
import type { Level } from "@/types/themecp";

const LEVELS = levelData as Level[];
export const MIN_LEVEL = 1;
export const MAX_LEVEL = LEVELS.length;

export function allLevels(): Level[] {
  return LEVELS;
}

export function getLevel(levelNumber: number): Level {
  if (levelNumber < MIN_LEVEL) return LEVELS[0];
  if (levelNumber > MAX_LEVEL) return LEVELS[MAX_LEVEL - 1];
  return LEVELS.find((l) => Number(l.level) === levelNumber) ?? LEVELS[0];
}

export function getLevelByRating(rating: number | null | undefined): Level {
  if (!rating) return LEVELS[0];
  const found = [...LEVELS].reverse().find((l) => rating >= Number(l.Performance));
  return found ?? LEVELS[0];
}

export function clampLevel(n: number): number {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n));
}

export function ratingsOfLevel(level: Level): [number, number, number, number] {
  return [Number(level.P1), Number(level.P2), Number(level.P3), Number(level.P4)];
}
