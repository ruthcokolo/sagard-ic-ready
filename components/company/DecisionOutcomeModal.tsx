"use client";

import Link from "next/link";

export type DecisionOutcome =
  | { type: "proceed"; dealName: string }
  | { type: "more_diligence"; dealName: string; tasks: string[] }
  | { type: "pass"; dealName: string };

export function DecisionOutcomeModal({
  outcome,
  onClose,
}: {
  outcome: DecisionOutcome | null;
  onClose: () => void;
}) {
  if (!outcome) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <OutcomeContent outcome={outcome} onClose={onClose} />
      </div>
    </div>
  );
}

function OutcomeContent({
  outcome,
  onClose,
}: {
  outcome: DecisionOutcome;
  onClose: () => void;
}) {
  if (outcome.type === "proceed") {
    return (
      <>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          Decision submitted
        </p>
        <h3 className="mt-2 text-lg font-semibold text-stone-900">Committee package downloading</h3>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          <strong className="text-stone-900">{outcome.dealName}</strong> is recorded in download
          history and removed from your active review queue. Your IC package download should begin
          shortly.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link
            href="/exports"
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            View download history
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a2533]"
          >
            Done
          </button>
        </div>
      </>
    );
  }

  if (outcome.type === "more_diligence") {
    return (
      <>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
          Decision submitted
        </p>
        <h3 className="mt-2 text-lg font-semibold text-stone-900">Returned to Resolve blockers</h3>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          <strong className="text-stone-900">{outcome.dealName}</strong> is back in your blocker
          queue and recorded in download history. Your rationale was saved as diligence tasks:
        </p>
        <ul className="mt-4 space-y-2">
          {outcome.tasks.map((task) => (
            <li
              key={task}
              className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm text-stone-800"
            >
              {task}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Stay on deal
          </button>
          <Link
            href="/ic-readiness?step=conflicts"
            onClick={onClose}
            className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a2533]"
          >
            Open resolve blockers →
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        Decision submitted
      </p>
      <h3 className="mt-2 text-lg font-semibold text-stone-900">Don't invest recorded</h3>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        <strong className="text-stone-900">{outcome.dealName}</strong> leaves your active review
        queue. The decision and rationale are saved to download history.
      </p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Close
        </button>
        <Link
          href="/exports"
          onClick={onClose}
          className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a2533]"
        >
          View download history →
        </Link>
      </div>
    </>
  );
}

export function buildDiligenceTasksFromRationale(rationale: string): string[] {
  const trimmed = rationale.trim();
  if (trimmed.length >= 20) {
    const sentence = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
    return [sentence];
  }
  return ["Obtain audited financials and reconcile ARR before committee."];
}
