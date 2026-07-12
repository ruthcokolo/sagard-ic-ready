"use client";

import {
  countActiveQueueFilters,
  queueFilterSummaryChips,
} from "@/lib/portfolio/metric-review-url-state";
import type { ReviewQueueFilters } from "@/lib/portfolio/metric-review-selectors";

export function QueueFilterSummary({
  filters,
  onExpand,
}: {
  filters: ReviewQueueFilters;
  onExpand: () => void;
}) {
  const count = countActiveQueueFilters(filters);
  const chips = queueFilterSummaryChips(filters);
  const shown = chips.slice(0, 2);
  const extra = chips.length - shown.length;

  return (
    <button
      type="button"
      onClick={onExpand}
      className="flex w-full flex-col gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left hover:bg-stone-100"
      aria-label="Expand queue filters"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-stone-700">
          Queue filters · {count} active
        </span>
      </div>
      {shown.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {shown.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] text-stone-600"
            >
              {chip}
            </span>
          ))}
          {extra > 0 ? (
            <span className="text-[10px] font-medium text-stone-400">+{extra} more</span>
          ) : null}
        </div>
      ) : (
        <span className="text-[10px] text-stone-400">No active filters</span>
      )}
    </button>
  );
}
