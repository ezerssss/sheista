"use client";

import useSWR from "swr";
import { useEffect } from "react";
import type { PetStatePayload } from "@/lib/pet/types";
import { onTrainingFinished } from "@/lib/pet/events";

const fetcher = async (url: string): Promise<PetStatePayload> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`pet state ${res.status}`);
  return res.json();
};

export function usePetState() {
  const { data, error, isLoading, mutate } = useSWR<PetStatePayload>(
    "/api/pet/state",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
      shouldRetryOnError: false,
    },
  );

  // Refresh immediately when a training finishes — don't wait for the next 60s tick.
  useEffect(() => {
    return onTrainingFinished(() => {
      void mutate();
    });
  }, [mutate]);

  return {
    state: data,
    error: error as Error | undefined,
    isLoading,
    refresh: mutate,
  };
}
