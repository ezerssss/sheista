import tagData from "@/public/data/tag.json";
import type { Tag } from "@/types/themecp";

const TAGS = tagData as Tag[];

export function allTags(): Tag[] {
  return TAGS;
}

export function tagByValue(value: string): Tag | undefined {
  return TAGS.find((t) => t.value === value);
}

export function pickWeightedRandomTag(): Tag {
  const total = TAGS.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TAGS) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return TAGS[TAGS.length - 1];
}
