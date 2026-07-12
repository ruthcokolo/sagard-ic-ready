/** API route: `/api/auth/register` — create or update demo accounts. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AccountRecord, ICReadyUser, IntegrationState, UserRole } from "@/lib/auth-types";
import {
  serializeRegistry,
  serializeSession,
  upsertRegistryAccount,
} from "@/lib/auth-session";
import { REGISTRY_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-constants";

function isRole(value: unknown): value is UserRole {
  return value === "associate" || value === "principal" || value === "partner";
}

function parseIntegrations(value: unknown): IntegrationState {
  const v = value as Partial<IntegrationState> | undefined;
  return {
    sheets: Boolean(v?.sheets),
    n8n: Boolean(v?.n8n),
    claude: Boolean(v?.claude),
  };
}

/**
 * POST: receives `{ name, email, password, role?, integrations?, complete? }`.
 * Creates the account, returns `{ user }`, and sets session + registry cookies.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = isRole(body?.role) ? body.role : "associate";
  const integrations = parseIntegrations(body?.integrations);
  const complete = Boolean(body?.complete);

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const user: ICReadyUser = {
    id: `user-${email.replace(/[^a-z0-9]/g, "-")}`,
    email,
    name,
    role,
    onboardingComplete: complete,
    integrations,
  };

  const registryCookie = request.cookies.get(REGISTRY_COOKIE)?.value;
  const record: AccountRecord = { email, password, user };
  const registry = upsertRegistryAccount(registryCookie, record);

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, serializeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  response.cookies.set(REGISTRY_COOKIE, serializeRegistry(registry), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}

/**
 * PATCH: receives `{ email, password, integrations?, complete? }`.
 * Updates an existing account and returns `{ user }`, or `{ error }` if not found.
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const integrations = body?.integrations ? parseIntegrations(body.integrations) : undefined;
  const complete = typeof body?.complete === "boolean" ? body.complete : undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const registryCookie = request.cookies.get(REGISTRY_COOKIE)?.value;
  const { findAccount } = await import("@/lib/auth-session");
  const existing = findAccount(email, password, registryCookie);

  if (!existing) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const user: ICReadyUser = {
    ...existing,
    integrations: integrations ?? existing.integrations,
    onboardingComplete: complete ?? existing.onboardingComplete,
  };

  const record: AccountRecord = { email, password, user };
  const registry = upsertRegistryAccount(registryCookie, record);

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, serializeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  response.cookies.set(REGISTRY_COOKIE, serializeRegistry(registry), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
