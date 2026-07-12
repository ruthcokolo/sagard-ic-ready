"use client";

/**
 * Small reusable UI pieces shared across portfolio screens (badges, empty states, bars).
 */
import type { ExtractedMetric, MetricStatus } from "@/lib/portfolio/types";

/** Colored pill showing where a metric stands (approved, needs review, missing, etc.). */
export function MetricStatusBadge({ status }: { status: MetricStatus }) {
  const styles: Record<MetricStatus, string> = {
    "Approved for reporting": "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
    "Needs validation": "bg-amber-50 text-amber-800 ring-amber-200/80",
    "Missing from report": "bg-stone-100 text-stone-600 ring-stone-200/80",
    Rejected: "bg-red-50 text-red-700 ring-red-200/80",
    "Not applicable": "bg-sky-50 text-sky-800 ring-sky-100",
    "Not configured": "bg-stone-50 text-stone-500 ring-stone-200/80",
    "Optional metric not reported": "bg-stone-50 text-stone-500 ring-stone-200/80",
    "Needs clarification": "bg-amber-50 text-amber-800 ring-amber-100",
    "Extraction failed": "bg-red-50 text-red-700 ring-red-100",
    "Conflicting values found": "bg-orange-50 text-orange-800 ring-orange-100",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/** Colored pill showing how sure the system is about an extracted value. */
export function ConfidenceBadge({ confidence }: { confidence: ExtractedMetric["confidence"] }) {
  const styles = {
    High: "bg-emerald-50 text-emerald-700",
    Medium: "bg-amber-50 text-amber-800",
    Low: "bg-red-50 text-red-700",
  }[confidence];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}>
      {confidence}
    </span>
  );
}

/** Centered message shown when a list or section has nothing to display. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-stone-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Horizontal bar showing what percent of expected metrics were found. */
export function CoverageBar({ value }: { value: number }) {
  const barColor =
    value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-stone-500">{value}%</span>
    </div>
  );
}
