"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { firstName } from "@/lib/auth-session";

export function ProductModeSwitch({ mode }: { mode: "diligence" | "portfolio" }) {
  const href = mode === "portfolio" ? "/dashboard" : "/dashboard/portfolio";
  const label = mode === "portfolio" ? "Switch to IC Diligence" : "Switch to Portfolio Monitoring";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13px] font-semibold text-stone-700 transition hover:border-[#7a3344]/30 hover:bg-[#fdf2f4]"
    >
      <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      {label}
    </Link>
  );
}

export function PortfolioGreetingHeader() {
  const { user } = useAuth();
  const greeting = user ? firstName(user.name) : "Alex";

  return (
    <header className="border-b border-stone-200/60 bg-white px-8 py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.75rem] leading-none text-stone-900">
            Good morning {greeting},
          </h1>
          <p className="mt-2 text-[15px] text-stone-500">
            Here&apos;s what needs your attention today.
          </p>
        </div>
        <div className="pt-1">
          <ProductModeSwitch mode="portfolio" />
        </div>
      </div>
    </header>
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
