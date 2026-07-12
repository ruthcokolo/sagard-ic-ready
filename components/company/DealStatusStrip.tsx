/** Horizontal strip showing deal stage, owner, and readiness status. */

import type { PipelineDeal } from "@/lib/deal-types";
import type { AnalysisResult } from "@/lib/types";
import type { ExportLockState } from "@/lib/export-lock";
import { hasMaterialConflicts } from "@/lib/export-lock";

/** Renders the deal status strip UI. */
export function DealStatusStrip({
  deal,
  analysis,
  exportState,
  analysisPending = false,
}: {
  deal: PipelineDeal;
  analysis: AnalysisResult;
  exportState: ExportLockState;
  analysisPending?: boolean;
}) {
  const materialConflicts = !analysisPending && hasMaterialConflicts(analysis);
  const committeeReady =
    !analysisPending && analysis.readinessScore >= 7 && !materialConflicts;
  const verdict = analysisPending ? "Not analyzed" : committeeReady ? "Committee-ready" : "In review";
  const openIssues = analysisPending ? 0 : deal.conflictCount;
  const downloadLabel = exportState.canExportCommitteePackage
    ? "IC package ready"
    : materialConflicts
      ? "Recommendation locked"
      : "IC package not ready";

  return (
    <div className="sticky top-0 z-30 mb-6 border-b border-stone-200/80 bg-white/95 px-8 py-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-stone-900">{deal.name}</span>
        <Sep />
        <span className="font-semibold tabular-nums text-stone-800">
          {analysisPending ? "—/10" : `${analysis.readinessScore}/10`} {verdict}
        </span>
        <Sep />
        <span
          className={
            !analysisPending && openIssues > 0 ? "font-semibold text-red-700" : "text-stone-600"
          }
        >
          {analysisPending
            ? "Run analysis"
            : openIssues > 0
              ? `${openIssues} open issue${openIssues > 1 ? "s" : ""}`
              : "No open issues"}
        </span>
        <Sep />
        <span
          className={
            exportState.canExportCommitteePackage
              ? "font-medium text-emerald-700"
              : materialConflicts
                ? "font-medium text-amber-800"
                : "font-medium text-stone-600"
          }
        >
          {downloadLabel}
        </span>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="text-stone-300" aria-hidden>·</span>;
}
