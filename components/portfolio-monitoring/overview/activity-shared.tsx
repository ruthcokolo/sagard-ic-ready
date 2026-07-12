"use client";

/**
 * Shared helpers for formatting and displaying activity events on the overview.
 */
import type { ActivityEvent } from "@/lib/portfolio/overview-selectors";

/** Turns a timestamp into a friendly relative time string. */
export function formatActivityTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Icon matching the type of activity event. */
export function ActivityIcon({ type }: { type: ActivityEvent["type"] }) {
  const shell = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full";
  const iconProps = {
    className: "h-3.5 w-3.5",
    fill: "none" as const,
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.75,
  };

  switch (type) {
    case "completed":
      return (
        <div className={`${shell} bg-emerald-50 text-emerald-600`}>
          <svg {...iconProps}>
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case "approved":
      return (
        <div className={`${shell} bg-sky-50 text-sky-600`}>
          <svg {...iconProps}>
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        </div>
      );
    case "uploaded":
      return (
        <div className={`${shell} bg-stone-100 text-stone-600`}>
          <svg {...iconProps}>
            <path d="M12 16V4m0 0l4 4m-4-4L8 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case "failed":
    case "overdue":
      return (
        <div className={`${shell} bg-amber-50 text-amber-600`}>
          <svg {...iconProps}>
            <path d="M12 9v4m0 4h.01" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
      );
    case "export":
      return (
        <div className={`${shell} bg-violet-50 text-violet-600`}>
          <svg {...iconProps}>
            <path
              d="M12 10v6m0 0l-3-3m3 3l3-3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${shell} bg-blue-50 text-blue-600`}>
          <svg {...iconProps} className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "2s" }}>
            <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
            <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
          </svg>
        </div>
      );
  }
}

/** Human-readable labels for each activity event type. */
export const ACTIVITY_TYPE_LABELS: Record<ActivityEvent["type"], string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  completed: "Processed",
  failed: "Failed",
  approved: "Approved",
  export: "Export",
  overdue: "Overdue",
};
