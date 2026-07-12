"use client";

/**
 * Button that navigates back to the metric review landing page.
 */
/** Link button back to the review landing page. */
export function BackToMetricReviewButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back to Metric Review"
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#7a3344]/50 bg-white px-3 text-xs font-semibold text-[#7a3344] transition hover:bg-[#fdf2f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a3344] ${className}`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Metric Review
    </button>
  );
}
