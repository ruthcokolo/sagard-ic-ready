"use client";

/**
 * Empty states when no companies, sector, or comparable data is available.
 */
import Link from "next/link";
import { EmptyState } from "@/components/portfolio-monitoring/PortfolioShared";

/** Default empty state when no data to explore. */
export function MetricsExplorerEmptyState() {
  return (
    <EmptyState
      title="No portfolio metrics available"
      description="Metrics Explorer is populated after company reporting PDFs are uploaded, processed, and validated."
      action={
        <Link
          href="/dashboard/portfolio/reporting-packages"
          className="inline-flex rounded-xl bg-[#7a3344] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6a2b3a]"
        >
          Go to Reporting Packages
        </Link>
      }
    />
  );
}

/** Empty state when the chosen sector has no companies. */
export function NoCompaniesInSectorState({ onClearSector }: { onClearSector: () => void }) {
  return (
    <EmptyState
      title="No companies found in this sector"
      description="No processed portfolio reports are currently available for the selected sector."
      action={
        <button
          type="button"
          onClick={onClearSector}
          className="inline-flex rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          Clear sector filter
        </button>
      }
    />
  );
}

/** Empty state when selected companies lack comparable metrics. */
export function NoComparableDataState({
  metricName,
  onChooseMetric,
  onEditCompanies,
}: {
  metricName: string;
  onChooseMetric: () => void;
  onEditCompanies: () => void;
}) {
  return (
    <EmptyState
      title={`No comparable ${metricName} data`}
      description="The selected companies do not have approved, compatible values for this metric and period."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onChooseMetric}
            className="inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Choose another metric
          </button>
          <button
            type="button"
            onClick={onEditCompanies}
            className="inline-flex rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6a2b3a]"
          >
            Edit company selection
          </button>
        </div>
      }
    />
  );
}
