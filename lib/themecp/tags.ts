import tagData from "@/public/data/tag.json";
import type { Tag } from "@/types/themecp";

const TAGS = tagData as Tag[];

export function allTags(): Tag[] {
  return TAGS;
}

export function tagByValue(value: string): Tag | undefined {
  return TAGS.find((t) => t.value === value);
}
