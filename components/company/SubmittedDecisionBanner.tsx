"use client";

import Link from "next/link";
import { decisionToExportDecision } from "@/lib/decision-records";
import type { RecordedDecision } from "@/lib/decision-records";
import { EXPORT_DECISION_LABELS } from "@/lib/exports-mock";

export function SubmittedDecisionBanner({ submission }: { submission: RecordedDecision }) {
  const exportDecision = decisionToExportDecision(submission.decision);
  const label = EXPORT_DECISION_LABELS[exportDecision];

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
        Decision submitted
      </p>
      <p className="mt-2 text-sm text-stone-700">
        You recorded <strong className="text-stone-900">{label}</strong> for this deal. It appears
        in your download history and your review queue has been updated.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/exports"
          className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a2533]"
        >
          View download history →
        </Link>
        {submission.decision === "more_diligence" && (
          <Link
            href="/ic-readiness?step=conflicts"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Open resolve blockers →
          </Link>
        )}
      </div>
    </div>
  );
}
