"use client";

/**
 * Filter bar on the metric review landing page.
 */
import { useEffect, useRef, useState } from "react";
import type {
  LandingFilters,
  LandingScopeTab,
  LandingSort,
} from "@/lib/portfolio/metric-review-landing-selectors";

const STATUS_OPTIONS = [
  "Awaiting assignment",
  "In review",
  "Needs attention",
  "Completed",
  "Awaiting report",
  "Extraction failed",
  "Waitlisted",
] as const;

const selectClass =
  "h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-xs text-stone-700 outline-none focus:border-[#7a3344]/40";

/** Search and filter bar on the review landing page. */
export function ReviewFilterBar({
  filters,
  onChange,
  tab,
  sectors,
  periods,
  reviewers,
  sort,
  onSortChange,
}: {
  filters: LandingFilters;
  onChange: (next: LandingFilters) => void;
  tab: LandingScopeTab;
  sectors: string[];
  periods: string[];
  reviewers: string[];
  sort: LandingSort;
  onSortChange: (sort: LandingSort) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const showMyQueue = tab === "all" || tab === "needsAttention";

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search company, package, or metric..."
          className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-8 pr-3 text-xs text-stone-800 outline-none placeholder:text-stone-400 focus:border-[#7a3344]/40"
        />
      </div>

      <select
        value={filters.sector}
        onChange={(e) => onChange({ ...filters, sector: e.target.value })}
        className={selectClass}
      >
        <option value="all">All sectors</option>
        {sectors.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.period}
        onChange={(e) => onChange({ ...filters, period: e.target.value })}
        className={selectClass}
      >
        <option value="all">All periods</option>
        {periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className={selectClass}
      >
        <option value="all">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.confidence}
        onChange={(e) => onChange({ ...filters, confidence: e.target.value })}
        className={selectClass}
      >
        <option value="all">All confidence</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      <div className="relative" ref={moreRef}>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs ${
            moreOpen
              ? "border-[#7a3344]/40 bg-[#fdf2f4] text-[#7a3344]"
              : "border-stone-200 bg-white text-stone-700"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M6 12h12M10 20h4" />
          </svg>
          More filters
        </button>
        {moreOpen ? (
          <div className="absolute right-0 z-20 mt-1 w-72 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
            <div className="space-y-2.5">
              <label className="block text-[11px] font-medium text-stone-500">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => onChange({ ...filters, priority: e.target.value })}
                className={`${selectClass} w-full`}
              >
                <option value="all">All priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
              </select>

              <label className="block text-[11px] font-medium text-stone-500">Reviewer</label>
              <select
                value={filters.reviewer}
                onChange={(e) => onChange({ ...filters, reviewer: e.target.value })}
                className={`${selectClass} w-full`}
              >
                <option value="all">All reviewers</option>
                <option value="unassigned">Unassigned</option>
                {reviewers.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {(
                [
                  ["overdueOnly", "Overdue only"],
                  ["extractionFailuresOnly", "Extraction failures"],
                  ["missingReportOnly", "Missing report"],
                  ["unassignedOnly", "Unassigned only"],
                  ["waitlistedOnly", "Waitlisted"],
                  ["hasRejectedMetrics", "Has rejected metrics"],
                  ["hasEditedMetrics", "Has edited metrics"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={(e) => onChange({ ...filters, [key]: e.target.checked })}
                    className="rounded border-stone-300 text-[#7a3344] focus:ring-[#7a3344]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {showMyQueue ? (
        <label className="ml-auto flex items-center gap-2 text-xs text-stone-600">
          <span>My queue only</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.myQueueOnly}
            onClick={() => onChange({ ...filters, myQueueOnly: !filters.myQueueOnly })}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              filters.myQueueOnly ? "bg-[#7a3344]" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                filters.myQueueOnly ? "left-4" : "left-0.5"
              }`}
            />
          </button>
        </label>
      ) : null}

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as LandingSort)}
        className={`${selectClass} ${showMyQueue ? "" : "ml-auto"}`}
        title="Sort"
      >
        <option value="priority">Sort: Priority</option>
        <option value="dueDate">Sort: Due date</option>
        <option value="companyName">Sort: Company name</option>
        <option value="mostProgress">Sort: Most progress</option>
        <option value="leastProgress">Sort: Least progress</option>
        <option value="recentlyProcessed">Sort: Recently processed</option>
      </select>
    </div>
  );
}
