import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";

const PUBLIC_PREFIXES = ["/login", "/onboarding", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const session = getSessionFromRequest(request);

  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!session.onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublic) {
    if (session?.onboardingComplete && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (session && pathname === "/login") {
      const dest = session.onboardingComplete ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", request.url);
    if (pathname !== "/login") {
      login.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(login);
  }

  if (!session.onboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
