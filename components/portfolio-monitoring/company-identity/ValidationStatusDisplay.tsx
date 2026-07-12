"use client";

import type { ExtractedMetric } from "@/lib/portfolio/types";

function formatReviewedDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ValidationStatusDisplay({
  status,
  reviewedBy,
  reviewedAt,
}: {
  status: ExtractedMetric["status"];
  reviewedBy?: string;
  reviewedAt?: string;
}) {
  const reviewedDate = formatReviewedDate(reviewedAt);

  if (status === "Approved for reporting") {
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-500 text-emerald-600">
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-[11px] font-medium leading-tight text-stone-800">Approved for reporting</span>
        </div>
        {reviewedBy && (
          <p className="ml-5 mt-0.5 text-[10px] leading-snug text-stone-400">
            Reviewed by {reviewedBy}
            {reviewedDate ? ` · ${reviewedDate}` : ""}
          </p>
        )}
      </div>
    );
  }

  if (status === "Needs validation") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-amber-500 text-amber-600">
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span className="text-[11px] font-medium leading-tight text-stone-800">Needs validation</span>
      </div>
    );
  }

  return <span className="text-[11px] text-stone-500">{status}</span>;
}
