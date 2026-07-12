"use client";

import { useEffect, useMemo, useState } from "react";
import { CompanyAvatar } from "@/components/portfolio-monitoring/company-identity";
import { formatCompanyDisplayName } from "@/lib/portfolio/company-identity";
import {
  buildCompanyReviewGroups,
  getAvailableReviewFilterOptions,
  getPackageMetrics,
  getQueueQuickViewCounts,
  getTotalUnresolvedCount,
  isUnresolved,
  type NavigatorSort,
  type ReviewQueueFilters,
} from "@/lib/portfolio/metric-review-selectors";
import type { PortfolioState } from "@/lib/portfolio/types";
import { QueueFiltersAccordion } from "./QueueFiltersAccordion";
import { QueueProgressFooter } from "./QueueProgressFooter";

const NAVIGATOR_PAGE_SIZE = 30;
const FILTERS_PREF_KEY = "icready-metric-review-filters-expanded";
const SIDEBAR_PREF_KEY = "icready-metric-review-sidebar-expanded";

function readSessionBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function writeSessionBool(key: string, value: boolean) {
  try {
    sessionStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function companyQueueState(group: {
  unresolvedCount: number;
  packages: { status: string; isComplete: boolean; unresolvedCount: number }[];
}): { label: string; tone: "green" | "amber" | "red" | "blue" | "stone" } {
  if (group.packages.some((p) => p.status === "Failed")) {
    return { label: "Blocked", tone: "red" };
  }
  if (group.packages.every((p) => p.isComplete) && group.packages.length > 0) {
    return { label: "Completed", tone: "green" };
  }
  if (group.unresolvedCount > 0) {
    const inReview = group.packages.some(
      (p) => p.unresolvedCount > 0 && p.status !== "Failed"
    );
    if (inReview) return { label: "In review", tone: "blue" };
    return { label: "Needs attention", tone: "amber" };
  }
  return { label: "In queue", tone: "stone" };
}

export function ReviewQueueSidebar({
  state,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  selectedPackageId,
  selectedCompanyId,
  expandedCompanies,
  onToggleCompany,
  onSelectPackage,
  assignedCount,
}: {
  state: PortfolioState;
  filters: ReviewQueueFilters;
  onFiltersChange: (filters: ReviewQueueFilters) => void;
  sort: NavigatorSort;
  onSortChange: (sort: NavigatorSort) => void;
  selectedPackageId: string | null;
  selectedCompanyId: string | null;
  expandedCompanies: Set<string>;
  onToggleCompany: (companyId: string) => void;
  onSelectPackage: (companyId: string, packageId: string) => void;
  assignedCount: number;
}) {
  const [visibleCount, setVisibleCount] = useState(NAVIGATOR_PAGE_SIZE);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [hydratedPrefs, setHydratedPrefs] = useState(false);

  useEffect(() => {
    const medium = window.matchMedia("(max-width: 1280px)").matches;
    setFiltersExpanded(readSessionBool(FILTERS_PREF_KEY, !medium));
    setSidebarExpanded(readSessionBool(SIDEBAR_PREF_KEY, !medium));
    setHydratedPrefs(true);
  }, []);

  const setFiltersExpandedPersist = (value: boolean) => {
    setFiltersExpanded(value);
    writeSessionBool(FILTERS_PREF_KEY, value);
  };

  const setSidebarExpandedPersist = (value: boolean) => {
    setSidebarExpanded(value);
    writeSessionBool(SIDEBAR_PREF_KEY, value);
  };

  const filterOptions = useMemo(() => getAvailableReviewFilterOptions(state), [state]);
  const groups = useMemo(
    () => buildCompanyReviewGroups(state, filters, sort),
    [state, filters, sort]
  );
  const quickViewCounts = useMemo(
    () => getQueueQuickViewCounts(state, filters, sort),
    [state, filters, sort]
  );
  const unresolvedTotal = getTotalUnresolvedCount(state);
  const visibleGroups = groups.slice(0, visibleCount);

  const queueMetricTotals = useMemo(() => {
    let reviewed = 0;
    let total = 0;
    for (const g of groups) {
      for (const pkg of g.packages) {
        const metrics = getPackageMetrics(state, pkg.packageId);
        total += metrics.length;
        reviewed += metrics.filter((m) => !isUnresolved(m)).length;
      }
    }
    return { reviewed, total };
  }, [groups, state]);

  const selectedGroup = groups.find((g) => g.companyId === selectedCompanyId);
  const selectedPkg = selectedGroup?.packages.find((p) => p.packageId === selectedPackageId);

  if (!hydratedPrefs) {
    return <aside className="w-[328px] shrink-0 border-r border-stone-200 bg-white" />;
  }

  if (!sidebarExpanded) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center border-r border-stone-200 bg-white py-3 transition-[width] duration-200">
        <button
          type="button"
          aria-expanded={false}
          aria-label="Expand review queue"
          onClick={() => setSidebarExpandedPersist(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"
        >
          »
        </button>
        <span className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          Q
        </span>
        {unresolvedTotal > 0 ? (
          <span className="mt-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#63202e] px-1.5 text-[10px] font-bold text-white">
            {unresolvedTotal}
          </span>
        ) : null}
        {selectedCompanyId && selectedGroup ? (
          <div
            className="mt-3"
            title={`${formatCompanyDisplayName(selectedGroup.companyName)}${
              selectedPkg
                ? ` · ${selectedPkg.reportPeriod} ${selectedPkg.reportTitle} · ${selectedPkg.unresolvedCount} unresolved`
                : ""
            }`}
          >
            <CompanyAvatar
              companyId={selectedGroup.companyId}
              companyName={selectedGroup.companyName}
              size="sm"
            />
          </div>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[328px] shrink-0 flex-col border-r border-stone-200 bg-white transition-[width] duration-200">
      <div className="shrink-0 border-b border-stone-100 px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-stone-900">Review queue</h2>
            <p className="mt-0.5 text-[12px] font-medium text-stone-700">
              {assignedCount > 0
                ? `${assignedCount} assigned to you`
                : unresolvedTotal > 0
                  ? `${unresolvedTotal} in review`
                  : "No items in queue"}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Reviewing companies from your current queue.
            </p>
          </div>
          <button
            type="button"
            aria-expanded={true}
            aria-label="Collapse review queue"
            onClick={() => setSidebarExpandedPersist(false)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100"
          >
            «
          </button>
        </div>
      </div>

      <QueueFiltersAccordion
        expanded={filtersExpanded}
        onExpandedChange={setFiltersExpandedPersist}
        filters={filters}
        onFiltersChange={onFiltersChange}
        sort={sort}
        onSortChange={onSortChange}
        periods={filterOptions.periods}
        reviewers={filterOptions.reviewers}
        sectors={filterOptions.sectors}
        quickViewCounts={quickViewCounts}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {visibleGroups.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <p className="text-xs font-medium text-stone-700">No companies match these queue filters</p>
            <button
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  search: "",
                  sector: "all",
                  period: "all",
                  status: "all",
                  confidence: "all",
                  reviewer: "all",
                  overdueOnly: false,
                  extractionFailuresOnly: false,
                  quickView: "all",
                })
              }
              className="mt-2 text-[11px] font-semibold text-[#7a3344] hover:underline"
            >
              Clear queue filters
            </button>
          </div>
        ) : (
          visibleGroups.map((group) => {
            const expanded = expandedCompanies.has(group.companyId);
            const displayName = formatCompanyDisplayName(group.companyName);
            const stateMeta = companyQueueState(group);

            const expandAndOpen = () => {
              onToggleCompany(group.companyId);
              if (!expanded) {
                const preferred =
                  group.packages.find((p) => !p.isComplete) ?? group.packages[0];
                if (preferred) {
                  onSelectPackage(group.companyId, preferred.packageId);
                }
              }
            };

            return (
              <div key={group.companyId} className="mb-0.5">
                <div
                  className={`flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-lg text-left hover:bg-stone-50 ${
                    group.companyId === selectedCompanyId ? "bg-stone-50" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={expandAndOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left"
                    aria-expanded={expanded}
                  >
                    <CompanyAvatar
                      companyId={group.companyId}
                      companyName={group.companyName}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span
                        className="flex items-center gap-1.5 truncate text-[12px] font-semibold text-stone-900"
                        title={displayName}
                      >
                        <span className="truncate">{displayName}</span>
                        {group.unresolvedCount > 0 ? (
                          <span className="shrink-0 rounded-full bg-stone-200 px-1.5 text-[10px] font-bold tabular-nums text-stone-700">
                            {group.unresolvedCount}
                          </span>
                        ) : stateMeta.label === "Completed" ? (
                          <span className="shrink-0 text-[11px] text-emerald-600">✓</span>
                        ) : null}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] font-medium ${
                          stateMeta.tone === "red"
                            ? "text-red-600"
                            : stateMeta.tone === "amber"
                              ? "text-amber-700"
                              : stateMeta.tone === "green"
                                ? "text-emerald-600"
                                : stateMeta.tone === "blue"
                                  ? "text-sky-700"
                                  : "text-stone-500"
                        }`}
                      >
                        {stateMeta.label}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (expanded) {
                        onToggleCompany(group.companyId);
                      } else {
                        expandAndOpen();
                      }
                    }}
                    aria-label={expanded ? `Collapse ${displayName}` : `Expand ${displayName}`}
                    aria-expanded={expanded}
                    className="shrink-0 px-2 py-2 text-stone-400 hover:text-stone-600"
                  >
                    {expanded ? "▾" : "▸"}
                  </button>
                </div>
                {expanded ? (
                  <ul className="mb-1 ml-3 border-l border-stone-100 pl-2">
                    {group.packages.map((pkg) => {
                      const selected = selectedPackageId === pkg.packageId;
                      const summary = getPackageMetrics(state, pkg.packageId);
                      const reviewed = summary.filter((m) => !isUnresolved(m)).length;
                      const total = summary.length;
                      return (
                        <li key={pkg.packageId}>
                          <button
                            type="button"
                            onClick={() => onSelectPackage(group.companyId, pkg.packageId)}
                            className={`relative flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] hover:bg-stone-50 ${
                              selected
                                ? "bg-[#fdf2f4] font-medium text-[#7a3344]"
                                : "text-stone-700"
                            }`}
                          >
                            {selected ? (
                              <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[#7a3344]" />
                            ) : null}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">
                                {pkg.reportPeriod} {pkg.reportTitle}
                              </span>
                              {pkg.status === "Failed" ? (
                                <span className="text-[10px] text-red-600">Extraction failed</span>
                              ) : pkg.isComplete ? (
                                <span className="text-[10px] text-emerald-600">
                                  Completed · {total} of {total} reviewed
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-500">
                                  {pkg.unresolvedCount} unresolved · {reviewed} of {total} reviewed
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
        {groups.length > visibleCount ? (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + NAVIGATOR_PAGE_SIZE)}
            className="mt-2 w-full rounded-lg border border-stone-200 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
          >
            Load more companies
          </button>
        ) : null}
      </div>

      <QueueProgressFooter
        reviewedCount={queueMetricTotals.reviewed}
        totalCount={queueMetricTotals.total}
      />
    </aside>
  );
}
