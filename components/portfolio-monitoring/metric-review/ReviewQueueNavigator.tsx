"use client";

import { useMemo, useState } from "react";
import { CompanyAvatar } from "@/components/portfolio-monitoring/company-identity";
import {
  buildCompanyReviewGroups,
  DEFAULT_REVIEW_FILTERS,
  getAvailableReviewFilterOptions,
  getTotalUnresolvedCount,
  type NavigatorSort,
  type NavigatorView,
  type ReviewQueueFilters,
} from "@/lib/portfolio/metric-review-selectors";
import type { PortfolioState } from "@/lib/portfolio/types";

const NAVIGATOR_PAGE_SIZE = 30;

export function ReviewQueueNavigator({
  state,
  filters,
  onFiltersChange,
  navigatorView,
  onNavigatorViewChange,
  sort,
  onSortChange,
  selectedPackageId,
  selectedCompanyId,
  expandedCompanies,
  onToggleCompany,
  onSelectPackage,
}: {
  state: PortfolioState;
  filters: ReviewQueueFilters;
  onFiltersChange: (filters: ReviewQueueFilters) => void;
  navigatorView: NavigatorView;
  onNavigatorViewChange: (view: NavigatorView) => void;
  sort: NavigatorSort;
  onSortChange: (sort: NavigatorSort) => void;
  selectedPackageId: string | null;
  selectedCompanyId: string | null;
  expandedCompanies: Set<string>;
  onToggleCompany: (companyId: string) => void;
  onSelectPackage: (companyId: string, packageId: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(NAVIGATOR_PAGE_SIZE);
  const filterOptions = useMemo(() => getAvailableReviewFilterOptions(state), [state]);
  const groups = useMemo(
    () => buildCompanyReviewGroups(state, filters, sort),
    [state, filters, sort]
  );
  const unresolvedTotal = getTotalUnresolvedCount(state);
  const visibleGroups = groups.slice(0, visibleCount);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-stone-900">Review queue</h2>
            {unresolvedTotal > 0 && (
              <span className="rounded-full bg-[#63202e] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unresolvedTotal}
              </span>
            )}
          </div>
          <select
            value={navigatorView}
            onChange={(e) => onNavigatorViewChange(e.target.value as NavigatorView)}
            className="rounded border border-stone-200 px-1.5 py-1 text-[10px] font-medium text-stone-700"
            aria-label="Navigator view"
          >
            <option value="queue">Review queue</option>
            <option value="byCompany">By company</option>
            <option value="recentlyReviewed">Recently reviewed</option>
          </select>
        </div>
        <p className="mt-1 text-[11px] text-stone-500">
          Metrics across all companies that need validation.
        </p>
      </div>

      <div className="space-y-2 border-b border-stone-100 px-3 py-3">
        <input
          type="search"
          placeholder="Search companies, packages, or metrics..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={filters.sector}
            onChange={(e) => onFiltersChange({ ...filters, sector: e.target.value })}
            className="rounded border border-stone-200 px-1.5 py-1 text-[10px]"
          >
            <option value="all">All sectors</option>
            {filterOptions.sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filters.period}
            onChange={(e) => onFiltersChange({ ...filters, period: e.target.value })}
            className="rounded border border-stone-200 px-1.5 py-1 text-[10px]"
          >
            <option value="all">All periods</option>
            {filterOptions.periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="rounded border border-stone-200 px-1.5 py-1 text-[10px]"
          >
            <option value="all">All statuses</option>
            <option value="Needs validation">Needs validation</option>
            <option value="Approved">Approved</option>
            <option value="Failed">Failed</option>
          </select>
          <select
            value={filters.confidence}
            onChange={(e) => onFiltersChange({ ...filters, confidence: e.target.value })}
            className="rounded border border-stone-200 px-1.5 py-1 text-[10px]"
          >
            <option value="all">All confidence</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <label className="flex items-center gap-1 text-stone-600">
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(e) => onFiltersChange({ ...filters, overdueOnly: e.target.checked })}
            />
            Overdue only
          </label>
          <label className="flex items-center gap-1 text-stone-600">
            <input
              type="checkbox"
              checked={filters.extractionFailuresOnly}
              onChange={(e) =>
                onFiltersChange({ ...filters, extractionFailuresOnly: e.target.checked })
              }
            />
            Extraction failures
          </label>
          <button
            type="button"
            onClick={() => onFiltersChange(DEFAULT_REVIEW_FILTERS)}
            className="font-semibold text-[#7a3344] hover:underline"
          >
            Clear all
          </button>
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as NavigatorSort)}
          className="w-full rounded border border-stone-200 px-2 py-1 text-[10px]"
        >
          <option value="priority">Priority</option>
          <option value="companyName">Company name</option>
          <option value="mostUnresolved">Most unresolved</option>
          <option value="oldestUnresolved">Oldest unresolved</option>
          <option value="recentlyProcessed">Recently processed</option>
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {visibleGroups.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-stone-500">
            No review items match these filters.
          </p>
        ) : (
          visibleGroups.map((group) => {
            const expanded =
              expandedCompanies.has(group.companyId) ||
              group.companyId === selectedCompanyId;
            return (
              <div key={group.companyId} className="mb-1">
                <button
                  type="button"
                  onClick={() => {
                    onToggleCompany(group.companyId);
                    const preferred =
                      group.packages.find((p) => !p.isComplete) ?? group.packages[0];
                    if (preferred) {
                      onSelectPackage(group.companyId, preferred.packageId);
                    }
                  }}
                  className={`flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg px-2 py-2 text-left hover:bg-stone-50 ${
                    group.companyId === selectedCompanyId ? "bg-stone-50" : ""
                  }`}
                >
                  <CompanyAvatar
                    companyId={group.companyId}
                    companyName={group.companyName}
                    size="sm"
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-900"
                    title={group.companyName}
                  >
                    {group.companyName}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-stone-500">
                    {group.unresolvedCount > 0
                      ? group.unresolvedCount
                      : group.packages.every((p) => p.isComplete)
                        ? "✓"
                        : "0"}
                  </span>
                  <span className="text-stone-400">{expanded ? "▾" : "▸"}</span>
                </button>
                {expanded && (
                  <ul className="ml-3 border-l border-stone-100 pl-2">
                    {group.packages.map((pkg) => (
                      <li key={pkg.packageId}>
                        <button
                          type="button"
                          onClick={() => onSelectPackage(group.companyId, pkg.packageId)}
                          className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-stone-50 ${
                            selectedPackageId === pkg.packageId
                              ? "bg-[#fdf2f4] font-medium text-[#7a3344]"
                              : "text-stone-700"
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">
                              {pkg.reportPeriod} {pkg.reportTitle}
                            </span>
                            {pkg.status === "Failed" && (
                              <span className="text-[10px] text-red-600">Extraction failed</span>
                            )}
                          </span>
                          <span className="shrink-0 tabular-nums text-[10px] text-stone-500">
                            {pkg.isComplete
                              ? "Complete"
                              : pkg.unresolvedCount > 0
                                ? pkg.unresolvedCount
                                : "—"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
        {groups.length > visibleCount && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + NAVIGATOR_PAGE_SIZE)}
            className="mt-2 w-full rounded-lg border border-stone-200 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
          >
            Load more companies
          </button>
        )}
      </div>
    </aside>
  );
}
