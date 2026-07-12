"use client";

/**
 * Header section on the metric review landing page.
 */
/** Title and stats header on the review landing page. */
export function MetricReviewLandingHeader({
  totalCompanies,
  assignedCount,
}: {
  totalCompanies: number;
  assignedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl text-stone-900">Metric Review</h1>
        <p className="mt-1 text-sm text-stone-500">
          Review extracted metrics across your assigned portfolio companies.
        </p>
      </div>
      <p className="shrink-0 pt-1 text-sm text-stone-500">
        <span className="text-stone-700">{totalCompanies}</span> companies
        <span className="mx-1.5 text-stone-300">·</span>
        <span className="text-[#7a3344]">{assignedCount}</span> assigned to you
      </p>
    </div>
  );
}
