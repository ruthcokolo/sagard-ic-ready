"use client";

/**
 * Breakdown of extraction quality grouped by PDF source format.
 */
import type { ExtractionQualityRow } from "@/lib/portfolio/selectors";

/** Extraction quality broken down by PDF source format. */
export function ExtractionQualityBySourceFormat({
  rows,
}: {
  rows: ExtractionQualityRow[];
}) {
  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">Extraction quality by source format</h2>
      <p className="mt-1 text-xs text-stone-500">
        Compare company-formatted PDFs vs. ICReady template reports. Values update from uploaded packages
        when available.
      </p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.sourceFormat}
            className={`rounded-xl border p-4 ${
              row.sourceFormat === "ICReady template"
                ? "border-emerald-200/80 bg-emerald-50/30"
                : "border-stone-200 bg-stone-50/50"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-stone-900">{row.sourceFormat}</p>
              {row.packageCount > 0 && (
                <span className="text-[11px] text-stone-500">
                  {row.packageCount} package{row.packageCount === 1 ? "" : "s"} processed
                </span>
              )}
            </div>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Coverage
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-stone-900">{row.coverage}%</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Needs validation
                </dt>
                <dd className="text-sm font-semibold text-stone-800">{row.needsValidationLabel}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  Missing metrics
                </dt>
                <dd className="text-sm font-semibold text-stone-800">{row.missingMetricsLabel}</dd>
              </div>
            </dl>
            {row.lowConfidenceCount > 0 && (
              <p className="mt-2 text-[11px] text-amber-700">
                {row.lowConfidenceCount} low-confidence extraction
                {row.lowConfidenceCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
