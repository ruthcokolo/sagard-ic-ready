/** API route: `/api/auth/login` — authenticate and issue a session cookie. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findAccount, getSessionFromRequest, serializeSession } from "@/lib/auth-session";
import { REGISTRY_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-constants";

/**
 * POST: receives `{ email, password }`. Returns `{ user }` and sets a session cookie,
 * or `{ error }` with 400/401 if login fails.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const registry = request.cookies.get(REGISTRY_COOKIE)?.value;
  const user = findAccount(email, password, registry);

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, serializeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

/** GET: returns `{ user }` for the current session, or `{ user: null }` with 401. */
export async function GET(request: NextRequest) {
  const user = getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
