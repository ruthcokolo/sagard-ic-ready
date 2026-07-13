"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import {
  ACTIVITY_TYPE_LABELS,
  ActivityIcon,
  formatActivityTime,
} from "@/components/portfolio-monitoring/overview/activity-shared";
import {
  getRecentActivity,
  type ActivityEvent,
  type ActivityEventType,
} from "@/lib/portfolio/overview-selectors";

const TYPE_FILTERS: { id: "all" | ActivityEventType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "uploaded", label: "Uploaded" },
  { id: "completed", label: "Processed" },
  { id: "approved", label: "Approved" },
  { id: "failed", label: "Failed" },
  { id: "processing", label: "Processing" },
  { id: "export", label: "Exports" },
  { id: "overdue", label: "Overdue" },
];

export function RecentActivityView() {
  const { state, hydrated } = usePortfolio();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<"all" | ActivityEventType>("all");

  const events = useMemo(
    () =>
      getRecentActivity(state, 500, {
        currentUserName: user?.name?.trim() || undefined,
      }),
    [state, user?.name]
  );
  const filtered = useMemo(
    () => (typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter)),
    [events, typeFilter]
  );

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <header className="border-b border-stone-200/80 bg-[#faf9f7] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400">
              Portfolio
            </p>
            <h1 className="mt-1 font-display text-3xl text-[#63202e]">Recent activity</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-stone-500">
              Uploads, processing, approvals, exports, and overdue reports across the portfolio.
            </p>
          </div>
          <Link
            href="/dashboard/portfolio"
            className="text-sm font-semibold text-[#7a3344] hover:underline"
          >
            ← Back to overview
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((filter) => {
            const count =
              filter.id === "all"
                ? events.length
                : events.filter((e) => e.type === filter.id).length;
            if (filter.id !== "all" && count === 0) return null;
            const active = typeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setTypeFilter(filter.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                  active
                    ? "bg-[#63202e] text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                }`}
              >
                {filter.label}
                <span className={active ? "text-white/70" : "text-stone-400"}>{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {!hydrated ? (
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-16 text-center text-sm text-stone-500">
            Loading activity…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 bg-white px-4 py-16 text-center">
            <p className="text-sm font-semibold text-stone-800">No activity yet</p>
            <p className="mt-1 text-xs text-stone-500">
              Activity will appear after packages are uploaded and reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section
                key={group.label}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <div className="border-b border-stone-100 bg-[#faf9f7] px-4 py-2.5">
                  <h2 className="text-[12px] font-semibold uppercase tracking-wide text-stone-500">
                    {group.label}
                  </h2>
                </div>
                <ul className="divide-y divide-stone-100">
                  {group.events.map((event) => (
                    <li key={event.id} className="flex min-w-0 gap-3 px-4 py-3.5">
                      <ActivityIcon type={event.type} />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="text-[11px] text-stone-400">
                            {formatActivityTime(event.timestamp)}
                          </p>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                            {ACTIVITY_TYPE_LABELS[event.type]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-stone-800">{event.description}</p>
                        {event.context ? (
                          <p className="mt-0.5 truncate text-[11px] text-stone-400" title={event.context}>
                            {event.context}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDay(events: ActivityEvent[]) {
  const groups: { label: string; events: ActivityEvent[] }[] = [];
  const map = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const key = dayKey(event.timestamp);
    const list = map.get(key) ?? [];
    list.push(event);
    map.set(key, list);
  }

  for (const [key, list] of map) {
    groups.push({ label: dayLabel(key), events: list });
  }
  return groups;
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(key: string) {
  const [y, m, day] = key.split("-").map(Number);
  const date = new Date(y, m, day);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
