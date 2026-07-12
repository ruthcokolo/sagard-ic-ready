import type { AnalysisResult, Decision } from "@/lib/types";
import type { ExportLockState } from "@/lib/export-lock";
import { exportCopy } from "@/lib/plain-copy";
import { DecisionOptionsList } from "@/components/company/DecisionOptionsList";

export function HumanSignOffPanel({
  analysis,
  decision,
  rationale,
  proceedAnyway,
  exportState,
  analysisPending = false,
  onDecisionChange,
  onRationaleChange,
  onProceedAnywayChange,
  onExport,
}: {
  analysis: AnalysisResult;
  decision: Decision;
  rationale: string;
  proceedAnyway: boolean;
  exportState: ExportLockState;
  analysisPending?: boolean;
  onDecisionChange: (d: Decision) => void;
  onRationaleChange: (v: string) => void;
  onProceedAnywayChange: (v: boolean) => void;
  onExport: () => void;
}) {
  return (
    <aside className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a3344]">
        Your decision required
      </p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        {analysisPending
          ? "Run analysis on the synced sources first. Then record your decision."
          : "Material conflicts block committee recommendation only. You can request more research or stop pursuing the deal at any time."}
      </p>

      {analysisPending && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          Decision panel unlocks after cross-source analysis completes.
        </p>
      )}

      <div className="mt-6">
        <DecisionOptionsList
          analysis={analysis}
          analysisPending={analysisPending}
          decision={decision}
          proceedAnyway={proceedAnyway}
          onDecisionChange={onDecisionChange}
          onProceedAnywayChange={onProceedAnywayChange}
        />
      </div>

      <label className={`mt-6 block ${analysisPending ? "pointer-events-none opacity-50" : ""}`}>
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Your explanation
        </span>
        <span className="ml-2 text-[11px] text-stone-400">at least 20 characters</span>
        <textarea
          value={rationale}
          onChange={(e) => onRationaleChange(e.target.value)}
          rows={5}
          placeholder="Why are you making this choice? Mention any open issues or fit with the strategy…"
          className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm leading-relaxed text-stone-800 placeholder:text-stone-400 focus:border-[#7a3344] focus:outline-none focus:ring-2 focus:ring-[#7a3344]/20"
        />
        <p className="mt-1 text-right text-[11px] text-stone-400">{rationale.trim().length} / 20</p>
      </label>

      <button
        type="button"
        onClick={onExport}
        disabled={!exportState.canSubmit}
        className={`mt-4 w-full rounded-xl py-3.5 text-sm font-semibold transition ${
          exportState.canSubmit
            ? "bg-[#7a3344] text-white hover:bg-[#5a2533]"
            : "cursor-not-allowed bg-stone-100 text-stone-400"
        }`}
      >
        {exportState.submitLabel}
      </button>

      {exportState.readyMessage ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          {exportState.readyMessage}
        </p>
      ) : !exportState.canSubmit && !analysisPending ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-800">
            {exportCopy.lockedHeader}
          </p>
          <ul className="mt-2 space-y-1">
            {exportState.locks.map((lock) => (
              <li key={lock} className="flex gap-2 text-xs text-red-900">
                <span>•</span>
                {lock}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
