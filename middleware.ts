import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Only run middleware on routes that actually need a session check / refresh.
// Public pages (/, /about, /auth/*) and CF-cached API routes used to also trigger
// a getUser() round-trip on every navigation for no reason — that was a primary
// cause of slow first-byte times in production.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/training/:path*",
    "/history/:path*",
    "/heatmap/:path*",
    "/tags/:path*",
    "/upsolve/:path*",
    "/round/:path*",
    "/api/profile/:path*",
    "/api/trainings/:path*",
    "/api/upsolve/:path*",
    "/api/pet/:path*",
  ],
};
