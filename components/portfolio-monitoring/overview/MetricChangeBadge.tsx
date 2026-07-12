"use client";

/**
 * Small badges showing metric value changes and coverage bars for overview cards.
 */
import type { MetricChange } from "@/lib/portfolio/metric-comparison";

/** Badge showing if a metric went up, down, or stayed flat. */
export function MetricChangeBadge({ change }: { change: MetricChange }) {
  const styles =
    change.direction === "up"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : change.direction === "down"
        ? "bg-red-50 text-red-700 ring-red-100"
        : "bg-stone-100 text-stone-600 ring-stone-200";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${styles}`}>
      {change.label} {change.display}
    </span>
  );
}

/** Thin coverage progress bar used on overview cards. */
export function OverviewCoverageBar({ value }: { value: number }) {
  const color =
    value >= 85 ? "bg-emerald-500" : value >= 70 ? "bg-amber-500" : value > 0 ? "bg-red-400" : "bg-stone-200";

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-stone-700">{value}%</span>
      <div className="h-1.5 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
