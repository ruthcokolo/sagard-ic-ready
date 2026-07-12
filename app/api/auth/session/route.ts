/** API route: `/api/auth/session` — read the current authenticated user. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";

/** GET: reads the session cookie and returns `{ user }`, or `{ user: null }` with 401. */
export async function GET(request: NextRequest) {
  const user = getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
