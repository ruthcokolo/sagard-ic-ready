"use client";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function AssigneeDueDateCell({
  assigneeName,
  dueDate,
  overdueDays,
  lastReviewedAt,
}: {
  assigneeName: string | null;
  dueDate: string | null;
  overdueDays: number | null;
  lastReviewedAt: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[13px] text-stone-800">
        {assigneeName ?? "Unassigned"}
      </p>
      {overdueDays != null ? (
        <p className="mt-0.5 text-[11px] text-red-600">
          Overdue by {overdueDays} day{overdueDays === 1 ? "" : "s"}
        </p>
      ) : dueDate ? (
        <p className="mt-0.5 text-[11px] text-stone-500">{formatDate(dueDate)}</p>
      ) : lastReviewedAt ? (
        <p className="mt-0.5 text-[11px] text-stone-500">
          Reviewed {formatDate(lastReviewedAt)}
        </p>
      ) : (
        <p className="mt-0.5 text-[11px] text-stone-400">No due date</p>
      )}
    </div>
  );
}
