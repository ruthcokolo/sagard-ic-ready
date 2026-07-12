"use client";

import {
  DEFAULT_REVIEW_FILTERS,
  type NavigatorSort,
  type ReviewQueueFilters,
  type ReviewQueueQuickView,
} from "@/lib/portfolio/metric-review-selectors";
import { countActiveQueueFilters } from "@/lib/portfolio/metric-review-url-state";
import { QueueFilterSummary } from "./QueueFilterSummary";

const selectClass =
  "h-8 w-full rounded-lg border border-stone-200 bg-white px-2 text-[11px] text-stone-700 outline-none focus:border-[#7a3344]/40";

type Chip = { key: string; label: string; clear: Partial<ReviewQueueFilters> };

const QUICK_VIEW_CHIP_LABELS: Partial<Record<ReviewQueueQuickView, string>> = {
  "in-review": "In review",
  blocked: "Blocked",
  completed: "Completed",
};

function buildRemovableChips(filters: ReviewQueueFilters): Chip[] {
  const chips: Chip[] = [];
  if (filters.search.trim()) {
    chips.push({ key: "search", label: `“${filters.search.trim()}”`, clear: { search: "" } });
  }
  if (filters.period !== "all") {
    chips.push({ key: "period", label: filters.period, clear: { period: "all" } });
  }
  if (filters.confidence !== "all") {
    chips.push({
      key: "confidence",
      label: `${filters.confidence} confidence`,
      clear: { confidence: "all" },
    });
  }
  if (filters.sector !== "all") {
    chips.push({ key: "sector", label: filters.sector, clear: { sector: "all" } });
  }
  if (filters.status !== "all") {
    chips.push({ key: "status", label: filters.status, clear: { status: "all" } });
  }
  if (filters.reviewer !== "all") {
    chips.push({
      key: "reviewer",
      label: filters.reviewer === "unassigned" ? "Unassigned" : filters.reviewer,
      clear: { reviewer: "all" },
    });
  }
  if (filters.overdueOnly) {
    chips.push({ key: "overdue", label: "Overdue only", clear: { overdueOnly: false } });
  }
  if (filters.extractionFailuresOnly) {
    chips.push({
      key: "failures",
      label: "Extraction failures",
      clear: { extractionFailuresOnly: false },
    });
  }
  const quickView = filters.quickView ?? "all";
  if (quickView !== "all" && QUICK_VIEW_CHIP_LABELS[quickView]) {
    chips.push({
      key: "quickView",
      label: QUICK_VIEW_CHIP_LABELS[quickView]!,
      clear: { quickView: "all" },
    });
  }
  return chips;
}

export function QueueFiltersAccordion({
  expanded,
  onExpandedChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  periods,
  reviewers,
  sectors,
  quickViewCounts,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  filters: ReviewQueueFilters;
  onFiltersChange: (filters: ReviewQueueFilters) => void;
  sort: NavigatorSort;
  onSortChange: (sort: NavigatorSort) => void;
  periods: string[];
  reviewers: string[];
  sectors: string[];
  quickViewCounts: Record<ReviewQueueQuickView, number>;
}) {
  const regionId = "queue-filters-panel";
  const activeCount = countActiveQueueFilters(filters);
  const chips = buildRemovableChips(filters);

  const quickViews: { id: ReviewQueueQuickView; label: string }[] = [
    { id: "all", label: "All" },
    { id: "in-review", label: "In review" },
    { id: "blocked", label: "Blocked" },
    { id: "completed", label: "Completed" },
  ];

  const clearAll = () => {
    onFiltersChange({ ...DEFAULT_REVIEW_FILTERS });
  };

  return (
    <div className="border-b border-stone-100">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          Queue filters
        </p>
        <div className="flex items-center gap-2">
          {expanded && activeCount > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] font-semibold text-[#7a3344] hover:underline"
            >
              Clear all
            </button>
          ) : null}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={regionId}
            aria-label={expanded ? "Collapse queue filters" : "Expand queue filters"}
            onClick={() => onExpandedChange(!expanded)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {!expanded ? (
        <div className="px-3 pb-2.5">
          <QueueFilterSummary
            filters={filters}
            onExpand={() => onExpandedChange(true)}
          />
        </div>
      ) : (
        <div id={regionId} role="region" aria-label="Queue filters" className="space-y-2 px-3 pb-3">
          {chips.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 rounded-full border border-[#7a3344]/15 bg-[#fdf2f4] px-2 py-0.5 text-[10px] font-semibold text-[#7a3344]"
                >
                  {chip.label}
                  {Object.keys(chip.clear).length > 0 ? (
                    <button
                      type="button"
                      aria-label={`Remove ${chip.label}`}
                      onClick={() => onFiltersChange({ ...filters, ...chip.clear })}
                      className="rounded-full text-[#7a3344]/70 hover:text-[#7a3344]"
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}

          <input
            type="search"
            placeholder="Search companies, packages, or metrics"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="h-8 w-full rounded-lg border border-stone-200 px-2.5 text-[11px] outline-none focus:border-[#7a3344]/40"
          />

          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={filters.sector}
              onChange={(e) => onFiltersChange({ ...filters, sector: e.target.value })}
              className={selectClass}
              aria-label="Sector"
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
              onChange={(e) => onFiltersChange({ ...filters, period: e.target.value })}
              className={selectClass}
              aria-label="Reporting period"
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
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
              className={selectClass}
              aria-label="Status"
            >
              <option value="all">All statuses</option>
              <option value="Needs validation">Needs validation</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
            <select
              value={filters.confidence}
              onChange={(e) => onFiltersChange({ ...filters, confidence: e.target.value })}
              className={selectClass}
              aria-label="Confidence"
            >
              <option value="all">All confidence</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <select
            value={filters.reviewer}
            onChange={(e) => onFiltersChange({ ...filters, reviewer: e.target.value })}
            className={selectClass}
            aria-label="Assignee"
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {reviewers.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] text-stone-700">
              <input
                type="checkbox"
                checked={filters.overdueOnly}
                onChange={(e) =>
                  onFiltersChange({ ...filters, overdueOnly: e.target.checked })
                }
              />
              Overdue only
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-stone-700">
              <input
                type="checkbox"
                checked={filters.extractionFailuresOnly}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    extractionFailuresOnly: e.target.checked,
                  })
                }
              />
              Extraction failures
            </label>
          </div>

          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as NavigatorSort)}
            className={selectClass}
            aria-label="Sort queue"
          >
            <option value="priority">Sort: Queue priority</option>
            <option value="companyName">Sort: Company name</option>
            <option value="mostUnresolved">Sort: Most unresolved</option>
            <option value="oldestUnresolved">Sort: Oldest unresolved</option>
            <option value="recentlyProcessed">Sort: Recently processed</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto border-t border-stone-100 px-1">
        <div className="flex min-w-max gap-0.5" role="tablist" aria-label="Queue quick views">
          {quickViews.map((view) => {
            const active = (filters.quickView ?? "all") === view.id;
            const count = quickViewCounts[view.id] ?? 0;
            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFiltersChange({ ...filters, quickView: view.id })}
                className={`whitespace-nowrap px-2.5 py-2 text-[11px] font-semibold transition ${
                  active
                    ? "border-b-2 border-[#7a3344] text-[#7a3344]"
                    : "border-b-2 border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                {view.label}{" "}
                <span className="tabular-nums font-medium opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
