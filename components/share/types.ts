export type ShareTemplate = "daily" | "streak" | "level";
export type ShareFormat = "story" | "square" | "wide";

export const FORMAT_DIMENSIONS: Record<ShareFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
  wide: { w: 1200, h: 675 },
};

export type ShareCardData = {
  cfHandle: string;
  cfRating: number | null;
  level: number;
  streakCurrent: number;
  streakLongest: number;
  todayDone: boolean;
  akRate: number;
  totalRounds: number;
  heatmap: { date: string; count: number }[];
  levelBefore?: number;
};
