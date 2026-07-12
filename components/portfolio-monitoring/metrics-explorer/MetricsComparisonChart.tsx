"use client";

/**
 * Bar chart comparing metric values across selected companies.
 */
import { CompanyAvatar } from "@/components/portfolio-monitoring/company-identity";
import type { ComparableMetricRow, ComparisonSort } from "@/lib/portfolio/metrics-explorer-selectors";
import { metricRowDedupeKey } from "@/lib/portfolio/metrics-explorer-selectors";
import { ComparisonSortControl } from "./MetricsExplorerFilters";
import { MetricStatusBadge } from "@/components/portfolio-monitoring/PortfolioShared";

function sectorBadgeClass(sector: string): string {
  const map: Record<string, string> = {
    Healthcare: "bg-violet-50 text-violet-700 ring-violet-100",
    "Real Estate": "bg-rose-50 text-rose-700 ring-rose-100",
    "Enterprise Software": "bg-blue-50 text-blue-700 ring-blue-100",
    Fintech: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Consumer: "bg-amber-50 text-amber-800 ring-amber-100",
    "Industrial & Manufacturing": "bg-stone-100 text-stone-700 ring-stone-200",
    "Logistics & Transportation": "bg-sky-50 text-sky-700 ring-sky-100",
    "Energy & Climate": "bg-teal-50 text-teal-700 ring-teal-100",
  };
  return map[sector] ?? "bg-stone-100 text-stone-600 ring-stone-200";
}

function ChartEmptyState({
  title,
  description,
  onClearFilters,
  onIncludeNeedsValidation,
}: {
  title: string;
  description: string;
  onClearFilters?: () => void;
  onIncludeNeedsValidation?: () => void;
}) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-stone-200 px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{description}</p>
      {(onClearFilters || onIncludeNeedsValidation) && (
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
          {onIncludeNeedsValidation && (
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

/** Bar chart comparing one metric across companies. */
export function MetricsComparisonChart({
  metricName,
  periodLabel,
  rows,
  sort,
  onSortChange,
  includeNeedsValidation,
  hasMixedCurrencies,
  showPeriodInLabels = false,
  showIncludeNeedsValidationAction = false,
  onClearFilters,
  onIncludeNeedsValidation,
}: {
  metricName: string;
  periodLabel: string;
  rows: ComparableMetricRow[];
  sort: ComparisonSort;
  onSortChange: (sort: ComparisonSort) => void;
  includeNeedsValidation: boolean;
  hasMixedCurrencies: boolean;
  showPeriodInLabels?: boolean;
  showIncludeNeedsValidationAction?: boolean;
  onClearFilters?: () => void;
  onIncludeNeedsValidation?: () => void;
}) {
  const maxValue = Math.max(...rows.map((r) => r.normalizedValue ?? 0), 1);
  const showSort = rows.length > 0;

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">
            {metricName} comparison
            {periodLabel ? ` · ${periodLabel}` : ""}
          </h2>
          {hasMixedCurrencies && (
            <p className="mt-1 text-xs text-amber-700">
              Mixed currencies detected — only compatible units are shown on the same scale.
            </p>
          )}
        </div>
        {showSort && <ComparisonSortControl value={sort} onChange={onSortChange} />}
      </div>

      {rows.length === 0 ? (
        <ChartEmptyState
          title={`No comparable ${metricName} data`}
          description={`No approved ${metricName} values match the current filters.`}
          onClearFilters={onClearFilters}
          onIncludeNeedsValidation={
            showIncludeNeedsValidationAction ? onIncludeNeedsValidation : undefined
          }
        />
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map((row) => {
            const width = Math.max(8, ((row.normalizedValue ?? 0) / maxValue) * 100);
            const label = showPeriodInLabels
              ? `${row.companyName} · ${row.reportPeriod}`
              : row.companyName;
            return (
              <div
                key={metricRowDedupeKey(row)}
                className="grid grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-3"
              >
                <div className="min-w-0 overflow-hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    <CompanyAvatar companyId={row.companyId} companyName={row.companyName} size="md" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-stone-900" title={label}>
                        {label}
                      </p>
                      <p className="truncate text-[11px] text-stone-500">{row.sector}</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="h-7 overflow-hidden rounded-md bg-stone-100">
                    <div
                      className="flex h-full min-w-[2rem] items-center rounded-md bg-[#7a3344]/85 px-2 text-[11px] font-semibold text-white"
                      style={{ width: `${width}%` }}
                    >
                      {row.extractedValue}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold tabular-nums text-stone-800">{row.extractedValue}</p>
                  <p className="text-[10px] text-stone-400">{row.reportPeriod}</p>
                  {includeNeedsValidation && row.status === "Needs validation" && (
                    <MetricStatusBadge status={row.status} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export { sectorBadgeClass };
