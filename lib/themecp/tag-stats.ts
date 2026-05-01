import type { TrainingRecord } from "@/types/themecp";

export type TagStat = {
  tag: string;
  rounds: number;
  aks: number;
  akRate: number;
  avgPerformance: number;
};

/**
 * Aggregate per-tag mastery from training history.
 *
 * A training contributes to a tag if that tag appears in `tag_filter`. Untagged
 * (themeless) rounds don't count toward any tag — they go in a synthetic
 * "(no theme)" bucket.
 */
export function computeTagStats(trainings: TrainingRecord[]): TagStat[] {
  const buckets = new Map<string, { rounds: number; aks: number; perfSum: number }>();

  for (const t of trainings) {
    const tags = t.tag_filter && t.tag_filter.length > 0 ? t.tag_filter : ["(no theme)"];
    for (const tag of tags) {
      const b = buckets.get(tag) ?? { rounds: 0, aks: 0, perfSum: 0 };
      b.rounds += 1;
      if (t.is_ak) b.aks += 1;
      b.perfSum += t.performance;
      buckets.set(tag, b);
    }
  }

  return [...buckets.entries()]
    .map(([tag, b]) => ({
      tag,
      rounds: b.rounds,
      aks: b.aks,
      akRate: b.rounds === 0 ? 0 : b.aks / b.rounds,
      avgPerformance: b.rounds === 0 ? 0 : Math.round(b.perfSum / b.rounds),
    }))
    .sort((a, b) => b.rounds - a.rounds);
}
