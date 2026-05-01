"use client";

import useSWR from "swr";
import type { CodeforcesProblem } from "@/types/themecp";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Failed");
  return json;
};

export function useAllProblems() {
  const { data, error, isLoading } = useSWR<{ ok: true; problems: CodeforcesProblem[] }>(
    "/api/cf/problems",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600_000 },
  );
  return {
    problems: data?.problems ?? [],
    isLoading,
    error: error as Error | undefined,
  };
}

export function useSolvedProblems(handle: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<{ ok: true; problems: CodeforcesProblem[] }>(
    handle ? `/api/cf/submissions/${encodeURIComponent(handle)}?mode=solved` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
  return {
    solved: data?.problems ?? [],
    isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  };
}
