"use client";

import type { ReportingProgress } from "@/lib/portfolio/overview-selectors";

export function ReportingProgressCard({ progress }: { progress: ReportingProgress }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h2 className="text-sm font-semibold text-stone-900">Reporting progress</h2>
      <p className="mt-1 text-xs text-stone-500">{progress.cycle.label}</p>
      <p className="mt-0.5 text-[10px] text-stone-400">{progress.cycle.rangeLabel}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tabular-nums text-stone-900">
          {progress.totalExpected > 0 ? `${progress.completionPct}%` : "—"}
        </p>
        <p className="text-right text-xs text-stone-500">
          {progress.totalExpected > 0 ? (
            <>
              <span className="font-semibold text-stone-700">{progress.submittedCount}</span> of{" "}
              {progress.totalExpected} companies submitted
            </>
          ) : (
            "No companies monitored"
          )}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-[#63202e] transition-all"
          style={{ width: `${Math.min(100, progress.completionPct)}%` }}
        />
      </div>
    </section>
  );
}
