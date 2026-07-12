import { formatCompanyDisplayName } from "./company-identity";
import { formatPackagePeriodTitle } from "./reporting-packages-demo";
import { getActivePortfolioSectors } from "./sector-classification";
import {
  getPackageMetrics,
  getPackageReviewSummary,
  getReviewPriorityScore,
  isUnresolved,
} from "./metric-review-selectors";
import type {
  CompanyReviewStatus,
  PortfolioState,
  ReportingPackage,
  ReviewPriority,
  ReviewWaitlistItem,
} from "./types";

export type LandingScopeTab = "assigned" | "all" | "needsAttention" | "completed";

export type LandingSort =
  | "priority"
  | "dueDate"
  | "companyName"
  | "mostProgress"
  | "leastProgress"
  | "recentlyProcessed";

export type LandingFilters = {
  search: string;
  sector: string;
  period: string;
  status: string;
  confidence: string;
  myQueueOnly: boolean;
  priority: string;
  reviewer: string;
  overdueOnly: boolean;
  extractionFailuresOnly: boolean;
  missingReportOnly: boolean;
  unassignedOnly: boolean;
  waitlistedOnly: boolean;
  hasRejectedMetrics: boolean;
  hasEditedMetrics: boolean;
};

export const DEFAULT_LANDING_FILTERS: LandingFilters = {
  search: "",
  sector: "all",
  period: "all",
  status: "all",
  confidence: "all",
  myQueueOnly: false,
  priority: "all",
  reviewer: "all",
  overdueOnly: false,
  extractionFailuresOnly: false,
  missingReportOnly: false,
  unassignedOnly: false,
  waitlistedOnly: false,
  hasRejectedMetrics: false,
  hasEditedMetrics: false,
};

export type LandingNextAction =
  | "Continue review"
  | "Review now"
  | "Resolve issue"
  | "View completed"
  | "View company"
  | "Retry processing";

export type CompanyReviewLandingRow = {
  companyId: string;
  companyName: string;
  sector: string;
  packageId: string | null;
  reportTitle: string;
  fileName: string;
  reportPeriod: string;
  reviewStatus: CompanyReviewStatus;
  priority: ReviewPriority;
  reviewedCount: number;
  totalMetrics: number;
  progressPercent: number;
  assigneeName: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  overdueDays: number | null;
  lastReviewedAt: string | null;
  nextAction: LandingNextAction;
  isWaitlisted: boolean;
  waitlistItem: ReviewWaitlistItem | null;
  sortPriority: number;
  processedAt: string | null;
};

function packageProcessedAt(pkg: ReportingPackage): number {
  return new Date(pkg.processedAt ?? pkg.uploadedAt).getTime();
}

function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function getLatestPackageForCompany(
  state: PortfolioState,
  companyId: string
): ReportingPackage | null {
  const pkgs = state.packages
    .filter((p) => p.companyId === companyId)
    .sort((a, b) => packageProcessedAt(b) - packageProcessedAt(a));
  return pkgs[0] ?? null;
}

export function mapPriorityScore(score: number): ReviewPriority {
  if (score >= 800) return "Urgent";
  if (score >= 400) return "High";
  if (score >= 150) return "Normal";
  return "Low";
}

export function getCompanyReviewStatus(
  state: PortfolioState,
  companyId: string,
  pkg: ReportingPackage | null,
  waitlist: ReviewWaitlistItem[]
): CompanyReviewStatus {
  if (!pkg) return "Awaiting report";
  if (pkg.status === "Failed") return "Extraction failed";
  if (pkg.status === "Processing") return "In review";

  const waitlisted = waitlist.some((w) => w.packageId === pkg.id);
  if (waitlisted) return "Waitlisted";

  const summary = getPackageReviewSummary(state, pkg.id);
  if (summary.totalMetrics > 0 && summary.needsValidation === 0) return "Completed";

  const metrics = getPackageMetrics(state, pkg.id);
  const unresolved = metrics.filter(isUnresolved);
  const lowConf = unresolved.some((m) => m.confidence === "Low");
  const overdue =
    pkg.dueDate != null
      ? daysUntil(pkg.dueDate) < 0
      : unresolved.length > 0 && ageInDays(pkg.processedAt ?? pkg.uploadedAt) >= 14;

  if (overdue || lowConf || unresolved.length >= 4) return "Needs attention";
  if (!pkg.assignedReviewerId && unresolved.length > 0) return "Awaiting assignment";
  if (unresolved.length > 0) return "In review";
  if (summary.totalMetrics === 0 && pkg.status === "Processed") return "Needs attention";
  return "Awaiting assignment";
}

export function getNextReviewAction(status: CompanyReviewStatus): LandingNextAction {
  switch (status) {
    case "In review":
      return "Continue review";
    case "Awaiting assignment":
      return "Review now";
    case "Needs attention":
    case "Waitlisted":
      return "Resolve issue";
    case "Completed":
      return "View completed";
    case "Awaiting report":
      return "View company";
    case "Extraction failed":
      return "Retry processing";
    default:
      return "Review now";
  }
}

export function isPackageWaitlisted(state: PortfolioState, packageId: string): boolean {
  return (state.reviewWaitlist ?? []).some((w) => w.packageId === packageId);
}

export function buildCompanyReviewLandingRows(
  state: PortfolioState,
  currentReviewerId: string,
  currentReviewerName: string
): CompanyReviewLandingRow[] {
  const waitlist = state.reviewWaitlist ?? [];
  const rows: CompanyReviewLandingRow[] = [];

  for (const company of state.companies) {
    const pkg = getLatestPackageForCompany(state, company.id);
    const waitlistItem = pkg
      ? waitlist.find((w) => w.packageId === pkg.id) ?? null
      : null;
    const reviewStatus = getCompanyReviewStatus(state, company.id, pkg, waitlist);
    const summary = pkg
      ? getPackageReviewSummary(state, pkg.id)
      : {
          totalMetrics: 0,
          needsValidation: 0,
          approved: 0,
          reviewed: 0,
          reviewedPercent: 0,
          lowConfidence: 0,
          missing: 0,
          rejected: 0,
        };

    const metrics = pkg ? getPackageMetrics(state, pkg.id) : [];
    const priorityScore = pkg
      ? getReviewPriorityScore({ pkg, metrics })
      : 50;
    const priority = pkg?.reviewPriority ?? mapPriorityScore(priorityScore);

    let overdueDays: number | null = null;
    if (pkg?.dueDate) {
      const until = daysUntil(pkg.dueDate);
      if (until < 0) overdueDays = Math.abs(until);
    }

    const lastReviewed = metrics
      .filter((m) => m.reviewedAt)
      .sort(
        (a, b) =>
          new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime()
      )[0];

    rows.push({
      companyId: company.id,
      companyName: formatCompanyDisplayName(company.name),
      sector: company.sector,
      packageId: pkg?.id ?? null,
      reportTitle: pkg
        ? formatPackagePeriodTitle(pkg.reportPeriod, pkg.fileName, pkg.sourceFormat)
        : "—",
      fileName: pkg?.fileName ?? "",
      reportPeriod: pkg?.reportPeriod ?? "—",
      reviewStatus,
      priority,
      reviewedCount: summary.reviewed,
      totalMetrics: summary.totalMetrics,
      progressPercent: summary.reviewedPercent,
      assigneeName: pkg?.assignedReviewerName ?? null,
      assigneeId: pkg?.assignedReviewerId ?? null,
      dueDate: pkg?.dueDate ?? null,
      overdueDays,
      lastReviewedAt: lastReviewed?.reviewedAt ?? null,
      nextAction: getNextReviewAction(reviewStatus),
      isWaitlisted: Boolean(waitlistItem),
      waitlistItem,
      sortPriority: priorityScore,
      processedAt: pkg?.processedAt ?? pkg?.uploadedAt ?? null,
    });
  }

  return rows;
}

export function getLandingTabCounts(
  rows: CompanyReviewLandingRow[],
  currentReviewerId: string
) {
  return {
    assigned: rows.filter((r) => r.assigneeId === currentReviewerId).length,
    all: rows.length,
    needsAttention: rows.filter((r) =>
      ["Needs attention", "Extraction failed"].includes(r.reviewStatus)
    ).length,
    completed: rows.filter((r) => r.reviewStatus === "Completed").length,
  };
}

export function getAssignedCount(
  rows: CompanyReviewLandingRow[],
  currentReviewerId: string
): number {
  return rows.filter((r) => r.assigneeId === currentReviewerId).length;
}

function matchesLandingFilters(
  row: CompanyReviewLandingRow,
  filters: LandingFilters,
  currentReviewerId: string,
  state: PortfolioState
): boolean {
  if (filters.myQueueOnly && row.assigneeId !== currentReviewerId) return false;
  if (filters.sector !== "all" && row.sector !== filters.sector) return false;
  if (filters.period !== "all" && row.reportPeriod !== filters.period) return false;
  if (filters.status !== "all" && row.reviewStatus !== filters.status) return false;
  if (filters.priority !== "all" && row.priority !== filters.priority) return false;
  if (filters.reviewer !== "all") {
    if (filters.reviewer === "unassigned" && row.assigneeName) return false;
    if (filters.reviewer !== "unassigned" && row.assigneeName !== filters.reviewer) {
      return false;
    }
  }
  if (filters.unassignedOnly && row.assigneeId) return false;
  if (filters.waitlistedOnly && !row.isWaitlisted) return false;
  if (filters.overdueOnly && row.overdueDays == null) return false;
  if (filters.extractionFailuresOnly && row.reviewStatus !== "Extraction failed") {
    return false;
  }
  if (filters.missingReportOnly && row.reviewStatus !== "Awaiting report") return false;

  if (filters.hasRejectedMetrics && row.packageId) {
    const metrics = getPackageMetrics(state, row.packageId);
    if (!metrics.some((m) => m.status === "Rejected")) return false;
  } else if (filters.hasRejectedMetrics) {
    return false;
  }

  if (filters.hasEditedMetrics && row.packageId) {
    const metrics = getPackageMetrics(state, row.packageId);
    if (
      !metrics.some(
        (m) =>
          m.originalExtractedValue != null &&
          m.originalExtractedValue !== m.extractedValue
      )
    ) {
      return false;
    }
  } else if (filters.hasEditedMetrics) {
    return false;
  }

  if (filters.confidence !== "all" && row.packageId) {
    const metrics = getPackageMetrics(state, row.packageId).filter(isUnresolved);
    if (!metrics.some((m) => m.confidence === filters.confidence)) return false;
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const blob = `${row.companyName} ${row.reportTitle} ${row.fileName} ${row.reportPeriod} ${row.sector}`.toLowerCase();
    if (!blob.includes(q)) {
      // also search metric names
      if (row.packageId) {
        const metrics = getPackageMetrics(state, row.packageId);
        if (!metrics.some((m) => m.metricName.toLowerCase().includes(q))) return false;
      } else {
        return false;
      }
    }
  }

  return true;
}

export function getFilteredLandingRows(
  state: PortfolioState,
  tab: LandingScopeTab,
  filters: LandingFilters,
  sort: LandingSort,
  currentReviewerId: string,
  currentReviewerName: string
): CompanyReviewLandingRow[] {
  let rows = buildCompanyReviewLandingRows(state, currentReviewerId, currentReviewerName);

  switch (tab) {
    case "assigned":
      rows = rows.filter((r) => r.assigneeId === currentReviewerId);
      break;
    case "needsAttention":
      rows = rows.filter((r) =>
        ["Needs attention", "Extraction failed"].includes(r.reviewStatus)
      );
      break;
    case "completed":
      rows = rows.filter((r) => r.reviewStatus === "Completed");
      break;
    default:
      break;
  }

  rows = rows.filter((r) =>
    matchesLandingFilters(r, filters, currentReviewerId, state)
  );

  return sortLandingRows(rows, sort);
}

function sortLandingRows(
  rows: CompanyReviewLandingRow[],
  sort: LandingSort
): CompanyReviewLandingRow[] {
  const copy = [...rows];
  switch (sort) {
    case "companyName":
      copy.sort((a, b) => a.companyName.localeCompare(b.companyName));
      break;
    case "dueDate":
      copy.sort((a, b) => {
        const aT = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bT = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aT - bT;
      });
      break;
    case "mostProgress":
      copy.sort((a, b) => b.progressPercent - a.progressPercent);
      break;
    case "leastProgress":
      copy.sort((a, b) => a.progressPercent - b.progressPercent);
      break;
    case "recentlyProcessed":
      copy.sort((a, b) => {
        const aT = a.processedAt ? new Date(a.processedAt).getTime() : 0;
        const bT = b.processedAt ? new Date(b.processedAt).getTime() : 0;
        return bT - aT;
      });
      break;
    default:
      copy.sort((a, b) => {
        if (b.sortPriority !== a.sortPriority) return b.sortPriority - a.sortPriority;
        const aT = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bT = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aT - bT;
      });
  }
  return copy;
}

export function getLandingFilterOptions(state: PortfolioState) {
  const sectors = getActivePortfolioSectors(state.companies);
  const periods = Array.from(new Set(state.packages.map((p) => p.reportPeriod))).sort();
  const reviewerByKey = new Map<string, string>();
  for (const name of state.packages.map((p) => p.assignedReviewerName).filter(Boolean) as string[]) {
    const key = name.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key || reviewerByKey.has(key)) continue;
    reviewerByKey.set(key, name.trim());
  }
  const reviewers = [...reviewerByKey.values()].sort((a, b) => a.localeCompare(b));
  return { sectors, periods, reviewers };
}

export function countActiveLandingFilters(filters: LandingFilters, tab: LandingScopeTab): number {
  let n = 0;
  if (filters.search.trim()) n += 1;
  if (filters.sector !== "all") n += 1;
  if (filters.period !== "all") n += 1;
  if (filters.status !== "all") n += 1;
  if (filters.confidence !== "all") n += 1;
  if (filters.priority !== "all") n += 1;
  if (filters.reviewer !== "all") n += 1;
  if (filters.overdueOnly) n += 1;
  if (filters.extractionFailuresOnly) n += 1;
  if (filters.missingReportOnly) n += 1;
  if (filters.unassignedOnly) n += 1;
  if (filters.waitlistedOnly) n += 1;
  if (filters.hasRejectedMetrics) n += 1;
  if (filters.hasEditedMetrics) n += 1;
  if (filters.myQueueOnly && tab !== "assigned") n += 1;
  return n;
}
