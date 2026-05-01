export type Level = {
  id: number;
  level: string;
  time: string;
  Performance: string;
  P1: string;
  P2: string;
  P3: string;
  P4: string;
};

export type Tag = { name: string; value: string };

export type CodeforcesProblem = {
  contestId: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
};

export type CodeforcesSubmission = {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  problem: CodeforcesProblem;
  verdict?: string;
};

export type CodeforcesUser = {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  avatar?: string;
  titlePhoto?: string;
};

export type TrainingProblem = {
  contestId: number;
  index: string;
  name: string;
  rating: number;
  tags: string[];
  url: string;
  solvedAt: number | null;
  slot: 1 | 2 | 3 | 4;
};

export type TrainingRecord = {
  id: string;
  level_at_start: number;
  level_at_end: number;
  is_ak: boolean;
  performance: number;
  tag_filter: string[];
  started_at: string;
  ends_at: string;
  finished_at: string;
  problems: {
    slot: number;
    contest_id: number;
    problem_index: string;
    rating: number;
    tags: string[];
    solved_at: string | null;
  }[];
};
