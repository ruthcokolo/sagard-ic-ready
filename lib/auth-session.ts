/**
 * Cookie-based session helpers: encode/decode user payloads,
 * merge demo accounts with self-registered users, and parse requests.
 */

import type { NextRequest } from "next/server";
import type { AccountRecord, ICReadyUser, SessionPayload } from "./auth-types";
import { DEMO_ACCOUNTS, REGISTRY_COOKIE, SESSION_COOKIE } from "./auth-constants";

/** Turns an object into a base64url string for storing in a cookie. */
function encode(data: unknown): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

/** Reads a base64url cookie value back into an object; returns null if corrupted. */
function decode<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Decodes the session cookie into a user payload, or null if invalid. */
export function parseSessionCookie(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const session = decode<SessionPayload>(value);
  if (!session?.id || !session.email || !session.name) return null;
  return session;
}

/** Base64url-encodes a user object for the session cookie. */
export function serializeSession(user: ICReadyUser): string {
  return encode(user);
}

/** Reads and validates the session from an incoming Next.js request. */
export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  return parseSessionCookie(request.cookies.get(SESSION_COOKIE)?.value);
}

/** Decodes self-registered accounts from the registry cookie. */
export function parseRegistryCookie(value: string | undefined): AccountRecord[] {
  if (!value) return [];
  const records = decode<AccountRecord[]>(value);
  if (!Array.isArray(records)) return [];
  return records.filter((r) => r.email && r.password && r.user?.id);
}

/** Encodes the account registry for the registry cookie. */
export function serializeRegistry(records: AccountRecord[]): string {
  return encode(records);
}

/** Merges demo accounts with user-registered accounts (registered wins on email clash). */
export function getAllAccounts(registryCookie: string | undefined): AccountRecord[] {
  const registered = parseRegistryCookie(registryCookie);
  const byEmail = new Map<string, AccountRecord>();

  for (const account of DEMO_ACCOUNTS) {
    byEmail.set(account.email.toLowerCase(), account);
  }
  for (const account of registered) {
    byEmail.set(account.email.toLowerCase(), account);
  }

  return Array.from(byEmail.values());
}

/** Authenticates email/password against demo and registered accounts. */
export function findAccount(
  email: string,
  password: string,
  registryCookie: string | undefined,
): ICReadyUser | null {
  const normalized = email.trim().toLowerCase();
  const match = getAllAccounts(registryCookie).find(
    (a) => a.email.toLowerCase() === normalized && a.password === password,
  );
  return match?.user ?? null;
}

/** Adds or replaces a registered account in the registry list. */
export function upsertRegistryAccount(
  registryCookie: string | undefined,
  record: AccountRecord,
): AccountRecord[] {
  const existing = parseRegistryCookie(registryCookie).filter(
    (a) => a.email.toLowerCase() !== record.email.toLowerCase(),
  );
  return [...existing, record];
}

/** Two-letter initials from a display name for avatar badges. */
export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** First token of a full name for greeting copy. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
