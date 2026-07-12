"use client";

/** Dropdown menu for account info, settings link, and sign out. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { userInitials } from "@/lib/auth-session";
import { useAuth } from "@/components/auth/AuthProvider";

/** Renders the user menu UI. */
export function UserMenu() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const displayName = user?.name ?? "Alex Rivera";
  const displayEmail = user?.email ?? "alex.rivera@sagard.com";
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : ROLE_LABELS.associate;
  const initials = userInitials(displayName);
  const setupPending =
    user &&
    (!user.integrations.sheets || !user.integrations.n8n || !user.integrations.claude);

  const handleSignOut = async () => {
    setOpen(false);
    await logout();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl p-2">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-stone-100" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-stone-50"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
          <p className="truncate text-xs text-stone-500">{roleLabel}</p>
        </div>
        <span className={`shrink-0 text-stone-400 transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">{displayName}</p>
            <p className="truncate text-xs text-stone-500">{displayEmail}</p>
          </div>

          {setupPending && (
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-50"
            >
              Complete setup →
            </Link>
          )}

          {user && (
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Settings
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
