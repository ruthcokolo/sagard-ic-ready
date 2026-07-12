/** AI-generated one-pager draft for the IC package. */

import type { AnalysisResult } from "@/lib/types";

/** Renders the draft one pager UI. */
export function DraftOnePager({ analysis }: { analysis: AnalysisResult }) {
  const { onePager } = analysis;

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Draft investment summary</h2>
          <p className="mt-1 text-sm text-stone-500">
            Written by AI. Double-check facts against the documents above.
          </p>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          AI draft — check the sources
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <DraftBlock
          title="Investment case"
          body={onePager.thesis}
          confidence="medium"
          confidenceNote="Annual revenue numbers don't match across files"
        />
        <DraftBlock
          title="Why now"
          body={onePager.whyNow}
          confidence="medium"
          confidenceNote="Market claim needs outside research"
        />
        <DraftBlock title="Main risks" bullets={onePager.keyRisks} confidence="high" />
        <DraftBlock title="How risks are managed" bullets={onePager.mitigants} confidence="medium" />
      </div>
    </section>
  );
}

function DraftBlock({
  title,
  body,
  bullets,
  confidence,
  confidenceNote,
}: {
  title: string;
  body?: string;
  bullets?: string[];
  confidence?: "high" | "medium" | "low";
  confidenceNote?: string;
}) {
  const confStyles = {
    high: "text-emerald-700 bg-emerald-50",
    medium: "text-amber-800 bg-amber-50",
    low: "text-red-700 bg-red-50",
  };
  const confLabels = { high: "Strong match", medium: "Some gaps", low: "Low trust" };

  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{title}</h4>
        {confidence && (
          <span className={`rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase ${confStyles[confidence]}`}>
            {confLabels[confidence]}
          </span>
        )}
      </div>
      {confidenceNote && <p className="mt-2 text-[11px] text-stone-500">{confidenceNote}</p>}
      {body && <p className="mt-3 text-sm leading-relaxed text-stone-700">{body}</p>}
      {bullets && (
        <ul className="mt-3 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm text-stone-700">
              <span className="text-[#7a3344]">•</span>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
