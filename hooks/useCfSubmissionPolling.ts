"use client";

import { useCallback, useEffect, useState } from "react";
import type { CodeforcesSubmission } from "@/types/themecp";

type Options = {
  count?: number;
  intervalMs?: number;
  enabled?: boolean;
};

/**
 * Polls /api/cf/submissions/[handle] on an interval. Unlike the old inline
 * poll this surfaces fetch failures via `error` (cleared on the next success)
 * so rooms can tell the user detection is degraded instead of silently
 * appearing to work.
 */
export function useCfSubmissionPolling(
  handle: string,
  { count = 50, intervalMs = 30_000, enabled = true }: Options = {},
) {
  const [submissions, setSubmissions] = useState<CodeforcesSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/cf/submissions/${encodeURIComponent(handle)}?count=${count}`,
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Codeforces returned an error");
      setSubmissions(json.submissions as CodeforcesSubmission[]);
      setError(null);
    } catch {
      setError("couldn't reach Codeforces — retrying");
    }
  }, [handle, count]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, refresh, intervalMs]);

  return { submissions, error, refresh };
}
