"use client";

import { useMemo, useRef } from "react";
import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity/CompanyIdentity";
import { isLandingRowAssignable } from "@/lib/portfolio/bulk-assignment";
import type {
  CompanyReviewLandingRow,
  LandingNextAction,
} from "@/lib/portfolio/metric-review-landing-selectors";
import { AssigneeDueDateCell } from "./AssigneeDueDateCell";
import { BulkSelectionToolbar } from "./BulkSelectionToolbar";
import { ReviewProgressCell } from "./ReviewProgressCell";
import {
  ReviewRowActionsMenu,
  type RowMenuAction,
} from "./ReviewRowActionsMenu";
import { ReviewStatusDisplay } from "./ReviewStatusDisplay";

export function AssignedCompanyTable({
  rows,
  currentReviewerId,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onPrimaryAction,
  onMenuAction,
  onCompanyClick,
  onDownloadPdf,
  selectedCompanyIds,
  selectionMode,
  canAssign,
  onToggleRow,
  onTogglePage,
  onClearSelection,
  onSelectAllFiltered,
  onBulkAssign,
  onBulkDueDate,
  onBulkPriority,
}: {
  rows: CompanyReviewLandingRow[];
  currentReviewerId: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onPrimaryAction: (row: CompanyReviewLandingRow) => void;
  onMenuAction: (row: CompanyReviewLandingRow, action: RowMenuAction) => void;
  onCompanyClick: (row: CompanyReviewLandingRow) => void;
  onDownloadPdf: (row: CompanyReviewLandingRow) => void;
  selectedCompanyIds: Set<string>;
  selectionMode: "page" | "all_filtered";
  canAssign: boolean;
  onToggleRow: (companyId: string, checked: boolean, shiftKey: boolean) => void;
  onTogglePage: (checked: boolean) => void;
  onClearSelection: () => void;
  onSelectAllFiltered: () => void;
  onBulkAssign: () => void;
  onBulkDueDate: () => void;
  onBulkPriority: () => void;
}) {
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const lastClickedRef = useRef<string | null>(null);

  const pageAssignable = useMemo(
    () => pageRows.filter((r) => isLandingRowAssignable(r).assignable),
    [pageRows]
  );
  const allAssignable = useMemo(
    () => rows.filter((r) => isLandingRowAssignable(r).assignable),
    [rows]
  );

  const selectedOnPage = pageAssignable.filter((r) =>
    selectedCompanyIds.has(r.companyId)
  );
  const headerChecked =
    pageAssignable.length > 0 &&
    selectedOnPage.length === pageAssignable.length;
  const headerIndeterminate =
    selectedOnPage.length > 0 && selectedOnPage.length < pageAssignable.length;

  const selectedRows = useMemo(() => {
    if (selectionMode === "all_filtered") return allAssignable;
    return rows.filter((r) => selectedCompanyIds.has(r.companyId));
  }, [rows, selectedCompanyIds, selectionMode, allAssignable]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {selectedCompanyIds.size > 0 || selectionMode === "all_filtered" ? (
        <BulkSelectionToolbar
          selectedRows={selectedRows}
          pageAssignableCount={pageAssignable.length}
          totalFilteredAssignable={allAssignable.length}
          selectionMode={selectionMode}
          canAssign={canAssign}
          onClear={onClearSelection}
          onSelectAllFiltered={onSelectAllFiltered}
          onAssign={onBulkAssign}
          onSetDueDate={onBulkDueDate}
          onChangePriority={onBulkPriority}
        />
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed min-w-[1000px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-stone-100 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={headerChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = headerIndeterminate;
                  }}
                  onChange={(e) => onTogglePage(e.target.checked)}
                  aria-label="Select all companies on this page"
                  className="h-3.5 w-3.5 rounded border-stone-300 text-[#7a3344] focus:ring-[#7a3344]"
                />
              </th>
              <th className="w-[20%] px-3 py-3">Company</th>
              <th className="w-[20%] px-3 py-3">Latest package</th>
              <th className="w-[13%] px-3 py-3">Review status</th>
              <th className="w-[13%] px-3 py-3">Progress</th>
              <th className="w-[13%] px-3 py-3">Assignee / due date</th>
              <th className="w-[12%] px-3 py-3">Next action</th>
              <th className="w-[4%] px-2 py-3">
                <span className="sr-only">More</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const eligibility = isLandingRowAssignable(row);
              const selected = selectedCompanyIds.has(row.companyId);
              return (
                <tr
                  key={row.companyId}
                  className={`border-b border-stone-50 last:border-0 ${
                    selected
                      ? "bg-[#fdf2f4]/70"
                      : "hover:bg-stone-50/50"
                  } ${!eligibility.assignable ? "opacity-70" : ""}`}
                >
                  <td className="px-3 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={!eligibility.assignable}
                      title={
                        eligibility.assignable
                          ? `Select ${row.companyName}`
                          : eligibility.reason
                      }
                      aria-label={`Select ${row.companyName}`}
                      onChange={(e) => {
                        onToggleRow(row.companyId, e.target.checked, (e.nativeEvent as MouseEvent).shiftKey);
                        lastClickedRef.current = row.companyId;
                      }}
                      className="h-3.5 w-3.5 rounded border-stone-300 text-[#7a3344] focus:ring-[#7a3344] disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="max-w-0 px-3 py-3.5 align-middle">
                    <CompanyIdentity
                      companyId={row.companyId}
                      companyName={row.companyName}
                      secondaryText={row.sector}
                      onNameClick={() => onCompanyClick(row)}
                    />
                  </td>
                  <td className="max-w-0 px-3 py-3.5 align-middle">
                    {row.packageId ? (
                      <div className="min-w-0 overflow-hidden">
                        <p
                          className="truncate text-[13px] font-medium text-stone-900"
                          title={row.reportTitle}
                        >
                          {row.reportTitle}
                        </p>
                        <button
                          type="button"
                          onClick={() => onDownloadPdf(row)}
                          title={`Download ${row.fileName}`}
                          className="mt-0.5 block max-w-full truncate text-left text-[11px] font-medium text-emerald-700 hover:underline"
                        >
                          {row.fileName}
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-stone-400">No package yet</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <ReviewStatusDisplay status={row.reviewStatus} priority={row.priority} />
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <ReviewProgressCell
                      reviewedCount={row.reviewedCount}
                      totalMetrics={row.totalMetrics}
                      progressPercent={row.progressPercent}
                      status={row.reviewStatus}
                    />
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <AssigneeDueDateCell
                      assigneeName={row.assigneeName}
                      dueDate={row.dueDate}
                      overdueDays={row.overdueDays}
                      lastReviewedAt={row.lastReviewedAt}
                    />
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <button
                      type="button"
                      onClick={() => onPrimaryAction(row)}
                      className="whitespace-nowrap rounded-lg border border-[#7a3344]/30 px-2.5 py-1.5 text-[11px] font-semibold text-[#7a3344] hover:bg-[#fdf2f4]"
                    >
                      {primaryLabel(row.nextAction)}
                    </button>
                  </td>
                  <td className="px-2 py-3.5 align-middle">
                    <ReviewRowActionsMenu
                      row={row}
                      isCurrentAssignee={row.assigneeId === currentReviewerId}
                      onAction={(action) => onMenuAction(row, action)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-xs text-stone-500">
        <p>
          Showing {total === 0 ? 0 : start + 1} to {Math.min(start + pageSize, total)} of{" "}
          {total} companies
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-md border border-stone-200 px-2 py-1 disabled:opacity-40"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
            const n = i + 1;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                className={`rounded-md px-2 py-1 ${
                  page === n ? "bg-[#7a3344] text-white" : "border border-stone-200"
                }`}
              >
                {n}
              </button>
            );
          })}
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-stone-200 px-2 py-1 disabled:opacity-40"
          >
            ›
          </button>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-stone-200 px-2 py-1"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function primaryLabel(action: LandingNextAction): string {
  return action;
}
