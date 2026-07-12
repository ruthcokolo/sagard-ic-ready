"use client";

/**
 * Shared badges, icons, and row styles used across metric review components.
 */
import type { ConfidenceLevel } from "@/lib/portfolio/types";
import { getDisplayMetricStatus } from "@/lib/portfolio/metric-review-selectors";
import type { ExtractedMetric } from "@/lib/portfolio/types";

/** Status badge styled for the metric review table. */
export function MetricReviewStatusBadge({ metric }: { metric: ExtractedMetric }) {
  const status = getDisplayMetricStatus(metric);
  const styles: Record<string, string> = {
    "Needs validation": "bg-amber-50 text-amber-800 ring-amber-100",
    "Edited — needs approval": "bg-orange-50 text-orange-800 ring-orange-100",
    "Approved for reporting": "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Rejected: "bg-red-50 text-red-700 ring-red-100",
    "Missing from report": "bg-stone-100 text-stone-600 ring-stone-200",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${styles[status] ?? "bg-stone-100 text-stone-600"}`}
    >
      {status}
    </span>
  );
}

/** Small pill showing extraction confidence level. */
export function ConfidencePill({
  confidence,
  showTooltip = false,
}: {
  confidence: ConfidenceLevel;
  showTooltip?: boolean;
}) {
  const styles = {
    High: "bg-emerald-50 text-emerald-700",
    Medium: "bg-sky-50 text-sky-700",
    Low: "bg-amber-50 text-amber-800",
  };
  return (
    <span
      title={
        showTooltip
          ? "Confidence reflects extraction clarity, not whether the reported business result is correct."
          : undefined
      }
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[confidence]}`}
    >
      {confidence}
    </span>
  );
}

const METRIC_ICONS: Record<string, string> = {
  Revenue: "$",
  ARR: "↗",
  EBITDA: "Σ",
  Cash: "◉",
  Headcount: "👥",
  Churn: "%",
};

/** Icon representing a metric type by name. */
export function MetricIcon({ name }: { name: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[11px] font-semibold text-stone-600">
      {METRIC_ICONS[name] ?? "•"}
    </span>
  );
}

/** CSS classes for highlighting selected or resolved review rows. */
export function rowStateClass(metric: ExtractedMetric, selected: boolean): string {
  if (selected) {
    return "bg-[#fdf2f4] shadow-[inset_3px_0_0_0_#7a3344]";
  }
  if (metric.status === "Approved for reporting") return "bg-emerald-50/40";
  if (metric.status === "Rejected") return "bg-red-50/30";
  if (metric.status === "Missing from report") return "bg-stone-50/80";
  return "hover:bg-stone-50/60";
}
