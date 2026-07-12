"use client";

/**
 * Tab view showing recent activity for a single company.
 */
import {
  CompanyProfileEmptyState,
  SectionCard,
  formatShortDate,
} from "@/components/portfolio-monitoring/company-profile/shared";
import type { CompanyActivityEvent } from "@/lib/portfolio/company-profile-selectors";

/** Activity history tab on the company profile. */
export function CompanyActivityView({ events }: { events: CompanyActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <CompanyProfileEmptyState title="No company activity yet" />
    );
  }

  return (
    <SectionCard title="Activity" helper="Audit-friendly chronology from real portfolio events">
      <ol className="space-y-0">
        {events.map((e) => (
          <li
            key={e.id}
            className="relative border-l border-stone-200 py-3 pl-4 first:pt-0"
          >
            <span className="absolute -left-1 top-4 h-2 w-2 rounded-full bg-[#7a3344]" />
            <p className="text-xs text-stone-400">
              {formatShortDate(e.timestamp)}
              <span className="mx-1">·</span>
              {new Date(e.timestamp).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-0.5 text-sm font-medium text-stone-900">{e.event}</p>
            <p className="text-xs text-stone-500">
              {e.actor} · {e.context}
            </p>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
