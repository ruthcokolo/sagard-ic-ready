"use client";

/**
 * Side drawer showing evidence details for a metric in the explorer.
 */
import type { ExtractedMetric } from "@/lib/portfolio/types";

/** Drawer showing PDF evidence for a metric value. */
export function MetricEvidenceDrawer({
  metric,
  onClose,
}: {
  metric: ExtractedMetric;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-drawer-title"
    >
      <div className="max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <h3 id="evidence-drawer-title" className="text-lg font-semibold text-stone-900">
          {metric.metricName} — source evidence
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          {metric.companyName} · {metric.reportPeriod}
        </p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Source file</dt>
            <dd className="font-mono text-xs text-blue-600">{metric.sourceFile}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Page</dt>
            <dd>{metric.sourcePage || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Extracted value</dt>
            <dd className="font-semibold tabular-nums">{metric.extractedValue || "Missing from report"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-stone-400">Evidence</dt>
            <dd className="mt-1 rounded-lg bg-stone-50 p-3 text-stone-700">{metric.evidenceText}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
