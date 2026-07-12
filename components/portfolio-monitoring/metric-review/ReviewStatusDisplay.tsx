"use client";

import type { CompanyReviewStatus, ReviewPriority } from "@/lib/portfolio/types";

const STATUS_STYLES: Record<CompanyReviewStatus, string> = {
  "Awaiting assignment": "bg-stone-100 text-stone-600 ring-stone-200",
  "In review": "bg-sky-50 text-sky-800 ring-sky-100",
  "Needs attention": "bg-red-50 text-red-700 ring-red-100",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Awaiting report": "bg-stone-100 text-stone-500 ring-stone-200",
  "Extraction failed": "bg-red-50 text-red-700 ring-red-100",
  Waitlisted: "bg-amber-50 text-amber-800 ring-amber-100",
};

const PRIORITY_DOT: Record<ReviewPriority, string> = {
  Urgent: "bg-red-500",
  High: "bg-amber-400",
  Normal: "bg-stone-300",
  Low: "bg-stone-200",
};

const PRIORITY_LABEL: Record<ReviewPriority, string> = {
  Urgent: "Urgent",
  High: "High priority",
  Normal: "Normal priority",
  Low: "Low priority",
};

export function ReviewStatusDisplay({
  status,
  priority,
}: {
  status: CompanyReviewStatus;
  priority: ReviewPriority;
}) {
  return (
    <div className="min-w-0">
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_STYLES[status]}`}
      >
        {status}
      </span>
      {status !== "Completed" && status !== "Awaiting report" ? (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-500">
          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority]}`} />
          {PRIORITY_LABEL[priority]}
        </p>
      ) : null}
    </div>
  );
}
