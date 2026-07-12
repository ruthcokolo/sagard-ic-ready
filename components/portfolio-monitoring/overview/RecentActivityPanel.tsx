"use client";

import Link from "next/link";
import type { ActivityEvent } from "@/lib/portfolio/overview-selectors";
import { ActivityIcon, formatActivityTime } from "./activity-shared";

const RECENT_ACTIVITY_PREVIEW_LIMIT = 3;
export const RECENT_ACTIVITY_HREF = "/dashboard/portfolio/activity";

export function RecentActivityPanel({ events }: { events: ActivityEvent[] }) {
  const visible = events.slice(0, RECENT_ACTIVITY_PREVIEW_LIMIT);
  const remaining = events.length - visible.length;

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-900">Recent activity</h2>
        {events.length > RECENT_ACTIVITY_PREVIEW_LIMIT ? (
          <Link
            href={RECENT_ACTIVITY_HREF}
            className="shrink-0 text-xs font-semibold text-[#7a3344] hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-8 text-center">
          <p className="text-xs text-stone-500">Activity will appear after packages are uploaded.</p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-stone-100">
          {visible.map((event) => (
            <li key={event.id} className="flex min-w-0 gap-3 px-4 py-3.5">
              <ActivityIcon type={event.type} />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[11px] text-stone-400">{formatActivityTime(event.timestamp)}</p>
                <p
                  className="mt-0.5 line-clamp-2 break-words text-sm text-stone-800"
                  title={event.description}
                >
                  {event.description}
                </p>
              </div>
            </li>
          ))}
          {/* Fills remaining height so the card bottom aligns with Portfolio health */}
          <li aria-hidden className="min-h-0 flex-1" />
        </ul>
      )}

      {remaining > 0 ? (
        <p className="shrink-0 border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
          + {remaining} more update{remaining === 1 ? "" : "s"}
        </p>
      ) : null}
    </section>
  );
}
