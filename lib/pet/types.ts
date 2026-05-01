export type AuthedPetState = {
  cf_handle: string;
  cf_rating: number | null;
  level: number;
  streak: { current: number; longest: number; todayDone: boolean };
  totalRounds: number;
  akRate: number;
  avgRecentPerf: number;
  lastFinishedAt: string | null;
  gateBlocked: boolean;
  recentHeatmap: { date: string; count: number }[];
};

export type PetStatePayload =
  | { authenticated: false }
  | ({ authenticated: true } & AuthedPetState);

export type MoodId =
  | "celebrating"
  | "disappointed"
  | "focused"
  | "urgent"
  | "worried"
  | "nudging"
  | "proud"
  | "chilling"
  | "sleepy";
