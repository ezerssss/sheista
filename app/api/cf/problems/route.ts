import { NextResponse } from "next/server";
import { fetchAllProblems } from "@/lib/codeforces/api";

export const revalidate = 3600;

export async function GET() {
  try {
    const problems = await fetchAllProblems();
    return NextResponse.json({ ok: true, problems });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
  }
}
