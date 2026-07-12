"use client";

import Link from "next/link";

export function CompanyDirectoryEmptyState({
  variant,
  onAddCompany,
  onClearFilters,
}: {
  variant: "none" | "filtered";
  onAddCompany: () => void;
  onClearFilters: () => void;
}) {
  if (variant === "filtered") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <h3 className="text-sm font-semibold text-stone-900">No companies match these filters</h3>
        <p className="mt-1 text-sm text-stone-500">Adjust or clear the current filters.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 text-[13px] font-semibold text-[#63202e] hover:underline"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <h3 className="text-sm font-semibold text-stone-900">No portfolio companies yet</h3>
      <p className="mt-1 max-w-md text-sm text-stone-500">
        Add a company manually or upload a reporting package to create or link a company record.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onAddCompany}
          className="rounded-lg bg-[#63202e] px-3 py-2 text-[13px] font-semibold text-white"
        >
          Add company
        </button>
        <Link
          href="/dashboard/portfolio/reporting-packages"
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
        >
          Go to Reporting Packages
        </Link>
      </div>
    </div>
  );
}
