/** Final readiness verdict badge (ready, blocked, or needs work). */

import type { AnalysisResult } from "@/lib/types";
import { hasMaterialConflicts } from "@/lib/export-lock";

/** Renders the readiness verdict UI. */
export function ReadinessVerdict({
  analysis,
  analysisPending = false,
}: {
  analysis: AnalysisResult;
  analysisPending?: boolean;
}) {
  if (analysisPending) {
    return (
      <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          Ready for committee review?
        </p>
        <p className="mt-2 text-xl font-semibold text-stone-700">Awaiting analysis</p>
        <p className="mt-2 text-sm text-stone-500">
          Readiness score and blockers appear after you run cross-source analysis on the synced
          documents.
        </p>
      </section>
    );
  }

  const materialConflicts = hasMaterialConflicts(analysis);
  const committeeReady = analysis.readinessScore >= 7 && !materialConflicts;
  const verdict = committeeReady ? "Ready for committee" : "Not committee-ready yet";

  return (
    <section
      className={`rounded-2xl border p-6 ${
        committeeReady
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Ready for committee review?
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {analysis.readinessScore}/10 — {verdict}
          </p>
          {materialConflicts && (
            <p className="mt-2 text-sm text-amber-900">
              Committee recommendation is locked. You can still request more research or stop
              pursuing the deal.
            </p>
          )}
          {!committeeReady && analysis.verdictBlockers.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">What's holding it up</p>
              <ul className="mt-2 space-y-1.5">
                {analysis.verdictBlockers.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-stone-700">
                    <span className="text-amber-600">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <ExportLockBadge committeeReady={committeeReady} materialConflicts={materialConflicts} />
      </div>
    </section>
  );
}

function ExportLockBadge({
  committeeReady,
  materialConflicts,
}: {
  committeeReady: boolean;
  materialConflicts: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-4 py-3 ring-1 ${
        committeeReady ? "bg-emerald-50 ring-emerald-200" : "bg-amber-50 ring-amber-200"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        Committee package
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          committeeReady ? "text-emerald-800" : "text-amber-900"
        }`}
      >
        {committeeReady ? "Available after recommendation" : materialConflicts ? "Locked" : "Not yet"}
      </p>
      <p className="mt-0.5 text-xs text-stone-600">
        {committeeReady
          ? "Recommend to committee to download the IC package."
          : materialConflicts
            ? "Other decisions remain available in the sidebar."
            : "Resolve remaining gaps before committee export."}
      </p>
    </div>
  );
}
