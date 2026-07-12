"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComparableMetricRow } from "@/lib/portfolio/metrics-explorer-selectors";
import { metricRowDedupeKey } from "@/lib/portfolio/metrics-explorer-selectors";
import type { ExtractedMetric } from "@/lib/portfolio/types";
import {
  CompanyIdentity,
  DownloadSourceLink,
  EvidencePreviewCell,
  ValidationStatusDisplay,
} from "@/components/portfolio-monitoring/company-identity";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function sectorBadgeClass(sector: string): string {
  const map: Record<string, string> = {
    Healthcare: "bg-violet-50 text-violet-700",
    "Healthcare Services": "bg-emerald-50 text-emerald-700",
    "Real Estate": "bg-rose-50 text-rose-700",
    "Enterprise Software": "bg-blue-50 text-blue-700",
    "B2B SaaS": "bg-blue-50 text-blue-700",
    Fintech: "bg-emerald-50 text-emerald-700",
    "Financial Services": "bg-emerald-50 text-emerald-700",
    Consumer: "bg-amber-50 text-amber-800",
    "Industrial & Manufacturing": "bg-stone-100 text-stone-700",
    "Logistics & Transportation": "bg-sky-50 text-sky-700",
    "Energy & Climate": "bg-teal-50 text-teal-700",
  };
  return map[sector] ?? "bg-stone-100 text-stone-600";
}

function TableEmptyState({
  onClearFilters,
  onIncludeNeedsValidation,
  showIncludeNeedsValidationAction,
}: {
  onClearFilters?: () => void;
  onIncludeNeedsValidation?: () => void;
  showIncludeNeedsValidationAction?: boolean;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-stone-900">No detailed results</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
        No approved metrics match the current filters.
      </p>
      {(onClearFilters || (showIncludeNeedsValidationAction && onIncludeNeedsValidation)) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Clear filters
            </button>
          )}
          {showIncludeNeedsValidationAction && onIncludeNeedsValidation && (
            <button
              type="button"
              onClick={onIncludeNeedsValidation}
              className="rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6a2b3a]"
            >
              Include needs validation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MobileResultCard({
  row,
  onViewEvidence,
}: {
  row: ComparableMetricRow;
  onViewEvidence: (metric: ExtractedMetric) => void;
}) {
  return (
    <article className="border-b border-stone-100 px-4 py-3 last:border-0">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1 overflow-hidden">
          <CompanyIdentity
            companyId={row.companyId}
            companyName={row.companyName}
            size="sm"
            href={`/dashboard/portfolio/companies/${row.companyId}`}
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${sectorBadgeClass(row.sector)}`}>
              {row.sector}
            </span>
            <span className="text-[11px] text-stone-500">{row.reportPeriod}</span>
          </div>
          <p className="mt-2 text-sm">
            <span className="text-stone-600">{row.metricName}: </span>
            <span className="font-semibold tabular-nums text-stone-900">{row.extractedValue}</span>
            <span className="ml-1 text-[11px] text-stone-400">{row.unit}</span>
          </p>
          <div className="mt-2">
            <ValidationStatusDisplay
              status={row.status}
              reviewedBy={row.reviewedBy}
              reviewedAt={row.reviewedAt}
            />
          </div>
          <div className="mt-2">
            <DownloadSourceLink sourceFile={row.sourceFile} companyId={row.companyId} />
          </div>
          <div className="mt-2">
            <EvidencePreviewCell row={row} onViewEvidence={() => onViewEvidence(row)} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function MetricsComparisonTable({
  rows,
  onViewEvidence,
  onClearFilters,
  onIncludeNeedsValidation,
  showIncludeNeedsValidationAction = false,
}: {
  rows: ComparableMetricRow[];
  onViewEvidence: (metric: ExtractedMetric) => void;
  onClearFilters?: () => void;
  onIncludeNeedsValidation?: () => void;
  showIncludeNeedsValidationAction?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize]
  );

  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, totalPages, safePage, safePage - 1, safePage + 1]);
    return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  }, [safePage, totalPages]);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {rows.length === 0 ? (
        <TableEmptyState
          onClearFilters={onClearFilters}
          onIncludeNeedsValidation={onIncludeNeedsValidation}
          showIncludeNeedsValidationAction={showIncludeNeedsValidationAction}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] table-fixed text-left">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/90 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  <th className="h-12 px-3 py-2 align-middle">Company</th>
                  <th className="px-2 py-2 align-middle">Sector</th>
                  <th className="px-2 py-2 align-middle">Period</th>
                  <th className="px-2 py-2 align-middle">Metric</th>
                  <th className="px-2 py-2 align-middle">Value</th>
                  <th className="px-2 py-2 align-middle">Unit</th>
                  <th className="px-2 py-2 align-middle">Validation status</th>
                  <th className="px-2 py-2 align-middle">Source</th>
                  <th className="px-2 py-2 align-middle">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr
                    key={metricRowDedupeKey(row)}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60"
                  >
                    <td className="max-w-0 overflow-hidden px-3 py-3 align-middle">
                      <CompanyIdentity
                        companyId={row.companyId}
                        companyName={row.companyName}
                        size="sm"
                        href={`/dashboard/portfolio/companies/${row.companyId}`}
                      />
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <span
                        className={`inline-block max-w-full truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight ${sectorBadgeClass(row.sector)}`}
                        title={row.sector}
                      >
                        {row.sector}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 align-middle text-[12px] text-stone-600">
                      {row.reportPeriod}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 align-middle text-[12px] text-stone-700">
                      {row.metricName}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 align-middle text-[13px] font-semibold tabular-nums text-stone-900">
                      {row.extractedValue}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 align-middle text-[11px] text-stone-500">
                      {row.unit}
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <ValidationStatusDisplay
                        status={row.status}
                        reviewedBy={row.reviewedBy}
                        reviewedAt={row.reviewedAt}
                      />
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <DownloadSourceLink sourceFile={row.sourceFile} companyId={row.companyId} />
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <EvidencePreviewCell row={row} onViewEvidence={() => onViewEvidence(row)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-stone-100 lg:hidden">
            {paged.map((row) => (
              <MobileResultCard key={metricRowDedupeKey(row)} row={row} onViewEvidence={onViewEvidence} />
            ))}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-500">
            <p>
              Showing {rangeStart} to {rangeEnd} of {rows.length} results
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 tabular-nums ${
                    pageNum === safePage
                      ? "border-[#7a3344] bg-[#7a3344] font-semibold text-white"
                      : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[11px] font-medium text-stone-700"
                aria-label="Results per page"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
