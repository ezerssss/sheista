// Hand-maintained types for the Supabase schema in supabase/migrations/0001_init.sql.
// Replace with `npx supabase gen types typescript` output if you want full fidelity.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfileRow = {
  id: string;
  cf_handle: string | null;
  cf_rating: number | null;
  cf_avatar: string | null;
  level: number;
  timezone: string;
  updated_at: string;
};
type TrainingRow = {
  id: string;
  user_id: string;
  client_round_id: string | null;
  level_at_start: number;
  level_at_end: number;
  is_ak: boolean;
  performance: number;
  tag_filter: string[];
  started_at: string;
  ends_at: string;
  finished_at: string;
};
type TrainingProblemRow = {
  training_id: string;
  slot: number;
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number;
  tags: string[];
  solved_at: string | null;
};
type DailySolveRow = {
  user_id: string;
  day_key: string;
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number | null;
  tags: string[];
  source: "upsolve" | "weak-tag" | "random";
  started_at: string;
  solved_at: string;
  created_at: string;
};
type UpsolveRow = {
  user_id: string;
  contest_id: number;
  problem_index: string;
  problem_name: string;
  rating: number | null;
  tags: string[];
  added_at: string;
  solved_at: string | null;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          cf_handle?: string | null;
          cf_rating?: number | null;
          cf_avatar?: string | null;
          level?: number;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cf_handle?: string | null;
          cf_rating?: number | null;
          cf_avatar?: string | null;
          level?: number;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trainings: {
        Row: TrainingRow;
        Insert: {
          id?: string;
          user_id: string;
          client_round_id?: string | null;
          level_at_start: number;
          level_at_end: number;
          is_ak: boolean;
          performance: number;
          tag_filter?: string[];
          started_at: string;
          ends_at: string;
          finished_at?: string;
        };
        Update: Partial<TrainingRow>;
        Relationships: [];
      };
      training_problems: {
        Row: TrainingProblemRow;
        Insert: {
          training_id: string;
          slot: number;
          contest_id: number;
          problem_index: string;
          problem_name?: string;
          rating: number;
          tags?: string[];
          solved_at?: string | null;
        };
        Update: Partial<TrainingProblemRow>;
        Relationships: [];
      };
      daily_solves: {
        Row: DailySolveRow;
        Insert: {
          user_id: string;
          day_key: string;
          contest_id: number;
          problem_index: string;
          problem_name?: string;
          rating?: number | null;
          tags?: string[];
          source?: "upsolve" | "weak-tag" | "random";
          started_at: string;
          solved_at: string;
          created_at?: string;
        };
        Update: Partial<DailySolveRow>;
        Relationships: [];
      };
      upsolve_problems: {
        Row: UpsolveRow;
        Insert: {
          user_id: string;
          contest_id: number;
          problem_index: string;
          problem_name?: string;
          rating?: number | null;
          tags?: string[];
          added_at?: string;
          solved_at?: string | null;
        };
        Update: Partial<UpsolveRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
