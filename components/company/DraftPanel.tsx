/** Editable draft sections of the IC memo with source citations. */

import type { AnalysisResult } from "@/lib/types";
import { ChecklistTable } from "@/components/company/ChecklistTable";
import { ConflictsSummary } from "@/components/company/ConflictsSummary";

/** Renders the draft panel UI. */
export function DraftPanel({ analysis }: { analysis: AnalysisResult }) {
  const { onePager, checklist, contradictions } = analysis;

  return (
    <div>
      <ConflictsSummary contradictions={contradictions} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Review draft</h2>
          <p className="mt-1 text-sm text-stone-500">
            AI-generated IC one-pager. Verify every claim against sources.
          </p>
        </div>
        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          AI draft
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <DraftBlock title="Thesis" body={onePager.thesis} />
        <DraftBlock title="Why now" body={onePager.whyNow} />
        <DraftBlock title="Key risks" bullets={onePager.keyRisks} />
        <DraftBlock title="Mitigants" bullets={onePager.mitigants} />
      </div>

      <ChecklistTable checklist={checklist} />
    </div>
  );
}

function DraftBlock({
  title,
  body,
  bullets,
}: {
  title: string;
  body?: string;
  bullets?: string[];
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-stone-50/50 p-5">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        {title}
      </h4>
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
