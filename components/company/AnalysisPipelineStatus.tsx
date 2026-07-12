"use client";

/** Progress indicator and run button for the analysis pipeline. */

import {
  NORTHWIND_PIPELINE_STEPS,
  pipelineProgress,
  type PipelineStep,
} from "@/lib/analysis-pipeline";

/** Shows pipeline step progress and triggers analysis runs. */
export function AnalysisPipelineStatus({
  running,
  stepIndex,
  stepLabel,
  analysisReady,
  onRun,
}: {
  running: boolean;
  stepIndex: number;
  stepLabel: string | null;
  analysisReady: boolean;
  onRun: () => void;
}) {
  const progress = running && stepLabel ? pipelineProgress(stepIndex) : analysisReady ? 100 : 0;

  return (
    <section
      className={`rounded-2xl border p-5 ${
        running
          ? "border-[#7a3344]/30 bg-[#fdf2f4]/60"
          : analysisReady
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Analysis pipeline
          </p>
          {running && stepLabel ? (
            <p className="mt-2 text-sm font-medium text-[#7a3344]">{stepLabel}</p>
          ) : analysisReady ? (
            <p className="mt-2 text-sm font-medium text-emerald-800">
              Review updated · {NORTHWIND_PIPELINE_STEPS.length - 1} steps completed
            </p>
          ) : (
            <p className="mt-2 text-sm text-stone-600">
              Sources are synced. Run cross-source analysis to detect conflicts and draft the IC
              package.
            </p>
          )}

          {(running || analysisReady) && (
            <div className="mt-3 h-1.5 max-w-md overflow-hidden rounded-full bg-stone-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  analysisReady ? "bg-emerald-500" : "bg-[#7a3344]"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {running && (
            <ol className="mt-4 space-y-1">
              {NORTHWIND_PIPELINE_STEPS.map((step, i) => (
                <PipelineStepRow
                  key={step.id}
                  step={step}
                  state={i < stepIndex ? "done" : i === stepIndex ? "active" : "pending"}
                />
              ))}
            </ol>
          )}
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="shrink-0 rounded-xl bg-[#7a3344] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5a2533] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Running…" : analysisReady ? "Recheck sources" : "Run analysis"}
        </button>
      </div>
    </section>
  );
}

function PipelineStepRow({
  step,
  state,
}: {
  step: PipelineStep;
  state: "done" | "active" | "pending";
}) {
  const icon =
    state === "done" ? "✓" : state === "active" ? "●" : "○";
  const cls =
    state === "done"
      ? "text-emerald-700"
      : state === "active"
        ? "font-medium text-[#7a3344]"
        : "text-stone-400";

  return (
    <li className={`flex items-center gap-2 text-xs ${cls}`}>
      <span className="w-3 text-center">{icon}</span>
      {step.label.replace(/…$/, "")}
    </li>
  );
}
