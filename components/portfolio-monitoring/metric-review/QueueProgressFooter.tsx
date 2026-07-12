"use client";

export function QueueProgressFooter({
  reviewedCount,
  totalCount,
}: {
  reviewedCount: number;
  totalCount: number;
}) {
  const pct = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  return (
    <div className="shrink-0 border-t border-stone-100 bg-white px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-stone-800">Queue progress</p>
          <p className="mt-0.5 text-[11px] tabular-nums text-stone-500">
            {reviewedCount} of {totalCount} metrics reviewed
          </p>
        </div>
        <span className="text-[12px] font-semibold tabular-nums text-stone-700">{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-[#7a3344] transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
