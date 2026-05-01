import { NextResponse } from "next/server";
import { fetchSubmissions, fetchSolvedProblems } from "@/lib/codeforces/api";

export const revalidate = 15;

export async function GET(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "recent";
  try {
    if (mode === "solved") {
      const problems = await fetchSolvedProblems(handle);
      return NextResponse.json({ ok: true, problems });
    }
    const count = Number(url.searchParams.get("count") ?? "50");
    const from = Number(url.searchParams.get("from") ?? "1");
    const submissions = await fetchSubmissions(handle, { from, count });
    return NextResponse.json({ ok: true, submissions });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
