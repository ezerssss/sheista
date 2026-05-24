import { clampLevel, MAX_LEVEL, MIN_LEVEL } from "@/lib/themecp/levels";

export type TierId =
  | "newbie"
  | "pupil"
  | "specialist"
  | "expert"
  | "cm"
  | "master"
  | "gm"
  | "lgm";

export type Tier = {
  id: TierId;
  name: string;
  shortName: string;
  minLevel: number;
  maxLevel: number;
};

export const TIERS: Tier[] = [
  { id: "newbie",     name: "Newbie",                shortName: "N",   minLevel: 1,  maxLevel: 8 },
  { id: "pupil",      name: "Pupil",                 shortName: "P",   minLevel: 9,  maxLevel: 14 },
  { id: "specialist", name: "Specialist",            shortName: "S",   minLevel: 15, maxLevel: 20 },
  { id: "expert",     name: "Expert",                shortName: "E",   minLevel: 21, maxLevel: 29 },
  { id: "cm",         name: "Candidate Master",      shortName: "CM",  minLevel: 30, maxLevel: 39 },
  { id: "master",     name: "Master",                shortName: "M",   minLevel: 40, maxLevel: 53 },
  { id: "gm",         name: "Grandmaster",           shortName: "GM",  minLevel: 54, maxLevel: 79 },
  { id: "lgm",        name: "Legendary Grandmaster", shortName: "LGM", minLevel: 80, maxLevel: MAX_LEVEL },
];

export function getTierByLevel(level: number): Tier {
  const lv = clampLevel(level);
  return TIERS.find((t) => lv >= t.minLevel && lv <= t.maxLevel) ?? TIERS[0];
}

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIERS.findIndex((t) => t.id === tier.id);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export type TierProgress = {
  tier: Tier;
  next: Tier | null;
  levelsIntoTier: number;
  tierSize: number;
  levelsToNextTier: number;
  pct: number;
};

export function tierProgress(level: number): TierProgress {
  const lv = clampLevel(level);
  const tier = getTierByLevel(lv);
  const next = getNextTier(tier);
  const tierSize = tier.maxLevel - tier.minLevel + 1;
  const levelsIntoTier = lv - tier.minLevel + 1;
  const levelsToNextTier = next ? next.minLevel - lv : 0;
  const pct = tierSize > 0 ? Math.min(1, Math.max(0, levelsIntoTier / tierSize)) : 1;
  return { tier, next, levelsIntoTier, tierSize, levelsToNextTier, pct };
}

export function tierColor(tier: Tier, alpha?: number): string {
  const a = typeof alpha === "number" ? ` / ${alpha}` : "";
  return `hsl(var(--tier-${tier.id})${a})`;
}

export { MAX_LEVEL, MIN_LEVEL };
