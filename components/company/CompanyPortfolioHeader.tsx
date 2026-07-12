"use client";

/** Company header with back nav, run-analysis action, and readiness badges. */

import Link from "next/link";
import type { PipelineDeal } from "@/lib/deal-types";
import type { AnalysisResult } from "@/lib/types";
import { IconClock } from "@/components/ui/Icons";

/** Top-of-page header for company diligence with status and actions. */
export function CompanyPortfolioHeader({
  deal,
  analysis,
  analysisPending,
  running,
  backHref,
  backLabel,
  onRunAnalysis,
}: {
  deal: PipelineDeal;
  analysis: AnalysisResult;
  analysisPending: boolean;
  running: boolean;
  backHref: string;
  backLabel: string;
  onRunAnalysis: () => void;
}) {
  const score = analysisPending ? 0 : analysis.readinessScore;
  const filledSegments = Math.round((score / 10) * 5);

  return (
    <header className="border-b border-stone-200/60 bg-white px-8 py-5">
      <Link
        href={backHref}
        className="text-[13px] font-medium text-stone-500 hover:text-[#7a3344]"
      >
        ← {backLabel}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[2.25rem] leading-none text-stone-900">{deal.name}</h1>
            {analysisPending && !running && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
                <IconClock className="h-3.5 w-3.5" />
                Awaiting analysis
              </span>
            )}
            {running && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf2f4] px-3 py-1 text-[11px] font-semibold text-[#7a3344] ring-1 ring-[#7a3344]/20">
                Analysis running…
              </span>
            )}
            {!analysisPending && !running && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                Analysis complete
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Readiness
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-8 rounded-sm ${
                    i < filledSegments ? "bg-[#7a3344]" : "bg-stone-200"
                  }`}
                />
              ))}
            </div>
            {!analysisPending && (
              <span className="text-xs font-semibold tabular-nums text-stone-600">
                {analysis.readinessScore}/10
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={running}
          className="inline-flex shrink-0 items-center rounded-xl bg-[#7a3344] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_-2px_rgba(107,45,60,0.4)] hover:bg-[#5a2533] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Running analysis…" : analysisPending ? "Run analysis" : "Re-run analysis"}
        </button>
      </div>
    </header>
  );
}
