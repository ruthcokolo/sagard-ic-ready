"use client";

/** Radio list of IC decision options with export lock messaging. */

import type { AnalysisResult, Decision } from "@/lib/types";
import { canRecommendToCommittee } from "@/lib/export-lock";
import { decisionOptions, exportCopy } from "@/lib/plain-copy";
import { IconLock } from "@/components/ui/Icons";

/** Proceed / more diligence / pass options gated by conflict and sign-off state. */
export function DecisionOptionsList({
  analysis,
  analysisPending,
  decision,
  proceedAnyway,
  onDecisionChange,
  onProceedAnywayChange,
}: {
  analysis: AnalysisResult;
  analysisPending: boolean;
  decision: Decision;
  proceedAnyway: boolean;
  onDecisionChange: (d: Decision) => void;
  onProceedAnywayChange: (v: boolean) => void;
}) {
  const locked = analysisPending;
  const proceedLocked = !analysisPending && !canRecommendToCommittee(analysis);
  const showProceedWarning =
    !analysisPending &&
    !proceedLocked &&
    decision === "proceed" &&
    analysis.readinessScore < 7;

  const options = [
    {
      value: "proceed" as const,
      label: decisionOptions.proceed.label,
      sub: decisionOptions.proceed.sub,
      disabled: locked || proceedLocked,
      lockReason: proceedLocked ? exportCopy.recommendationLocked : null,
    },
    {
      value: "more_diligence" as const,
      label: decisionOptions.more_diligence.label,
      sub: decisionOptions.more_diligence.sub,
      disabled: locked,
      lockReason: null,
    },
    {
      value: "pass" as const,
      label: decisionOptions.pass.label,
      sub: decisionOptions.pass.sub,
      disabled: locked,
      lockReason: null,
    },
  ];

  return (
    <>
      <div className={`space-y-2 ${locked ? "pointer-events-none opacity-45" : ""}`}>
        {options.map(({ value, label, sub, disabled, lockReason }) => {
          const selected = decision === value;
          const isProceedLocked = value === "proceed" && proceedLocked;

          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onDecisionChange(value)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-[#7a3344] bg-[#fdf2f4]"
                  : disabled
                    ? "cursor-not-allowed border-stone-200 bg-stone-50/80 opacity-70"
                    : "border-stone-200 bg-stone-50/50 hover:border-stone-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{label}</p>
                  <p className="text-xs text-stone-500">{sub}</p>
                </div>
                {isProceedLocked && (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                    <IconLock className="h-3 w-3" />
                    Locked
                  </span>
                )}
              </div>
              {isProceedLocked && lockReason && (
                <p className="mt-2 text-[11px] leading-relaxed text-amber-900">{lockReason}</p>
              )}
            </button>
          );
        })}
      </div>

      {proceedLocked && !locked && (
        <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
          {exportCopy.recommendationLocked}
        </p>
      )}

      {showProceedWarning && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            Ready score is only {analysis.readinessScore}/10.
          </p>
          <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={proceedAnyway}
              onChange={(e) => onProceedAnywayChange(e.target.checked)}
              className="mt-1"
            />
            Recommend anyway?
          </label>
        </div>
      )}
    </>
  );
}
