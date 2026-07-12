"use client";

/**
 * Celebration screen shown when all metrics in a package are reviewed.
 */
/** Success screen when a package review is fully done. */
export function ReviewCompletionState({
  companyName,
  reportPeriod,
  reportTitle,
  onViewApproved,
  onReturnToQueue,
}: {
  companyName: string;
  reportPeriod: string;
  reportTitle: string;
  onViewApproved: () => void;
  onReturnToQueue: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/50 px-6 py-8 text-center">
      <h3 className="font-display text-xl text-stone-900">
        <span className="break-words">{companyName}</span> · {reportPeriod} is complete
      </h3>
      <p className="mt-2 text-sm text-stone-600">
        All extracted metrics in {reportTitle} have been reviewed.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onViewApproved}
          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          View approved metrics
        </button>
        <button
          type="button"
          onClick={onReturnToQueue}
          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Return to review queue
        </button>
      </div>
    </div>
  );
}
