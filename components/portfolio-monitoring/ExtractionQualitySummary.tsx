"use client";

/**
 * Summary stats for overall extraction quality across the portfolio.
 */
import type { getExtractionQualitySummary } from "@/lib/portfolio/selectors";

/** High-level extraction quality numbers for the portfolio. */
export function ExtractionQualitySummary({
  summary,
}: {
  summary: ReturnType<typeof getExtractionQualitySummary>;
}) {
  const items = [
    { label: "Total metrics extracted", value: summary.totalExtracted },
    { label: "Approved for reporting", value: summary.approvedForReporting },
    { label: "Needs validation", value: summary.needsValidation },
    { label: "Missing from report", value: summary.missingFromReport },
    { label: "Coverage", value: `${summary.coveragePercent}%` },
  ];

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">Extraction quality</h2>
      <p className="mt-1 text-xs text-stone-500">
        Coverage measures how many expected metrics were found in the uploaded reports.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-stone-50/80 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              {item.label}
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-stone-900">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
