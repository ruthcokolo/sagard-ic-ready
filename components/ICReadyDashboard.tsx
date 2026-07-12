"use client";

/** Three-step IC readiness workspace: review analysis, pick a decision, and export the package. */
import Link from "next/link";
import { useState } from "react";
import type { AnalysisResult, Decision } from "@/lib/types";

interface Props {
  analysis: AnalysisResult;
  loading: boolean;
  onRefresh: () => void;
  decision: Decision;
  rationale: string;
  onDecisionChange: (d: Decision) => void;
  onRationaleChange: (v: string) => void;
  onExport: () => void;
  canExport: boolean;
}

type ReviewStep = 1 | 2 | 3;

/** Three-step review UI: analysis summary, decision form, and export. */
export function ICReadyDashboard({
  analysis,
  loading,
  onRefresh,
  decision,
  rationale,
  onDecisionChange,
  onRationaleChange,
  onExport,
  canExport,
}: Props) {
  const { deal, onePager, contradictions, checklist } = analysis;
  const highConflicts = contradictions.filter((c) => c.severity === "high");
  const openChecklist = checklist.filter((i) => !i.done);

  const [step, setStep] = useState<ReviewStep>(1);

  const readyForIC = analysis.readinessScore >= 7 && highConflicts.length === 0;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
        <Link href="/deals" className="text-sm text-stone-500 hover:text-stone-800">
          ← Back to Deals
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Refresh Analysis"}
        </button>
      </header>

      <div className="flex flex-1">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-stone-900">{deal.name}</h1>
            <p className="mt-1 text-sm text-stone-500">{deal.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {deal.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`mb-6 rounded-2xl border-2 p-6 ${
              readyForIC
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50/80"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              IC readiness verdict
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">
              {readyForIC ? "Ready for IC review" : "Not ready for IC yet"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-700">
              {readyForIC
                ? "Sources align and open items are low. Review the draft, then record your decision."
                : `${highConflicts.length} source conflict${highConflicts.length === 1 ? "" : "s"} and ${openChecklist.length} open items must be reviewed before export.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-600">
              <span>
                <strong className="text-stone-900">{analysis.readinessScore}/10</strong> readiness
              </span>
              <span>
                <strong className="text-stone-900">{analysis.documentsReviewed}</strong> docs ·{" "}
                {analysis.sourceCount} sources
              </span>
              <span className="text-stone-400">
                Updated {analysis.usedLiveAI ? "just now" : "2 min ago"}
              </span>
            </div>
          </div>

          <nav className="mb-6 flex flex-wrap gap-2" aria-label="Review steps">
            {(
              [
                [1, "1. Resolve conflicts"],
                [2, "2. Review draft"],
                [3, "3. Your decision →"],
              ] as const
            ).map(([n, label]) => (
              <button
                key={n}
                type="button"
                onClick={() => setStep(n)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  step === n
                    ? "bg-sagard-700 text-white"
                    : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {step === 1 && (
            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  What doesn&apos;t match across sources?
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  Review each conflict before moving on.
                </p>
              </div>

              {contradictions.map((c) => (
                <ConflictCard key={c.id} conflict={c} />
              ))}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-4 rounded-xl bg-sagard-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sagard-800"
              >
                Continue to draft review →
              </button>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  AI draft (verify — don&apos;t trust blindly)
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  Supporting material for your decision, not the decision itself.
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-stone-900">IC one-pager preview</h4>
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    AI-generated
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <OnePagerBlock title="Thesis" body={onePager.thesis} />
                  <OnePagerBlock title="Why Now" body={onePager.whyNow} />
                  <OnePagerBlock title="Key Risks" bullets={onePager.keyRisks} />
                  <OnePagerBlock title="Mitigants" bullets={onePager.mitigants} />
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-stone-900">
                  Open diligence items ({openChecklist.length})
                </h4>
                <ul className="mt-4 space-y-3">
                  {checklist.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 text-sm">
                      <span className={`mt-0.5 ${item.done ? "text-emerald-500" : "text-stone-300"}`}>
                        {item.done ? "✓" : "○"}
                      </span>
                      <div>
                        <span className="text-stone-800">{item.label}</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <PriorityBadge priority={item.priority} />
                          {item.linkedRisk && (
                            <span className="text-xs text-stone-400">Linked: {item.linkedRisk}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-xl bg-sagard-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sagard-800"
              >
                Continue to your decision →
              </button>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-2xl border border-sagard-200 bg-sagard-50/50 p-6">
              <h3 className="text-base font-semibold text-stone-900">Record your decision</h3>
              <p className="mt-1 text-sm text-stone-600">
                Use the panel on the right to choose Proceed, More Diligence, or Pass, add your
                rationale, then export.
              </p>
            </section>
          )}
        </main>

        <aside className="w-80 shrink-0 border-l border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-sagard-700">
            Step 3 · Your call
          </p>
          <h2 className="mt-1 text-sm font-semibold text-stone-900">Required before export</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            AI prepares the package. You own Proceed, More Diligence, or Pass.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {(
              [
                ["proceed", "Proceed"],
                ["more_diligence", "More Diligence"],
                ["pass", "Pass"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onDecisionChange(value);
                  setStep(3);
                }}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                  decision === value
                    ? "border-sagard-700 bg-sagard-700 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {decision === "proceed" && analysis.readinessScore < 7 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Readiness is {analysis.readinessScore}/10 — confirm Proceed anyway.
            </p>
          )}

          <label className="mt-4 block text-xs font-medium text-stone-600">Rationale</label>
          <textarea
            value={rationale}
            onChange={(e) => onRationaleChange(e.target.value)}
            rows={5}
            placeholder="Explain your decision…"
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-sagard-500 focus:outline-none focus:ring-1 focus:ring-sagard-500"
          />

          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold transition ${
              canExport
                ? "bg-sagard-700 text-white hover:bg-sagard-800"
                : "cursor-not-allowed bg-stone-100 text-stone-400"
            }`}
          >
            {canExport ? "Export IC Package" : "🔒 Export locked"}
          </button>
          {!canExport && (
            <p className="mt-2 text-center text-xs text-stone-400">
              Select a decision and add a rationale to export
            </p>
          )}

          <details className="mt-6 text-xs text-stone-400">
            <summary className="cursor-pointer font-medium text-stone-500">Connected systems</summary>
            <ul className="mt-2 space-y-1 pl-1">
              <li>Google Sheets · connected</li>
              <li>Claude API · connected</li>
              <li>n8n · connected</li>
            </ul>
          </details>
        </aside>
      </div>
    </div>
  );
}

function ConflictCard({
  conflict: c,
}: {
  conflict: AnalysisResult["contradictions"][0];
}) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-stone-900">{c.field}</h4>
        <SeverityBadge severity={c.severity} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SourceQuote source={c.sourceA.name} value={c.sourceA.value} quote={c.sourceA.quote} />
        <SourceQuote source={c.sourceB.name} value={c.sourceB.value} quote={c.sourceB.quote} />
      </div>
      <p className="mt-3 text-xs text-stone-500">
        <span className="font-medium text-stone-700">Next: </span>
        {c.suggestedAction}
      </p>
    </article>
  );
}

function SourceQuote({
  source,
  value,
  quote,
}: {
  source: string;
  value: string;
  quote: string;
}) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <p className="text-xs font-medium text-stone-500">{source}</p>
      <p className="mt-1 text-lg font-semibold text-sagard-800">{value}</p>
      <p className="mt-1 text-xs italic text-stone-500">&ldquo;{quote}&rdquo;</p>
    </div>
  );
}

function OnePagerBlock({
  title,
  body,
  bullets,
}: {
  title: string;
  body?: string;
  bullets?: string[];
}) {
  return (
    <div className="rounded-xl bg-stone-50 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</h3>
      {body && <p className="mt-2 text-sm leading-relaxed text-stone-700">{body}</p>}
      {bullets && (
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-700">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${styles[priority]}`}>
      {priority}
    </span>
  );
}
