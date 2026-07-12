"use client";

/**
 * Empty states for the metric review landing page in different scenarios.
 */
import Link from "next/link";
import type { LandingScopeTab } from "@/lib/portfolio/metric-review-landing-selectors";

/** Empty state on the review landing page. */
export function ReviewLandingEmptyState({
  kind,
  onViewAll,
  onShowUnassigned,
  onClearFilters,
  onViewCompleted,
}: {
  kind:
    | "noAssignments"
    | "noCompanies"
    | "noMatches"
    | "queueClear";
  onViewAll?: () => void;
  onShowUnassigned?: () => void;
  onClearFilters?: () => void;
  onViewCompleted?: () => void;
}) {
  if (kind === "noCompanies") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center">
        <h3 className="text-base font-semibold text-stone-900">No portfolio companies yet</h3>
        <p className="mt-2 max-w-md text-sm text-stone-500">
          Companies appear after reporting packages are uploaded and processed.
        </p>
        <Link
          href="/dashboard/portfolio/reporting-packages"
          className="mt-5 inline-flex rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
        >
          Go to Reporting Packages
        </Link>
      </div>
    );
  }

  if (kind === "noMatches") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center">
        <h3 className="text-base font-semibold text-stone-900">
          No companies match these filters
        </h3>
        <p className="mt-2 max-w-md text-sm text-stone-500">
          Adjust or clear the current filters.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 inline-flex rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
        >
          Clear filters
        </button>
      </div>
    );
  }

  if (kind === "queueClear") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center">
        <h3 className="text-base font-semibold text-stone-900">
          Your review queue is clear
        </h3>
        <p className="mt-2 max-w-md text-sm text-stone-500">
          You have completed all currently assigned portfolio reviews.
        </p>
        <button
          type="button"
          onClick={onViewCompleted}
          className="mt-5 inline-flex rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
        >
          View completed reviews
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center">
      <h3 className="text-base font-semibold text-stone-900">
        No companies assigned to you
      </h3>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        Assigned portfolio reviews will appear here. You can browse all companies or claim
        an unassigned review.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
        >
          View all companies
        </button>
        <button
          type="button"
          onClick={onShowUnassigned}
          className="inline-flex rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700"
        >
          Show unassigned
        </button>
      </div>
    </div>
  );
}

/** Which empty state variant to show on review landing. */
export type EmptyKind = Parameters<typeof ReviewLandingEmptyState>[0]["kind"];

/** Picks the right empty state based on filters and data. */
export function resolveLandingEmptyKind(input: {
  totalCompanies: number;
  tab: LandingScopeTab;
  filteredCount: number;
  assignedCount: number;
  completedAssignedCount: number;
  hasActiveFilters: boolean;
}): EmptyKind | null {
  const {
    totalCompanies,
    tab,
    filteredCount,
    assignedCount,
    completedAssignedCount,
    hasActiveFilters,
  } = input;

  if (totalCompanies === 0) return "noCompanies";
  if (filteredCount > 0) return null;
  if (hasActiveFilters) return "noMatches";
  if (tab === "assigned" && assignedCount === 0) {
    if (completedAssignedCount > 0) return "queueClear";
    return "noAssignments";
  }
  if (tab === "assigned" && assignedCount > 0 && filteredCount === 0) {
    return "queueClear";
  }
  return "noMatches";
}
