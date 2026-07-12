"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { userInitials } from "@/lib/auth-session";

export function ProductModeSwitch({
  mode,
  label,
}: {
  mode: "diligence" | "portfolio";
  label?: string;
}) {
  const href = mode === "portfolio" ? "/dashboard" : "/dashboard/portfolio";
  const defaultLabel =
    mode === "portfolio" ? "Switch to IC Diligence" : "Switch to Portfolio Monitoring";
  const displayLabel = label ?? defaultLabel;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-700 shadow-sm transition hover:border-[#7a3344]/30 hover:bg-[#fdf2f4]"
    >
      <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      {displayLabel}
    </Link>
  );
}

function NotificationBell({ count = 3 }: { count?: number }) {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm hover:bg-stone-50"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

export function AssociateProfileChip() {
  const { user } = useAuth();
  const name = user?.name ?? "Alex Rivera";
  const role = user ? (ROLE_LABELS[user.role] ?? user.role) : "Associate";
  const initials = user ? userInitials(user.name) : "AR";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#7a3344] to-[#5a2533] text-xs font-bold text-white">
        {initials}
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold leading-tight text-stone-900">{name}</p>
        <p className="truncate text-xs text-stone-500">{role}</p>
      </div>
    </div>
  );
}

export function ModeHeaderActions({ mode }: { mode: "diligence" | "portfolio" }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
      <ProductModeSwitch mode={mode} />
      <NotificationBell />
      <AssociateProfileChip />
    </div>
  );
}

export function DateRangeFilter() {
  return (
    <select className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm focus:border-[#7a3344] focus:outline-none focus:ring-1 focus:ring-[#7a3344]/20">
      <option>Last 30 days</option>
      <option>Last 90 days</option>
      <option>Year to date</option>
    </select>
  );
}
