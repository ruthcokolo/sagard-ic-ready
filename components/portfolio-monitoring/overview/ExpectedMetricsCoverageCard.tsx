"use client";

import Link from "next/link";
import type { ExpectedMetricCoverageRow } from "@/lib/portfolio/overview-selectors";

export function ExpectedMetricsCoverageCard({ rows }: { rows: ExpectedMetricCoverageRow[] }) {
  const hasData = rows.some((r) => r.expectedCount > 0);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">Expected metrics coverage</h2>
        <Link
          href="/dashboard/portfolio/metrics-explorer"
          className="text-xs font-semibold text-[#7a3344] hover:underline"
        >
          View all metrics →
        </Link>
      </div>

      {!hasData ? (
        <p className="mt-4 text-xs text-stone-500">— No submitted reports in the active cycle.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.metricName}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-stone-700">{row.metricName}</span>
                <span className="tabular-nums text-stone-500">
                  {row.presentCount} / {row.expectedCount}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[#7a3344]/70"
                  style={{ width: `${Math.min(100, row.percent)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
