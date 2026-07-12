"use client";

/**
 * Removable chips showing which review filters are currently active.
 */
import {
  DEFAULT_LANDING_FILTERS,
  type LandingFilters,
  type LandingScopeTab,
} from "@/lib/portfolio/metric-review-landing-selectors";

type Chip = { key: string; label: string; clear: (f: LandingFilters) => LandingFilters };

function buildChips(filters: LandingFilters, tab: LandingScopeTab): Chip[] {
  const chips: Chip[] = [];
  if (filters.search.trim()) {
    chips.push({
      key: "search",
      label: `Search: ${filters.search.trim()}`,
      clear: (f) => ({ ...f, search: "" }),
    });
  }
  if (filters.sector !== "all") {
    chips.push({
      key: "sector",
      label: filters.sector,
      clear: (f) => ({ ...f, sector: "all" }),
    });
  }
  if (filters.period !== "all") {
    chips.push({
      key: "period",
      label: filters.period,
      clear: (f) => ({ ...f, period: "all" }),
    });
  }
  if (filters.status !== "all") {
    chips.push({
      key: "status",
      label: filters.status,
      clear: (f) => ({ ...f, status: "all" }),
    });
  }
  if (filters.confidence !== "all") {
    chips.push({
      key: "confidence",
      label: `${filters.confidence} confidence`,
      clear: (f) => ({ ...f, confidence: "all" }),
    });
  }
  if (filters.priority !== "all") {
    chips.push({
      key: "priority",
      label: `${filters.priority} priority`,
      clear: (f) => ({ ...f, priority: "all" }),
    });
  }
  if (filters.reviewer !== "all") {
    chips.push({
      key: "reviewer",
      label: filters.reviewer === "unassigned" ? "Unassigned" : filters.reviewer,
      clear: (f) => ({ ...f, reviewer: "all" }),
    });
  }
  if (filters.overdueOnly) {
    chips.push({
      key: "overdue",
      label: "Overdue only",
      clear: (f) => ({ ...f, overdueOnly: false }),
    });
  }
  if (filters.extractionFailuresOnly) {
    chips.push({
      key: "extraction",
      label: "Extraction failures",
      clear: (f) => ({ ...f, extractionFailuresOnly: false }),
    });
  }
  if (filters.missingReportOnly) {
    chips.push({
      key: "missing",
      label: "Missing report",
      clear: (f) => ({ ...f, missingReportOnly: false }),
    });
  }
  if (filters.unassignedOnly) {
    chips.push({
      key: "unassigned",
      label: "Unassigned only",
      clear: (f) => ({ ...f, unassignedOnly: false }),
    });
  }
  if (filters.waitlistedOnly) {
    chips.push({
      key: "waitlisted",
      label: "Waitlisted",
      clear: (f) => ({ ...f, waitlistedOnly: false }),
    });
  }
  if (filters.hasRejectedMetrics) {
    chips.push({
      key: "rejected",
      label: "Has rejected metrics",
      clear: (f) => ({ ...f, hasRejectedMetrics: false }),
    });
  }
  if (filters.hasEditedMetrics) {
    chips.push({
      key: "edited",
      label: "Has edited metrics",
      clear: (f) => ({ ...f, hasEditedMetrics: false }),
    });
  }
  if (filters.myQueueOnly && tab !== "assigned") {
    chips.push({
      key: "myQueue",
      label: "My queue only",
      clear: (f) => ({ ...f, myQueueOnly: false }),
    });
  }
  return chips;
}

/** Removable chips for active review landing filters. */
export function ActiveFilterChips({
  filters,
  tab,
  onChange,
}: {
  filters: LandingFilters;
  tab: LandingScopeTab;
  onChange: (next: LandingFilters) => void;
}) {
  const chips = buildChips(filters, tab);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.clear(filters))}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] text-stone-700 hover:border-stone-300"
        >
          {chip.label}
          <span className="text-stone-400" aria-hidden>
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...DEFAULT_LANDING_FILTERS,
            myQueueOnly: tab === "assigned" ? false : filters.myQueueOnly,
          })
        }
        className="text-[11px] font-medium text-[#7a3344] hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
