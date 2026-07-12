"use client";

import type { CompanyReviewStatus } from "@/lib/portfolio/types";

export function ReviewProgressCell({
  reviewedCount,
  totalMetrics,
  progressPercent,
  status,
}: {
  reviewedCount: number;
  totalMetrics: number;
  progressPercent: number;
  status: CompanyReviewStatus;
}) {
  if (status === "Extraction failed" || status === "Awaiting report" || totalMetrics === 0) {
    return <span className="text-sm text-stone-400">—</span>;
  }

  const barColor =
    progressPercent >= 100
      ? "bg-emerald-500"
      : status === "Needs attention"
        ? "bg-red-400"
        : "bg-sky-500";

  return (
    <div className="min-w-[110px]">
      <p className="text-[12px] text-stone-800">
        {reviewedCount} of {totalMetrics} reviewed
      </p>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-stone-500">
          {progressPercent}%
        </span>
      </div>
    </div>
  );
}
