"use client";

/**
 * Metric review: landing queue and per-package workspace.
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import {
  buildCompanyReviewGroups,
  DEFAULT_REVIEW_FILTERS,
  getFilteredPackageMetrics,
  getNextUnresolvedMetric,
  getPreviousUnresolvedMetric,
  getPackageMetrics,
  getPackageReviewItem,
  getPackageReviewSummary,
  getNextReviewPackage,
  getPreviousReviewPackage,
  isUnresolved,
  type MetricReviewTab,
  type NavigatorSort,
  type ReviewQueueFilters,
} from "@/lib/portfolio/metric-review-selectors";
import {
  buildCompanyReviewLandingRows,
  countActiveLandingFilters,
  DEFAULT_LANDING_FILTERS,
  getAssignedCount,
  getFilteredLandingRows,
  getLandingFilterOptions,
  getLandingTabCounts,
  type CompanyReviewLandingRow,
  type LandingFilters,
  type LandingScopeTab,
  type LandingSort,
} from "@/lib/portfolio/metric-review-landing-selectors";
import {
  landingToQueueFilters,
  metricReviewHref,
  parseMetricReviewSearchParams,
} from "@/lib/portfolio/metric-review-url-state";
import {
  canAssignPortfolioReviews,
  getPortfolioReviewerOptions,
  resolvePortfolioAssociateIdentity,
  isLandingRowAssignable,
} from "@/lib/portfolio/bulk-assignment";
import type { ExtractedMetric, ReviewPriority } from "@/lib/portfolio/types";
import { ActiveFilterChips } from "./metric-review/ActiveFilterChips";
import { AddToWaitlistModal, type WaitlistFormValues } from "./metric-review/AddToWaitlistModal";
import { AssignedCompanyTable } from "./metric-review/AssignedCompanyTable";
import { BulkAssignmentModal } from "./metric-review/BulkAssignmentModal";
import {
  BulkDueDateModal,
  BulkPriorityModal,
} from "./metric-review/BulkSelectionToolbar";
import { MetricEvidenceDrawer } from "./metric-review/MetricEvidenceDrawer";
import { MetricReviewLandingHeader } from "./metric-review/MetricReviewLandingHeader";
import { PackageReviewWorkspace } from "./metric-review/PackageReviewWorkspace";
import { ReviewFilterBar } from "./metric-review/ReviewFilterBar";
import {
  resolveLandingEmptyKind,
  ReviewLandingEmptyState,
} from "./metric-review/ReviewLandingEmptyState";
import { ReviewQueueSidebar } from "./metric-review/ReviewQueueSidebar";
import {
  ChangeDueDateModal,
  ChangePriorityModal,
  ReassignReviewerModal,
  type RowMenuAction,
} from "./metric-review/ReviewRowActionsMenu";
import { ReviewScopeTabs } from "./metric-review/ReviewScopeTabs";

type EditForm = {
  extractedValue: string;
  normalizedValue: string;
  unit: string;
  evidenceText: string;
  approve: boolean;
};

type WaitlistModalState = {
  mode: "add" | "edit";
  row: CompanyReviewLandingRow;
} | null;

export function MetricReviewView() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    state,
    hydrated,
    approveMetric,
    editMetric,
    rejectMetric,
    markMetricMissing,
    bulkApproveMetrics,
    bulkRejectMetrics,
    bulkMarkMetricsMissing,
    assignPackageToReviewer,
    assignReviewPackagesBatch,
    restoreAssignmentBatch,
    updatePackageReviewMeta,
    addToReviewWaitlist,
    updateReviewWaitlistItem,
    removeFromReviewWaitlist,
    downloadPackagePdf,
    resolvePackagePdfUrl,
  } = usePortfolio();

  const reviewerId = user?.id ?? "anonymous";
  const reviewerName = user?.name ?? "Alex Rivera";
  const canAssign = canAssignPortfolioReviews(user?.role);
  const urlReady = useRef(false);
  const lastSelectedLandingId = useRef<string | null>(null);

  const [scopeTab, setScopeTab] = useState<LandingScopeTab>("assigned");
  const [landingFilters, setLandingFilters] = useState<LandingFilters>(DEFAULT_LANDING_FILTERS);
  const [landingSort, setLandingSort] = useState<LandingSort>("priority");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [filters, setFilters] = useState<ReviewQueueFilters>(DEFAULT_REVIEW_FILTERS);
  const [sort, setSort] = useState<NavigatorSort>("priority");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<MetricReviewTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingMetric, setEditingMetric] = useState<ExtractedMetric | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    extractedValue: "",
    normalizedValue: "",
    unit: "",
    evidenceText: "",
    approve: false,
  });
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [queueCompleteBanner, setQueueCompleteBanner] = useState(false);

  const [waitlistModal, setWaitlistModal] = useState<WaitlistModalState>(null);
  const [reassignRow, setReassignRow] = useState<CompanyReviewLandingRow | null>(null);
  const [dueDateRow, setDueDateRow] = useState<CompanyReviewLandingRow | null>(null);
  const [priorityRow, setPriorityRow] = useState<CompanyReviewLandingRow | null>(null);

  const [landingSelectedIds, setLandingSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<"page" | "all_filtered">("page");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [bulkDueOpen, setBulkDueOpen] = useState(false);
  const [bulkPriorityOpen, setBulkPriorityOpen] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    batchId?: string | null;
    details?: string[];
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseMetricReviewSearchParams(window.location.search);
    setScopeTab(parsed.scope);
    setLandingFilters(parsed.landingFilters);
    setLandingSort(parsed.landingSort);
    setPage(parsed.page);
    setFilters(landingToQueueFilters(parsed.scope, parsed.landingFilters, reviewerName));
    if (parsed.companyId && parsed.packageId) {
      setSelectedCompanyId(parsed.companyId);
      setSelectedPackageId(parsed.packageId);
      setSelectedMetricId(parsed.metricId);
      setExpandedCompanies(new Set([parsed.companyId!]));
      setWorkspaceOpen(true);
    }
    urlReady.current = true;
  }, []);

  useEffect(() => {
    if (!urlReady.current) return;
    const href = metricReviewHref({
      scope: scopeTab,
      landingFilters,
      landingSort,
      page,
      companyId: workspaceOpen ? selectedCompanyId : null,
      packageId: workspaceOpen ? selectedPackageId : null,
      metricId: workspaceOpen ? selectedMetricId : null,
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== href) {
      router.replace(href, { scroll: false });
    }
  }, [
    scopeTab,
    landingFilters,
    landingSort,
    page,
    selectedCompanyId,
    selectedPackageId,
    selectedMetricId,
    workspaceOpen,
    router,
  ]);

  const allRows = useMemo(
    () => buildCompanyReviewLandingRows(state, reviewerId, reviewerName),
    [state, reviewerId, reviewerName]
  );
  const tabCounts = useMemo(
    () => getLandingTabCounts(allRows, reviewerId),
    [allRows, reviewerId]
  );
  const assignedCount = useMemo(
    () => getAssignedCount(allRows, reviewerId),
    [allRows, reviewerId]
  );
  const filterOptions = useMemo(() => getLandingFilterOptions(state), [state]);
  const filteredRows = useMemo(
    () =>
      getFilteredLandingRows(
        state,
        scopeTab,
        landingFilters,
        landingSort,
        reviewerId,
        reviewerName
      ),
    [state, scopeTab, landingFilters, landingSort, reviewerId, reviewerName]
  );
  const activeFilterCount = countActiveLandingFilters(landingFilters, scopeTab);
  const completedAssignedCount = allRows.filter(
    (r) => r.assigneeId === reviewerId && r.reviewStatus === "Completed"
  ).length;

  const emptyKind = resolveLandingEmptyKind({
    totalCompanies: state.companies.length,
    tab: scopeTab,
    filteredCount: filteredRows.length,
    assignedCount,
    completedAssignedCount,
    hasActiveFilters: activeFilterCount > 0,
  });

  const clearLandingSelection = useCallback(() => {
    setLandingSelectedIds(new Set());
    setSelectionMode("page");
    lastSelectedLandingId.current = null;
  }, []);

  const filtersReady = useRef(false);

  // Clear selection when filtered result set identity changes.
  useEffect(() => {
    if (!filtersReady.current) {
      filtersReady.current = true;
      return;
    }
    if (landingSelectedIds.size === 0 && selectionMode === "page") return;
    clearLandingSelection();
    setSelectionNotice("Selection cleared because the filtered company list changed.");
    const t = window.setTimeout(() => setSelectionNotice(null), 3500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeTab, landingFilters, landingSort]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !assignmentModalOpen && !bulkDueOpen && !bulkPriorityOpen) {
        clearLandingSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assignmentModalOpen, bulkDueOpen, bulkPriorityOpen, clearLandingSelection]);

  const assignableFiltered = useMemo(
    () => filteredRows.filter((r) => isLandingRowAssignable(r).assignable),
    [filteredRows]
  );

  const selectedLandingRows = useMemo(() => {
    if (selectionMode === "all_filtered") return assignableFiltered;
    return filteredRows.filter((r) => landingSelectedIds.has(r.companyId));
  }, [selectionMode, assignableFiltered, filteredRows, landingSelectedIds]);

  const reviewers = useMemo(() => getPortfolioReviewerOptions(state), [state]);

  const companyGroups = useMemo(
    () => buildCompanyReviewGroups(state, filters, sort),
    [state, filters, sort]
  );

  const selectedPackage = useMemo(
    () => state.packages.find((p) => p.id === selectedPackageId) ?? null,
    [state.packages, selectedPackageId]
  );

  const selectedPackageItem = useMemo(() => {
    if (!selectedPackageId) return null;
    for (const g of companyGroups) {
      const pkg = g.packages.find((p) => p.packageId === selectedPackageId);
      if (pkg) return pkg;
    }
    return getPackageReviewItem(state, selectedPackageId);
  }, [companyGroups, selectedPackageId, state]);

  const selectedMetric = useMemo(
    () => state.metrics.find((m) => m.id === selectedMetricId) ?? null,
    [state.metrics, selectedMetricId]
  );

  const [evidencePdfUrl, setEvidencePdfUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedMetric?.packageId) {
      setEvidencePdfUrl(null);
      return;
    }
    const url = resolvePackagePdfUrl(selectedMetric.packageId);
    setEvidencePdfUrl(url);
    return () => {
      // Delay blob revoke so Strict Mode remounts and in-flight preview fetches can finish.
      if (url?.startsWith("blob:")) {
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    };
  }, [selectedMetric?.packageId, resolvePackagePdfUrl]);

  useEffect(() => {
    setPage(1);
  }, [scopeTab, landingFilters, landingSort]);

  useEffect(() => {
    if (!selectedPackageId || !selectedPackage) return;
    const summary = getPackageReviewSummary(state, selectedPackageId);
    const isComplete = summary.needsValidation === 0 && summary.totalMetrics > 0;
    if (!isComplete) {
      setShowCompletion(false);
      setCompletionDismissed(false);
      return;
    }
    if (!completionDismissed) {
      setShowCompletion(true);
      // Close evidence so completion and the Approve footer are not both visible.
      setSelectedMetricId(null);
    }
  }, [state, selectedPackageId, selectedPackage, completionDismissed]);

  const openPackageWorkspace = useCallback(
    (companyId: string, packageId: string) => {
      setSelectedCompanyId(companyId);
      setSelectedPackageId(packageId);
      setSelectedMetricId(null);
      setSelectedIds(new Set());
      setShowCompletion(false);
      setCompletionDismissed(false);
      setQueueCompleteBanner(false);
      setExpandedCompanies(new Set([companyId]));
      setWorkspaceOpen((wasOpen) => {
        if (!wasOpen) {
          setFilters(landingToQueueFilters(scopeTab, landingFilters, reviewerName));
        }
        return true;
      });
    },
    [scopeTab, landingFilters, reviewerName]
  );

  const returnToLanding = useCallback(() => {
    setWorkspaceOpen(false);
    setSelectedCompanyId(null);
    setSelectedPackageId(null);
    setSelectedMetricId(null);
    setSelectedIds(new Set());
    setQueueCompleteBanner(false);
  }, []);

  const advanceAfterAction = useCallback(
    (packageId: string, currentMetricId: string | null) => {
      const remainingOthers = getPackageMetrics(state, packageId).filter(
        (m) => m.id !== currentMetricId && isUnresolved(m)
      );

      if (!autoAdvance) {
        // Stay on the current metric unless the package is now fully reviewed.
        if (remainingOthers.length === 0) setSelectedMetricId(null);
        return;
      }

      const next = getNextUnresolvedMetric(packageId, state, currentMetricId);
      if (next && next.id !== currentMetricId) setSelectedMetricId(next.id);
      else setSelectedMetricId(null);
    },
    [autoAdvance, state]
  );

  const handleApprove = useCallback(
    (id: string) => {
      approveMetric(id);
      advanceAfterAction(selectedPackageId ?? "", id);
    },
    [approveMetric, advanceAfterAction, selectedPackageId]
  );

  const handleReject = useCallback(
    (id: string, reason?: string) => {
      rejectMetric(id, reason);
      advanceAfterAction(selectedPackageId ?? "", id);
    },
    [rejectMetric, advanceAfterAction, selectedPackageId]
  );

  const handleMarkMissing = useCallback(
    (id: string, reason?: string) => {
      markMetricMissing(id, reason);
      advanceAfterAction(selectedPackageId ?? "", id);
    },
    [markMetricMissing, advanceAfterAction, selectedPackageId]
  );

  const startEdit = useCallback((metric: ExtractedMetric) => {
    setEditingMetric(metric);
    setEditForm({
      extractedValue: metric.extractedValue,
      normalizedValue:
        metric.normalizedValue != null ? String(metric.normalizedValue) : "",
      unit: metric.unit,
      evidenceText: metric.evidenceText,
      approve: false,
    });
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingMetric) return;
    editMetric(editingMetric.id, {
      extractedValue: editForm.extractedValue,
      normalizedValue: editForm.normalizedValue
        ? Number(editForm.normalizedValue)
        : null,
      unit: editForm.unit,
      evidenceText: editForm.evidenceText,
      approve: false,
    });
    setEditingMetric(null);
    advanceAfterAction(editingMetric.packageId, editingMetric.id);
  }, [editingMetric, editForm, editMetric, advanceAfterAction]);

  const handlePrimaryAction = useCallback(
    (row: CompanyReviewLandingRow) => {
      if (row.nextAction === "View company" || !row.packageId) {
        router.push(`/dashboard/portfolio/companies/${row.companyId}`);
        return;
      }
      if (row.nextAction === "Retry processing") {
        router.push("/dashboard/portfolio/reporting-packages");
        return;
      }
      if (row.nextAction === "Review now" && !row.assigneeId) {
        assignPackageToReviewer(row.packageId, reviewerId, reviewerName);
      }
      openPackageWorkspace(row.companyId, row.packageId);
    },
    [router, assignPackageToReviewer, reviewerId, reviewerName, openPackageWorkspace]
  );

  const handleMenuAction = useCallback(
    (row: CompanyReviewLandingRow, action: RowMenuAction) => {
      switch (action) {
        case "assignToMe":
          if (row.packageId) {
            assignPackageToReviewer(row.packageId, reviewerId, reviewerName);
          }
          break;
        case "reassign":
          setReassignRow(row);
          break;
        case "addWaitlist":
          setWaitlistModal({ mode: "add", row });
          break;
        case "editWaitlist":
          setWaitlistModal({ mode: "edit", row });
          break;
        case "removeWaitlist":
          if (row.packageId) removeFromReviewWaitlist(row.packageId);
          break;
        case "changeDueDate":
          setDueDateRow(row);
          break;
        case "changePriority":
          setPriorityRow(row);
          break;
        case "viewCompany":
          router.push(`/dashboard/portfolio/companies/${row.companyId}`);
          break;
        case "viewPackage":
          if (row.packageId) openPackageWorkspace(row.companyId, row.packageId);
          break;
        case "downloadPdf":
          if (row.packageId) downloadPackagePdf(row.packageId);
          break;
        case "retryProcessing":
          router.push("/dashboard/portfolio/reporting-packages");
          break;
        case "viewAudit":
          if (row.packageId) openPackageWorkspace(row.companyId, row.packageId);
          break;
        default:
          break;
      }
    },
    [
      assignPackageToReviewer,
      reviewerId,
      reviewerName,
      removeFromReviewWaitlist,
      router,
      openPackageWorkspace,
      downloadPackagePdf,
    ]
  );

  const handleWaitlistSave = useCallback(
    (values: WaitlistFormValues) => {
      if (!waitlistModal?.row.packageId) return;
      const { row, mode } = waitlistModal;
      const packageId = row.packageId;
      if (!packageId) return;
      if (mode === "edit" && row.waitlistItem) {
        updateReviewWaitlistItem(row.waitlistItem.id, {
          scheduledDate: values.scheduledDate,
          priority: values.priority,
          assignedReviewerId: values.assignedReviewerId,
          assignedReviewerName: values.assignedReviewerName,
          note: values.note || undefined,
          reminder: values.reminder,
        });
      } else {
        addToReviewWaitlist({
          packageId,
          companyId: row.companyId,
          scheduledDate: values.scheduledDate,
          priority: values.priority,
          assignedReviewerId: values.assignedReviewerId,
          assignedReviewerName: values.assignedReviewerName,
          note: values.note || undefined,
          reminder: values.reminder,
          createdBy: reviewerName,
        });
      }
      setWaitlistModal(null);
    },
    [waitlistModal, updateReviewWaitlistItem, addToReviewWaitlist, reviewerName]
  );

  const handleScopeTabChange = useCallback(
    (tab: LandingScopeTab) => {
      setScopeTab(tab);
      setLandingFilters((prev) => ({
        ...prev,
        myQueueOnly: false,
        unassignedOnly: false,
      }));
      setFilters(landingToQueueFilters(tab, landingFilters, reviewerName));
    },
    [landingFilters, reviewerName]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-stone-500">
        Loading metric review…
      </div>
    );
  }

  if (workspaceOpen && selectedPackage && selectedPackageItem) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f4f1]">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ReviewQueueSidebar
            state={state}
            filters={filters}
            onFiltersChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            selectedPackageId={selectedPackageId}
            selectedCompanyId={selectedCompanyId}
            expandedCompanies={expandedCompanies}
            onToggleCompany={(id) =>
              setExpandedCompanies((prev) =>
                prev.has(id) ? new Set() : new Set([id])
              )
            }
            onSelectPackage={openPackageWorkspace}
            assignedCount={assignedCount}
          />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            {queueCompleteBanner ? (
              <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
                <h3 className="font-display text-xl text-stone-900">
                  This review queue is complete
                </h3>
                <p className="mt-2 max-w-md text-sm text-stone-500">
                  There are no further packages in the current filtered queue.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={returnToLanding}
                    className="rounded-lg border border-[#7a3344]/50 bg-white px-4 py-2 text-sm font-semibold text-[#7a3344]"
                  >
                    Back to Metric Review
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      returnToLanding();
                      setScopeTab("completed");
                    }}
                    className="rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
                  >
                    View completed reviews
                  </button>
                </div>
              </div>
            ) : (
              <PackageReviewWorkspace
                state={state}
                pkg={selectedPackage}
                packageItem={selectedPackageItem}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                selectedIds={selectedIds}
                selectedMetricId={selectedMetricId}
                filters={filters}
                sort={sort}
                autoAdvance={autoAdvance}
                onAutoAdvanceChange={setAutoAdvance}
                onToggleSelect={(id) =>
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onToggleSelectAll={(checked) => {
                  if (!selectedPackageId) return;
                  const ids = getFilteredPackageMetrics(
                    selectedPackageId,
                    state,
                    activeTab
                  ).map((m) => m.id);
                  setSelectedIds(checked ? new Set(ids) : new Set());
                }}
                onSelectMetric={(m) => setSelectedMetricId(m.id)}
                onApprove={handleApprove}
                onEdit={startEdit}
                onReject={handleReject}
                onMarkMissing={handleMarkMissing}
                onBulkApprove={() => {
                  bulkApproveMetrics([...selectedIds]);
                  setSelectedIds(new Set());
                }}
                onBulkReject={() => {
                  bulkRejectMetrics([...selectedIds]);
                  setSelectedIds(new Set());
                }}
                onBulkMarkMissing={() => {
                  bulkMarkMetricsMissing([...selectedIds]);
                  setSelectedIds(new Set());
                }}
                onNextUnresolved={() => {
                  if (!selectedPackageId) return;
                  const next = getNextUnresolvedMetric(
                    selectedPackageId,
                    state,
                    selectedMetricId,
                    true,
                    true
                  );
                  if (next) setSelectedMetricId(next.id);
                }}
                onPrevPackage={() => {
                  if (!selectedPackageId) return;
                  const prev = getPreviousReviewPackage(
                    state,
                    selectedPackageId,
                    filters,
                    sort
                  );
                  if (prev) openPackageWorkspace(prev.companyId, prev.packageId);
                }}
                onNextPackage={() => {
                  if (!selectedPackageId) return;
                  const next = getNextReviewPackage(
                    state,
                    selectedPackageId,
                    filters,
                    sort
                  );
                  if (next) openPackageWorkspace(next.companyId, next.packageId);
                  else setQueueCompleteBanner(true);
                }}
                onReturnToQueue={returnToLanding}
                showCompletion={showCompletion}
                onViewApprovedMetrics={() => {
                  setCompletionDismissed(true);
                  setShowCompletion(false);
                  setActiveTab("approved");
                }}
                onDownloadSource={() =>
                  selectedPackageId ? downloadPackagePdf(selectedPackageId) : false
                }
                onBackToMetricReview={returnToLanding}
              />
            )}
          </main>

          {selectedMetric ? (
            <MetricEvidenceDrawer
              metric={selectedMetric}
              pkg={selectedPackage}
              allMetrics={state.metrics}
              fileUrl={evidencePdfUrl}
              onClose={() => setSelectedMetricId(null)}
              onApprove={() => handleApprove(selectedMetric.id)}
              onEdit={() => startEdit(selectedMetric)}
              onReject={(reason) => handleReject(selectedMetric.id, reason)}
              onMarkMissing={(reason) => handleMarkMissing(selectedMetric.id, reason)}
              onNextUnresolved={() => {
                if (!selectedPackageId) return;
                const next = getNextUnresolvedMetric(
                  selectedPackageId,
                  state,
                  selectedMetricId,
                  false,
                  true
                );
                if (next) setSelectedMetricId(next.id);
              }}
              onPrevUnresolved={() => {
                if (!selectedPackageId) return;
                const prev = getPreviousUnresolvedMetric(
                  selectedPackageId,
                  state,
                  selectedMetricId
                );
                if (prev) setSelectedMetricId(prev.id);
              }}
            />
          ) : null}
        </div>

        {editingMetric && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
              <h3 className="text-lg font-semibold text-stone-900">
                Edit {editingMetric.metricName}
              </h3>
              <div className="mt-3 space-y-2">
                <input
                  value={editForm.extractedValue}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, extractedValue: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Extracted value"
                />
                <input
                  value={editForm.normalizedValue}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, normalizedValue: e.target.value }))
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Normalized value"
                />
                <input
                  value={editForm.unit}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Unit"
                />
                <textarea
                  value={editForm.evidenceText}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, evidenceText: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Evidence"
                />
                <p className="text-[11px] text-stone-500">
                  Source page {editingMetric.sourcePage || "—"} · Original:{" "}
                  {editingMetric.originalExtractedValue ?? editingMetric.extractedValue}
                </p>
                <p className="rounded-lg bg-stone-50 p-2 text-[11px] text-stone-600">
                  {editingMetric.evidenceText || "No evidence excerpt"}
                </p>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMetric(null)}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white"
                >
                  Save for approval
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f2ef] px-6 py-6">
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-5">
        <div className="shrink-0 space-y-5">
          <MetricReviewLandingHeader
            totalCompanies={state.companies.length}
            assignedCount={assignedCount}
          />

          <ReviewScopeTabs
            active={scopeTab}
            counts={tabCounts}
            onChange={handleScopeTabChange}
          />

          <ReviewFilterBar
            filters={landingFilters}
            onChange={(next) => {
              setLandingFilters(next);
              setFilters(landingToQueueFilters(scopeTab, next, reviewerName));
            }}
            tab={scopeTab}
            sectors={filterOptions.sectors}
            periods={filterOptions.periods}
            reviewers={filterOptions.reviewers}
            sort={landingSort}
            onSortChange={setLandingSort}
          />

          <ActiveFilterChips
            filters={landingFilters}
            tab={scopeTab}
            onChange={(next) => {
              setLandingFilters(next);
              setFilters(landingToQueueFilters(scopeTab, next, reviewerName));
            }}
          />
        </div>

        {emptyKind ? (
          <div className="min-h-0 flex-1">
            <ReviewLandingEmptyState
              kind={emptyKind}
              onViewAll={() => handleScopeTabChange("all")}
              onShowUnassigned={() => {
                setScopeTab("all");
                const next = {
                  ...DEFAULT_LANDING_FILTERS,
                  unassignedOnly: true,
                };
                setLandingFilters(next);
                setFilters(landingToQueueFilters("all", next, reviewerName));
              }}
              onClearFilters={() => {
                setLandingFilters(DEFAULT_LANDING_FILTERS);
                setFilters(
                  landingToQueueFilters(scopeTab, DEFAULT_LANDING_FILTERS, reviewerName)
                );
              }}
              onViewCompleted={() => handleScopeTabChange("completed")}
            />
          </div>
        ) : (
          <AssignedCompanyTable
            rows={filteredRows}
            currentReviewerId={reviewerId}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            onPrimaryAction={handlePrimaryAction}
            onMenuAction={handleMenuAction}
            onCompanyClick={(row) => {
              if (row.packageId) {
                openPackageWorkspace(row.companyId, row.packageId);
              }
            }}
            onDownloadPdf={(row) => {
              if (row.packageId) downloadPackagePdf(row.packageId);
            }}
            selectedCompanyIds={
              selectionMode === "all_filtered"
                ? new Set(assignableFiltered.map((r) => r.companyId))
                : landingSelectedIds
            }
            selectionMode={selectionMode}
            canAssign={canAssign}
            onToggleRow={(companyId, checked, shiftKey) => {
              setSelectionMode("page");
              setLandingSelectedIds((prev) => {
                const next = new Set(prev);
                const pageStart = (page - 1) * pageSize;
                const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);
                const assignableOnPage = pageRows.filter(
                  (r) => isLandingRowAssignable(r).assignable
                );

                if (
                  shiftKey &&
                  lastSelectedLandingId.current &&
                  lastSelectedLandingId.current !== companyId
                ) {
                  const ids = assignableOnPage.map((r) => r.companyId);
                  const a = ids.indexOf(lastSelectedLandingId.current);
                  const b = ids.indexOf(companyId);
                  if (a >= 0 && b >= 0) {
                    const [from, to] = a < b ? [a, b] : [b, a];
                    for (let i = from; i <= to; i++) next.add(ids[i]);
                    return next;
                  }
                }

                if (checked) next.add(companyId);
                else next.delete(companyId);
                lastSelectedLandingId.current = companyId;
                return next;
              });
            }}
            onTogglePage={(checked) => {
              setSelectionMode("page");
              const pageStart = (page - 1) * pageSize;
              const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);
              const assignableOnPage = pageRows.filter(
                (r) => isLandingRowAssignable(r).assignable
              );
              setLandingSelectedIds((prev) => {
                const next = new Set(prev);
                for (const row of assignableOnPage) {
                  if (checked) next.add(row.companyId);
                  else next.delete(row.companyId);
                }
                return next;
              });
            }}
            onClearSelection={clearLandingSelection}
            onSelectAllFiltered={() => {
              setSelectionMode("all_filtered");
              setLandingSelectedIds(
                new Set(assignableFiltered.map((r) => r.companyId))
              );
            }}
            onBulkAssign={() => setAssignmentModalOpen(true)}
            onBulkDueDate={() => setBulkDueOpen(true)}
            onBulkPriority={() => setBulkPriorityOpen(true)}
          />
        )}
      </div>

      {selectionNotice ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 shadow-lg">
          {selectionNotice}
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-stone-900">{toast.message}</p>
          {toast.details && toast.details.length > 0 ? (
            <ul className="mt-1 list-disc pl-4 text-xs text-stone-500">
              {toast.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-2 flex gap-3">
            {toast.batchId ? (
              <button
                type="button"
                onClick={() => {
                  const result = restoreAssignmentBatch(toast.batchId!);
                  setToast({ message: result.message });
                  clearLandingSelection();
                }}
                className="text-xs font-semibold text-[#7a3344] hover:underline"
              >
                Undo
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-semibold text-stone-500 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <BulkAssignmentModal
        open={assignmentModalOpen}
        rows={selectedLandingRows}
        state={state}
        reviewers={reviewers}
        currentUserId={reviewerId}
        currentUserName={reviewerName}
        onClose={() => setAssignmentModalOpen(false)}
        onConfirm={(input) => {
          if (!canAssign) {
            setToast({ message: "You do not have permission to assign reviews." });
            return;
          }
          const rowsSnapshot = [...selectedLandingRows];
          const result = assignReviewPackagesBatch({
            companyIds: rowsSnapshot.map((r) => r.companyId),
            packageScope: input.packageScope,
            reviewerId: input.reviewerId,
            reviewerName: input.reviewerName,
            dueDate: input.dueDate,
            priority: input.priority,
            note: input.note || undefined,
            assignedById: reviewerId,
            assignedByName: reviewerName,
            canAssign,
          });
          setAssignmentModalOpen(false);
          clearLandingSelection();
          const name = input.reviewerName ?? "Unassigned";
          const verb = rowsSnapshot.some((r) => r.assigneeId) ? "reassigned" : "assigned";
          setToast({
            message:
              result.failed.length === 0
                ? `${rowsSnapshot.length} companies ${verb} to ${name}.`
                : `${result.assignedCount} companies were assigned. ${result.failed.length} could not be updated.`,
            batchId: result.batchId,
            details: result.failed.map((f) => {
              const row = rowsSnapshot.find((r) => r.companyId === f.companyId);
              return `${row?.companyName ?? f.companyId}: ${f.reason}`;
            }),
          });
        }}
      />

      <BulkDueDateModal
        open={bulkDueOpen}
        count={selectedLandingRows.length}
        onClose={() => setBulkDueOpen(false)}
        onSave={(iso) => {
          const rowsSnapshot = [...selectedLandingRows];
          for (const row of rowsSnapshot) {
            if (row.packageId) {
              updatePackageReviewMeta(row.packageId, { dueDate: iso });
            }
          }
          setBulkDueOpen(false);
          clearLandingSelection();
          setToast({
            message: `Due date updated for ${rowsSnapshot.length} companies.`,
          });
        }}
      />

      <BulkPriorityModal
        open={bulkPriorityOpen}
        count={selectedLandingRows.length}
        onClose={() => setBulkPriorityOpen(false)}
        onSave={(priority: ReviewPriority) => {
          const rowsSnapshot = [...selectedLandingRows];
          for (const row of rowsSnapshot) {
            if (row.packageId) {
              updatePackageReviewMeta(row.packageId, { reviewPriority: priority });
            }
          }
          setBulkPriorityOpen(false);
          clearLandingSelection();
          setToast({
            message: `Priority updated for ${rowsSnapshot.length} companies.`,
          });
        }}
      />

      <AddToWaitlistModal
        open={Boolean(waitlistModal)}
        mode={waitlistModal?.mode ?? "add"}
        companyName={waitlistModal?.row.companyName ?? ""}
        packageLabel={
          waitlistModal
            ? `${waitlistModal.row.reportTitle} · ${waitlistModal.row.reportPeriod}`
            : ""
        }
        existing={waitlistModal?.row.waitlistItem ?? null}
        defaultReviewerId={reviewerId}
        defaultReviewerName={reviewerName}
        onClose={() => setWaitlistModal(null)}
        onSave={handleWaitlistSave}
      />

      <ReassignReviewerModal
        open={Boolean(reassignRow)}
        currentName={reassignRow?.assigneeName ?? null}
        onClose={() => setReassignRow(null)}
        onSave={(name) => {
          if (reassignRow?.packageId) {
            const identity = resolvePortfolioAssociateIdentity(name);
            updatePackageReviewMeta(reassignRow.packageId, {
              assignedReviewerId: identity.id,
              assignedReviewerName: identity.name,
            });
          }
          setReassignRow(null);
        }}
      />

      <ChangeDueDateModal
        open={Boolean(dueDateRow)}
        currentDueDate={dueDateRow?.dueDate ?? null}
        onClose={() => setDueDateRow(null)}
        onSave={(iso) => {
          if (dueDateRow?.packageId) {
            updatePackageReviewMeta(dueDateRow.packageId, { dueDate: iso });
          }
          setDueDateRow(null);
        }}
      />

      <ChangePriorityModal
        open={Boolean(priorityRow)}
        current={(priorityRow?.priority ?? "Normal") as ReviewPriority}
        onClose={() => setPriorityRow(null)}
        onSave={(priority) => {
          if (priorityRow?.packageId) {
            updatePackageReviewMeta(priorityRow.packageId, {
              reviewPriority: priority,
            });
          }
          setPriorityRow(null);
        }}
      />
    </div>
  );
}
