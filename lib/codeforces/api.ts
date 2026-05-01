import { EXCLUDED_CONTEST_IDS, MIN_CONTEST_ID } from "./excluded-contests";
import type {
  CodeforcesProblem,
  CodeforcesSubmission,
  CodeforcesUser,
} from "@/types/themecp";

const BASE = "https://codeforces.com/api";

type CFResponse<T> = { status: "OK"; result: T } | { status: "FAILED"; comment: string };

async function call<T>(url: string, init?: RequestInit & { revalidate?: number }): Promise<T> {
  const { revalidate, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    next: revalidate !== undefined ? { revalidate } : undefined,
    headers: { Accept: "application/json", ...(rest.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Codeforces API HTTP ${res.status}`);
  const json = (await res.json()) as CFResponse<T>;
  if (json.status !== "OK") throw new Error(`Codeforces API: ${json.comment}`);
  return json.result;
}

/**
 * Returns the full problemset (rated problems with rating set), filtered to
 * contestId >= 700 and excluding Kotlin / Q# / April Fools rounds.
 *
 * Note: the CF response is ~3MB, which exceeds Next.js's 2MB fetch cache limit,
 * so we intentionally don't pass `next: { revalidate }` here. The /api/cf/problems
 * route handler has `export const revalidate = 3600`, so its JSON response is
 * cached at the route level instead.
 */
export async function fetchAllProblems(): Promise<CodeforcesProblem[]> {
  const data = await call<{ problems: CodeforcesProblem[] }>(`${BASE}/problemset.problems`);
  return data.problems
    .filter((p) => typeof p.rating === "number")
    .filter((p) => p.contestId >= MIN_CONTEST_ID && !EXCLUDED_CONTEST_IDS.has(p.contestId));
}

export async function fetchUser(handle: string): Promise<CodeforcesUser | null> {
  try {
    const result = await call<CodeforcesUser[]>(
      `${BASE}/user.info?handles=${encodeURIComponent(handle)}`,
      { revalidate: 60 },
    );
    return result[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Recent submissions, newest first. CF default is all submissions; we cap with
 * `count` to keep payloads small. For auto-detect-AK during a round, 50 is plenty.
 */
export async function fetchSubmissions(
  handle: string,
  opts?: { from?: number; count?: number },
): Promise<CodeforcesSubmission[]> {
  const from = opts?.from ?? 1;
  const count = opts?.count ?? 100;
  return call<CodeforcesSubmission[]>(
    `${BASE}/user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`,
    { revalidate: 15 },
  );
}

/**
 * All OK submissions for a handle, returning the unique problem set the user
 * has solved. CF returns at most 10000 per call, so we paginate by `from`.
 */
export async function fetchSolvedProblems(handle: string): Promise<CodeforcesProblem[]> {
  const subs = await call<CodeforcesSubmission[]>(
    `${BASE}/user.status?handle=${encodeURIComponent(handle)}`,
    { revalidate: 60 },
  );
  const seen = new Set<string>();
  const out: CodeforcesProblem[] = [];
  for (const s of subs) {
    if (s.verdict !== "OK") continue;
    const key = `${s.problem.contestId}_${s.problem.index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s.problem);
  }
  return out;
}
