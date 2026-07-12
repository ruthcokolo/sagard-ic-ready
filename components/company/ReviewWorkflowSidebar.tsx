"use client";

import type { AnalysisResult, Decision } from "@/lib/types";
import type { ExportLockState } from "@/lib/export-lock";
import { exportCopy } from "@/lib/plain-copy";
import { DecisionOptionsList } from "@/components/company/DecisionOptionsList";
import { IconCheck, IconLock } from "@/components/ui/Icons";

type StepState = "done" | "active" | "locked";

export function ReviewWorkflowSidebar({
  analysisPending,
  running,
  decision,
  rationale,
  proceedAnyway,
  exportState,
  analysis,
  onDecisionChange,
  onRationaleChange,
  onProceedAnywayChange,
  onExport,
}: {
  analysisPending: boolean;
  running: boolean;
  decision: Decision;
  rationale: string;
  proceedAnyway: boolean;
  exportState: ExportLockState;
  analysis: AnalysisResult;
  onDecisionChange: (d: Decision) => void;
  onRationaleChange: (v: string) => void;
  onProceedAnywayChange: (v: boolean) => void;
  onExport: () => void;
}) {
  const analysisStep: StepState = analysisPending ? (running ? "active" : "active") : "done";
  const decisionStep: StepState = analysisPending ? "locked" : "active";
  const exportStep: StepState =
    exportState.canExportCommitteePackage || (exportState.canSubmit && decision !== "proceed")
      ? "active"
      : "locked";

  const steps: { label: string; sub: string; state: StepState }[] = [
    { label: "Sources synced", sub: "Completed", state: "done" },
    {
      label: "Run cross-source analysis",
      sub: running ? "In progress…" : analysisPending ? "AI is standing by" : "Completed",
      state: analysisStep,
    },
    {
      label: "Record investment decision",
      sub: analysisPending ? "Locked" : decision ? "In progress" : "Awaiting your choice",
      state: decisionStep,
    },
    {
      label: "Submit decision",
      sub: exportState.canSubmit
        ? decision === "proceed"
          ? "Records decision and downloads IC package"
          : "Records decision and updates your queue"
        : "Locked",
      state: exportStep,
    },
  ];

  const locked = analysisPending;

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h2 className="text-sm font-semibold text-stone-900">Review workflow</h2>
        <ol className="mt-4 space-y-0">
          {steps.map((step, i) => (
            <li key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepDot state={step.state} />
                {i < steps.length - 1 && (
                  <span
                    className={`my-1 w-px flex-1 min-h-[1.5rem] ${
                      step.state === "done" ? "bg-emerald-300" : "bg-stone-200"
                    }`}
                  />
                )}
              </div>
              <div className={`pb-4 ${step.state === "locked" ? "opacity-50" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    step.state === "active" ? "text-[#7a3344]" : "text-stone-800"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-stone-500">{step.sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
        <h2 className="text-sm font-semibold text-stone-900">
          Decision{locked ? " (locked until analysis completes)" : ""}
        </h2>
        {!locked && (
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Material conflicts block committee recommendation only. You can request more review or
            stop pursuing the deal at any time.
          </p>
        )}

        <div className="mt-4">
          <DecisionOptionsList
            analysis={analysis}
            analysisPending={analysisPending}
            decision={decision}
            proceedAnyway={proceedAnyway}
            onDecisionChange={onDecisionChange}
            onProceedAnywayChange={onProceedAnywayChange}
          />
        </div>

        <label className={`mt-5 block ${locked ? "opacity-45" : ""}`}>
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Rationale{locked ? " (unavailable)" : ""}
          </span>
          <textarea
            value={rationale}
            onChange={(e) => onRationaleChange(e.target.value)}
            disabled={locked}
            rows={4}
            placeholder={
              locked
                ? "Rationale will be enabled after analysis is complete."
                : "Why are you making this choice? Mention any open issues or fit with the strategy…"
            }
            className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm leading-relaxed text-stone-800 placeholder:text-stone-400 focus:border-[#7a3344] focus:outline-none focus:ring-2 focus:ring-[#7a3344]/20 disabled:bg-stone-50"
          />
          <p className="mt-1 text-right text-[11px] text-stone-400">
            {rationale.trim().length} / 20 min
          </p>
        </label>

        <button
          type="button"
          onClick={onExport}
          disabled={!exportState.canSubmit}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition ${
            exportState.canSubmit
              ? "bg-[#7a3344] text-white hover:bg-[#5a2533]"
              : "cursor-not-allowed bg-stone-100 text-stone-400"
          }`}
        >
          {!exportState.canSubmit && <IconLock className="h-4 w-4" />}
          {exportState.submitLabel}
        </button>

        {exportState.readyMessage && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            {exportState.readyMessage}
          </p>
        )}

        {!exportState.canSubmit && !locked && exportState.locks.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-stone-500">
            {exportState.locks.map((lock) => (
              <li key={lock}>• {lock}</li>
            ))}
          </ul>
        )}

        {exportState.canSubmit && decision === "proceed" && exportCopy.exportHint && (
          <p className="mt-2 text-center text-[11px] text-stone-500">
            {exportCopy.exportHint}
          </p>
        )}
      </section>
    </aside>
  );
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <IconCheck className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fdf2f4] ring-2 ring-[#7a3344]/30">
        <span className="h-2 w-2 rounded-full bg-[#7a3344]" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-stone-400">
      <IconLock className="h-3 w-3" />
    </span>
  );
}
