/** API route: `/api/auth/logout` — clear the session cookie. */
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

/** POST: no body needed. Clears the session cookie and returns `{ ok: true }`. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
