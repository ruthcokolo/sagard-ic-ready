"use client";

/**
 * Per-package metric review workspace (tabs, table, completion state).
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CompanyAvatar,
  DownloadSourceLink,
} from "@/components/portfolio-monitoring/company-identity";
import { formatCompanyDisplayName } from "@/lib/portfolio/company-identity";
import { formatPackagePeriodTitle } from "@/lib/portfolio/reporting-packages-demo";
import {
  getFilteredPackageMetrics,
  getNextReviewPackage,
  getPackageReviewSummary,
  getPreviousReviewPackage,
  getTabCounts,
  type MetricReviewTab,
  type NavigatorSort,
  type PackageReviewItem,
  type ReviewQueueFilters,
} from "@/lib/portfolio/metric-review-selectors";
import type { ExtractedMetric, PortfolioState, ReportingPackage } from "@/lib/portfolio/types";
import { BackToMetricReviewButton } from "./BackToMetricReviewButton";
import { MetricReviewTable } from "./MetricReviewTable";
import { ReviewCompletionState } from "./ReviewCompletionState";

const TAB_LABELS: Record<MetricReviewTab, string> = {
  all: "All metrics",
  needsValidation: "Needs validation",
  lowConfidence: "Low confidence",
  approved: "Approved",
  missing: "Missing",
};

function StatusBadge({ label }: { label: string }) {
  const tone =
    label === "In review"
      ? "bg-sky-50 text-sky-800 ring-sky-200"
      : label === "Completed"
        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
        : label === "Blocked" || label === "Extraction failed"
          ? "bg-red-50 text-red-800 ring-red-200"
          : "bg-amber-50 text-amber-900 ring-amber-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
}

function packageStatusLabel(pkg: ReportingPackage, needsValidation: number): string {
  if (pkg.status === "Failed") return "Extraction failed";
  if (pkg.status === "Processing") return "Processing";
  if (needsValidation === 0) return "Completed";
  return "In review";
}

export function PackageReviewWorkspace({
  state,
  pkg,
  activeTab,
  onTabChange,
  selectedIds,
  selectedMetricId,
  filters,
  sort,
  autoAdvance,
  onAutoAdvanceChange,
  onToggleSelect,
  onToggleSelectAll,
  onSelectMetric,
  onApprove,
  onEdit,
  onReject,
  onMarkMissing,
  onBulkApprove,
  onBulkReject,
  onBulkMarkMissing,
  onNextUnresolved,
  onPrevPackage,
  onNextPackage,
  onReturnToQueue,
  showCompletion,
  onViewApprovedMetrics,
  onDownloadSource,
  onBackToMetricReview,
  onReprocess,
}: {
  state: PortfolioState;
  pkg: ReportingPackage;
  packageItem: PackageReviewItem;
  activeTab: MetricReviewTab;
  onTabChange: (tab: MetricReviewTab) => void;
  selectedIds: Set<string>;
  selectedMetricId: string | null;
  filters: ReviewQueueFilters;
  sort: NavigatorSort;
  autoAdvance: boolean;
  onAutoAdvanceChange: (value: boolean) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onSelectMetric: (metric: ExtractedMetric) => void;
  onApprove: (id: string) => void;
  onEdit: (metric: ExtractedMetric) => void;
  onReject: (id: string) => void;
  onMarkMissing: (id: string) => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkMarkMissing: () => void;
  onNextUnresolved: () => void;
  onPrevPackage: () => void;
  onNextPackage: () => void;
  onReturnToQueue: () => void;
  showCompletion: boolean;
  onViewApprovedMetrics: () => void;
  onDownloadSource: () => boolean;
  onBackToMetricReview: () => void;
  onReprocess?: () => void;
}) {
  const summary = getPackageReviewSummary(state, pkg.id);
  const tabCounts = getTabCounts(pkg.id, state);
  const metrics = getFilteredPackageMetrics(pkg.id, state, activeTab);
  const reportTitle = formatPackagePeriodTitle(
    pkg.reportPeriod,
    pkg.fileName,
    pkg.sourceFormat
  );
  const displayName = formatCompanyDisplayName(pkg.companyName);
  const nextPackage = getNextReviewPackage(state, pkg.id, filters, sort);
  const prevPackage = getPreviousReviewPackage(state, pkg.id, filters, sort);
  const statusLabel = packageStatusLabel(pkg, summary.needsValidation);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const stickyNav = (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#f7f4f1]/95 backdrop-blur supports-[backdrop-filter]:bg-[#f7f4f1]/90">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <BackToMetricReviewButton onClick={onBackToMetricReview} />
          <label className="flex items-center gap-2 text-[12px] text-stone-600">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => onAutoAdvanceChange(e.target.checked)}
              className="rounded border-stone-300 text-[#7a3344] focus:ring-[#7a3344]"
            />
            Automatically open next unresolved metric
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrevPackage}
            disabled={!prevPackage}
            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Previous package"
          >
            ‹ Previous package
          </button>
          <button
            type="button"
            onClick={onNextPackage}
            disabled={!nextPackage}
            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            title="Next package"
          >
            Next package ›
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Package actions"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              ···
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-40 mt-1 w-48 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[12px] text-stone-700 hover:bg-stone-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onDownloadSource();
                  }}
                >
                  Download source PDF
                </button>
                <Link
                  href={`/dashboard/portfolio/companies/${pkg.companyId}`}
                  className="block w-full px-3 py-2 text-left text-[12px] text-stone-700 hover:bg-stone-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Go to Company Page
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );

  if (pkg.status === "Failed") {
    return (
      <div className="min-h-0 flex-1">
        {stickyNav}
        <div className="px-5 py-6 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50/50 px-6 py-8">
            <h3 className="text-lg font-semibold text-red-800">Extraction failed</h3>
            <p className="mt-2 text-sm text-red-700">
              {pkg.errorMessage ?? "Processing did not complete."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard/portfolio/reporting-packages?failedOnly=1"
                className="rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
              >
                Retry processing
              </Link>
              <DownloadSourceLink
                sourceFile={pkg.fileName}
                companyId={pkg.companyId}
                onDownload={onDownloadSource}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /** All metrics reviewed — show the completion celebration screen */
  if (showCompletion) {
    return (
      <div className="min-h-0 flex-1">
        {stickyNav}
        <div className="px-5 py-6 sm:px-6">
          <ReviewCompletionState
            companyName={pkg.companyName}
            reportPeriod={pkg.reportPeriod}
            reportTitle={reportTitle}
            onViewApproved={onViewApprovedMetrics}
            onReturnToQueue={onReturnToQueue}
          />
        </div>
      </div>
    );
  }

  const processedLabel = new Date(pkg.processedAt ?? pkg.uploadedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-0 flex-1">
      {stickyNav}

      <div className="space-y-4 px-5 py-4 sm:px-6">
        {/* Package context — not in a card */}
        <div className="flex flex-wrap items-start gap-3">
          <CompanyAvatar
            companyId={pkg.companyId}
            companyName={pkg.companyName}
            size="lg"
            className="!h-11 !w-11 !text-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[18px] font-semibold text-stone-900" title={displayName}>
                {displayName}
              </h1>
              <StatusBadge label={statusLabel} />
            </div>
            <p className="mt-0.5 text-[13px] text-stone-600">
              {reportTitle} · {pkg.sourceFormat}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DownloadSourceLink
                sourceFile={pkg.fileName}
                companyId={pkg.companyId}
                onDownload={onDownloadSource}
              />
            </div>
          </div>
        </div>

        {/* Five summary cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Source
            </p>
            <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-emerald-700">
              <span aria-hidden>✓</span> Source verified
            </p>
            <p className="mt-0.5 text-[10px] text-stone-500">Last processed {processedLabel}</p>
            {onReprocess ? (
              <button
                type="button"
                onClick={onReprocess}
                className="mt-1 text-[11px] font-semibold text-[#7a3344] hover:underline"
              >
                Reprocess
              </button>
            ) : (
              <Link
                href="/dashboard/portfolio/reporting-packages"
                className="mt-1 inline-block text-[11px] font-semibold text-[#7a3344] hover:underline"
              >
                Reprocess
              </Link>
            )}
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Metrics in package
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900">
              {summary.totalMetrics}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Need validation
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700">
              {summary.needsValidation}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Approved
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-700">
              {summary.approved}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.03)] sm:col-span-1 col-span-2 lg:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              Reviewed
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900">
              {summary.reviewed} of {summary.totalMetrics}
            </p>
            <p className="text-[11px] tabular-nums text-stone-500">{summary.reviewedPercent}%</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-[#7a3344]"
                style={{ width: `${summary.reviewedPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-stone-200/80">
          <div
            className="h-full rounded-full bg-[#7a3344] transition-all"
            style={{ width: `${summary.reviewedPercent}%` }}
          />
        </div>

        {/* Metrics panel — content-driven height */}
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
          <div className="flex overflow-x-auto border-b border-stone-200 px-2 pt-0.5">
            {(Object.keys(TAB_LABELS) as MetricReviewTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold ${
                  activeTab === tab
                    ? "border-b-2 border-[#7a3344] text-[#7a3344]"
                    : "border-b-2 border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                {TAB_LABELS[tab]} {tabCounts[tab]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-3 py-2">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={onBulkApprove}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              Approve selected
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={onBulkReject}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-semibold text-stone-700 disabled:opacity-40"
            >
              Reject selected
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={onBulkMarkMissing}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-[11px] font-semibold text-stone-700 disabled:opacity-40"
            >
              Mark selected missing
            </button>
            <button
              type="button"
              onClick={onNextUnresolved}
              className="ml-auto rounded-lg border border-[#7a3344]/20 bg-[#fdf2f4] px-3 py-1.5 text-[11px] font-semibold text-[#7a3344]"
            >
              Next unresolved
            </button>
          </div>

          {metrics.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-stone-500">
              {activeTab === "all"
                ? "No metrics found in this package."
                : "No metrics in this tab."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <MetricReviewTable
                metrics={metrics}
                selectedIds={selectedIds}
                selectedMetricId={selectedMetricId}
                onToggleSelect={onToggleSelect}
                onToggleSelectAll={onToggleSelectAll}
                onSelectMetric={onSelectMetric}
                onApprove={onApprove}
                onEdit={onEdit}
                onReject={onReject}
                onMarkMissing={onMarkMissing}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
