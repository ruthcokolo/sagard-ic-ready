/** Panel to record the IC committee decision and rationale for a deal. */

import type { AnalysisResult, Decision } from "@/lib/types";

/** Renders the decision panel UI. */
export function DecisionPanel({
  analysis,
  decision,
  rationale,
  onDecisionChange,
  onRationaleChange,
  onExport,
  canExport,
}: {
  analysis: AnalysisResult;
  decision: Decision;
  rationale: string;
  onDecisionChange: (d: Decision) => void;
  onRationaleChange: (v: string) => void;
  onExport: () => void;
  canExport: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-stone-900">Your decision</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          AI prepares the IC package. You own the recommendation; nothing exports without your
          recorded call.
        </p>
      </div>

      {decision === "proceed" && analysis.readinessScore < 7 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Readiness is {analysis.readinessScore}/10 with active conflicts. Confirm you want to
          Proceed anyway.
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["proceed", "Proceed", "Move toward IC"],
            ["more_diligence", "More diligence", "Need more work"],
            ["pass", "Pass", "Do not pursue"],
          ] as const
        ).map(([value, label, sub]) => (
          <button
            key={value}
            type="button"
            onClick={() => onDecisionChange(value)}
            className={`rounded-2xl border-2 px-4 py-5 text-left transition ${
              decision === value
                ? "border-[#7a3344] bg-[#fdf2f4] shadow-[0_4px_20px_-6px_rgba(107,45,60,0.12)]"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <p className="font-semibold text-stone-900">{label}</p>
            <p className="mt-1 text-xs text-stone-500">{sub}</p>
          </button>
        ))}
      </div>

      <label className="mt-8 block">
        <span className="text-sm font-medium text-stone-700">Rationale</span>
        <textarea
          value={rationale}
          onChange={(e) => onRationaleChange(e.target.value)}
          rows={5}
          placeholder="Why this decision? Reference conflicts, open items, or strategic fit…"
          className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm leading-relaxed text-stone-800 placeholder:text-stone-400 focus:border-[#7a3344] focus:outline-none focus:ring-2 focus:ring-[#7a3344]/20"
        />
      </label>

      <button
        type="button"
        onClick={onExport}
        disabled={!canExport}
        className={`mt-6 w-full rounded-2xl py-4 text-sm font-semibold transition ${
          canExport
            ? "bg-[#7a3344] text-white shadow-[0_4px_20px_-6px_rgba(107,45,60,0.25)] hover:bg-[#5a2533]"
            : "cursor-not-allowed bg-stone-100 text-stone-400"
        }`}
      >
        {canExport ? "Export IC package" : "Select decision + rationale to export"}
      </button>

      <details className="mt-8 text-center">
        <summary className="cursor-pointer text-xs text-stone-400 hover:text-stone-600">
          Connected: Google Sheets · Claude API · n8n
        </summary>
      </details>
    </div>
  );
}
