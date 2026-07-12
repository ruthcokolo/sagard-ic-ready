/** Side panel listing contradictions found across source documents. */

import type { AnalysisResult } from "@/lib/types";

/** Renders the conflicts panel UI. */
export function ConflictsPanel({
  analysis,
  loading,
  onRefresh,
}: {
  analysis: AnalysisResult;
  loading: boolean;
  onRefresh: () => void;
}) {
  const { contradictions } = analysis;
  const high = contradictions.filter((c) => c.severity === "high");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Resolve conflicts</h2>
          <p className="mt-1 max-w-xl text-sm text-stone-500">
            AI compared {analysis.sourceCount} sources. Review each mismatch before approving the
            draft or recording a decision.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh analysis"}
        </button>
      </div>

      {high.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">
            {high.length} high-severity conflict{high.length > 1 ? "s" : ""} blocking IC
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {high.map((c) => c.field).join(" · ")}
          </p>
        </div>
      )}

      {contradictions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 py-16 text-center">
          <p className="text-sm font-medium text-stone-700">No cross-source conflicts detected</p>
          <p className="mt-2 text-sm text-stone-500">
            Sources align on core metrics. Continue to Review draft or record your decision.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {contradictions.map((c) => (
          <article
            key={c.id}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/30"
          >
            <div className="flex items-center justify-between border-b border-stone-100 bg-white px-5 py-3">
              <h3 className="font-semibold text-stone-900">{c.field}</h3>
              <SeverityBadge severity={c.severity} />
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              <SourceBlock name={c.sourceA.name} value={c.sourceA.value} quote={c.sourceA.quote} />
              <SourceBlock
                name={c.sourceB.name}
                value={c.sourceB.value}
                quote={c.sourceB.quote}
                divider
              />
            </div>
            <div className="border-t border-stone-100 bg-white px-5 py-3">
              <p className="text-xs text-stone-500">
                <span className="font-semibold text-stone-700">Recommended action: </span>
                {c.suggestedAction}
              </p>
            </div>
          </article>
        ))}
        </div>
      )}
    </div>
  );
}

function SourceBlock({
  name,
  value,
  quote,
  divider,
}: {
  name: string;
  value: string;
  quote: string;
  divider?: boolean;
}) {
  return (
    <div className={`p-5 ${divider ? "border-t sm:border-l sm:border-t-0 border-stone-100" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{name}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[#7a3344]">{value}</p>
      <p className="mt-2 text-sm italic leading-relaxed text-stone-500">&ldquo;{quote}&rdquo;</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" }) {
  const s = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${s[severity]}`}>
      {severity}
    </span>
  );
}
