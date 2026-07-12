/**
 * Builds the metric review queue: filters, sorting, package summaries, and
 * navigation helpers for reviewers working through extracted metrics.
 */

import { inferReportType } from "./reporting-packages-demo";
import { dedupeMetrics } from "./store-utils";
import { getActivePortfolioSectors } from "./sector-classification";
import { ALL_METRICS } from "./types";
import type {
  ExtractedMetric,
  MetricAuditEntry,
  MetricStatus,
  PortfolioState,
  ReportingPackage,
} from "./types";

export type NavigatorView = "queue" | "byCompany" | "recentlyReviewed";

export type NavigatorSort =
  | "priority"
  | "companyName"
  | "mostUnresolved"
  | "oldestUnresolved"
  | "recentlyProcessed";

export type MetricReviewTab =
  | "all"
  | "needsValidation"
  | "lowConfidence"
  | "approved"
  | "missing";

export type ReviewQueueQuickView =
  | "all"
  | "remaining"
  | "in-review"
  | "blocked"
  | "completed";

export type ReviewQueueFilters = {
  search: string;
  sector: string;
  period: string;
  status: string;
  confidence: string;
  reviewer: string;
  overdueOnly: boolean;
  extractionFailuresOnly: boolean;
  quickView: ReviewQueueQuickView;
};

export const DEFAULT_REVIEW_FILTERS: ReviewQueueFilters = {
  search: "",
  sector: "all",
  period: "all",
  status: "all",
  confidence: "all",
  reviewer: "all",
  overdueOnly: false,
  extractionFailuresOnly: false,
  quickView: "all",
};

export type PackageReviewItem = {
  packageId: string;
  companyId: string;
  companyName: string;
  reportPeriod: string;
  reportTitle: string;
  fileName: string;
  unresolvedCount: number;
  isComplete: boolean;
  status: ReportingPackage["status"];
  priorityScore: number;
  processedAt: string;
  lowConfidenceCount: number;
  errorMessage?: string;
};

export type CompanyReviewGroup = {
  companyId: string;
  companyName: string;
  sector: string;
  unresolvedCount: number;
  priorityScore: number;
  packages: PackageReviewItem[];
  latestProcessedAt: string | null;
};

export type PackageReviewSummary = {
  totalMetrics: number;
  needsValidation: number;
  approved: number;
  reviewed: number;
  reviewedPercent: number;
  lowConfidence: number;
  missing: number;
  rejected: number;
};

export type ReviewQueueItem = {
  metric: ExtractedMetric;
  package: ReportingPackage;
  reportTitle: string;
  issue: string;
  ageDays: number;
  priorityScore: number;
};

export type DisplayMetricStatus = MetricStatus | "Edited — needs approval";

const TERMINAL_STATUSES: MetricStatus[] = [
  "Approved for reporting",
  "Rejected",
  "Missing from report",
];

/** True when a metric has a final decision (approved, rejected, or marked missing). */
export function isTerminalStatus(status: MetricStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** True when a metric still needs a reviewer to approve or reject it. */
export function isUnresolved(metric: ExtractedMetric): boolean {
  return metric.status === "Needs validation";
}

/** True when someone changed the extracted value but has not approved it yet. */
export function isEditedPendingApproval(metric: ExtractedMetric): boolean {
  if (metric.status !== "Needs validation") return false;
  const orig = metric.originalExtractedValue ?? metric.extractedValue;
  const origNorm = metric.originalNormalizedValue ?? metric.normalizedValue;
  return orig !== metric.extractedValue || origNorm !== metric.normalizedValue;
}

/** Status shown in the UI, including a special label for edited-but-unapproved metrics. */
export function getDisplayMetricStatus(metric: ExtractedMetric): DisplayMetricStatus {
  if (isEditedPendingApproval(metric)) return "Edited — needs approval";
  return metric.status;
}

/** Sort metrics in the standard catalog order (Revenue, ARR, EBITDA, etc.). */
export function metricSortOrder(a: ExtractedMetric, b: ExtractedMetric): number {
  const ai = ALL_METRICS.indexOf(a.metricName as (typeof ALL_METRICS)[number]);
  const bi = ALL_METRICS.indexOf(b.metricName as (typeof ALL_METRICS)[number]);
  const aOrder = ai === -1 ? 999 : ai;
  const bOrder = bi === -1 ? 999 : bi;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return a.metricName.localeCompare(b.metricName);
}

function packageProcessedAt(pkg: ReportingPackage): number {
  return new Date(pkg.processedAt ?? pkg.uploadedAt).getTime();
}

function ageInDays(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** Short label explaining why a metric needs review (low confidence, forecast, etc.). */
export function inferReviewIssue(metric: ExtractedMetric): string {
  if (metric.confidence === "Low") return "Low extraction confidence";
  const evidence = metric.evidenceText.toLowerCase();
  const value = metric.extractedValue.toLowerCase();
  if (evidence.includes("forecast") || value.includes("forecast")) {
    return "Forecast ambiguity";
  }
  if (evidence.includes("multiple") || evidence.includes("conflict")) {
    return "Multiple matching values";
  }
  if (metric.evidenceText.includes("not found")) return "Missing expected metric";
  return "Needs validation";
}

/** Higher score means review this package sooner (failed, old, or many open items). */
export function getReviewPriorityScore(input: {
  pkg: ReportingPackage;
  metrics: ExtractedMetric[];
}): number {
  const { pkg, metrics } = input;
  if (pkg.status === "Failed") return 1000;

  const unresolved = metrics.filter(isUnresolved);
  if (unresolved.length === 0 && pkg.status === "Processed") return 10;

  let score = 100;
  score += unresolved.filter((m) => m.confidence === "Low").length * 40;
  score += unresolved.length * 5;
  score += Math.min(ageInDays(pkg.processedAt ?? pkg.uploadedAt) * 3, 120);
  if (pkg.status === "Processing") score += 200;
  return score;
}

/** All metrics for one package, deduplicated and sorted by catalog order. */
export function getPackageMetrics(
  state: PortfolioState,
  packageId: string
): ExtractedMetric[] {
  return dedupeMetrics(state.metrics.filter((m) => m.packageId === packageId)).sort(
    metricSortOrder
  );
}

/** Summary row for one package in the review queue navigator. */
export function getPackageReviewItem(
  state: PortfolioState,
  packageId: string
): PackageReviewItem | null {
  const pkg = state.packages.find((p) => p.id === packageId);
  if (!pkg) return null;
  const metrics = getPackageMetrics(state, pkg.id);
  const unresolvedCount = metrics.filter(isUnresolved).length;
  return {
    packageId: pkg.id,
    companyId: pkg.companyId,
    companyName: pkg.companyName,
    reportPeriod: pkg.reportPeriod,
    reportTitle: inferReportType(pkg.fileName, pkg.sourceFormat),
    fileName: pkg.fileName,
    unresolvedCount,
    isComplete: pkg.status === "Processed" && unresolvedCount === 0 && metrics.length > 0,
    status: pkg.status,
    priorityScore: getReviewPriorityScore({ pkg, metrics }),
    processedAt: pkg.processedAt ?? pkg.uploadedAt,
    lowConfidenceCount: metrics.filter((m) => isUnresolved(m) && m.confidence === "Low").length,
    errorMessage: pkg.errorMessage,
  };
}

/** Counts of approved, pending, missing, and rejected metrics for one package. */
export function getPackageReviewSummary(
  state: PortfolioState,
  packageId: string
): PackageReviewSummary {
  const metrics = getPackageMetrics(state, packageId);
  const needsValidation = metrics.filter(isUnresolved).length;
  const approved = metrics.filter((m) => m.status === "Approved for reporting").length;
  const reviewed = metrics.filter((m) => isTerminalStatus(m.status)).length;
  const total = metrics.length;
  return {
    totalMetrics: total,
    needsValidation,
    approved,
    reviewed,
    reviewedPercent: total === 0 ? 0 : Math.round((reviewed / total) * 100),
    lowConfidence: metrics.filter((m) => m.confidence === "Low" && isUnresolved(m)).length,
    missing: metrics.filter((m) => m.status === "Missing from report").length,
    rejected: metrics.filter((m) => m.status === "Rejected").length,
  };
}

/** Sector, period, and reviewer values available in the review filter dropdowns. */
export function getAvailableReviewFilterOptions(state: PortfolioState) {
  const deduped = dedupeMetrics(state.metrics);
  const sectors = getActivePortfolioSectors(state.companies);
  const periods = Array.from(new Set(state.packages.map((p) => p.reportPeriod))).sort();
  const reviewerByKey = new Map<string, string>();
  for (const name of [
    ...deduped.map((m) => m.reviewedBy).filter(Boolean),
    ...state.packages.map((p) => p.assignedReviewerName).filter(Boolean),
  ] as string[]) {
    const key = name.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key || reviewerByKey.has(key)) continue;
    reviewerByKey.set(key, name.trim());
  }
  const reviewers = [...reviewerByKey.values()].sort((a, b) => a.localeCompare(b));
  return { sectors, periods, reviewers };
}

function matchesSearch(haystack: string, search: string): boolean {
  if (!search.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

/** True when a package and its metrics pass all active review queue filters. */
function packageMatchesFilters(
  pkg: ReportingPackage,
  metrics: ExtractedMetric[],
  filters: ReviewQueueFilters,
  sector: string
): boolean {
  if (filters.sector !== "all" && sector !== filters.sector) return false;
  if (filters.period !== "all" && pkg.reportPeriod !== filters.period) return false;
  if (filters.extractionFailuresOnly && pkg.status !== "Failed") return false;
  if (filters.overdueOnly) {
    const hasUnresolved = metrics.some(isUnresolved);
    const age = ageInDays(pkg.processedAt ?? pkg.uploadedAt);
    if (!hasUnresolved || age < 14) return false;
  }

  const unresolvedCount = metrics.filter(isUnresolved).length;
  const isComplete = pkg.status === "Processed" && unresolvedCount === 0 && metrics.length > 0;
  const isBlocked = pkg.status === "Failed";
  const isInReview = unresolvedCount > 0 && pkg.status !== "Failed";

  const quickView = filters.quickView ?? "all";
  if (quickView === "remaining" && isComplete) return false;
  if (quickView === "remaining" && !isInReview && !isBlocked && pkg.status !== "Processing") {
    return false;
  }
  if (quickView === "in-review" && !isInReview) return false;
  if (quickView === "blocked" && !isBlocked) return false;
  if (quickView === "completed" && !isComplete) return false;

  if (filters.status !== "all") {
    const unresolved = unresolvedCount > 0;
    if (filters.status === "Needs validation" && !unresolved) return false;
    if (filters.status === "Approved" && unresolved) return false;
    if (filters.status === "Completed" && !isComplete) return false;
    if (filters.status === "Failed" && pkg.status !== "Failed") return false;
  }
  if (filters.confidence !== "all") {
    const match = metrics.some((m) => isUnresolved(m) && m.confidence === filters.confidence);
    if (!match && pkg.status === "Processed") return false;
  }
  if (filters.reviewer !== "all") {
    if (filters.reviewer === "unassigned") {
      if (pkg.assignedReviewerId) return false;
    } else if (
      pkg.assignedReviewerName !== filters.reviewer &&
      !metrics.some((m) => m.reviewedBy === filters.reviewer)
    ) {
      return false;
    }
  }
  if (filters.search.trim()) {
    const reportTitle = inferReportType(pkg.fileName, pkg.sourceFormat);
    const blob = `${pkg.companyName} ${pkg.fileName} ${pkg.reportPeriod} ${reportTitle} ${metrics.map((m) => m.metricName).join(" ")}`;
    if (!matchesSearch(blob, filters.search)) return false;
  }
  return true;
}

/** Groups filtered packages by company for the review queue sidebar. */
export function buildCompanyReviewGroups(
  state: PortfolioState,
  filters: ReviewQueueFilters,
  sort: NavigatorSort
): CompanyReviewGroup[] {
  const companyById = new Map(state.companies.map((c) => [c.id, c]));
  const packagesByCompany = new Map<string, ReportingPackage[]>();

  for (const pkg of state.packages) {
    const list = packagesByCompany.get(pkg.companyId) ?? [];
    list.push(pkg);
    packagesByCompany.set(pkg.companyId, list);
  }

  const groups: CompanyReviewGroup[] = [];

  for (const [companyId, packages] of packagesByCompany) {
    const sector = companyById.get(companyId)?.sector ?? "Unclassified";
    const sortedPackages = [...packages].sort((a, b) => packageProcessedAt(b) - packageProcessedAt(a));
    const packageItems: PackageReviewItem[] = [];

    for (const pkg of sortedPackages) {
      const metrics = getPackageMetrics(state, pkg.id);
      if (!packageMatchesFilters(pkg, metrics, filters, sector)) continue;

      const unresolvedCount = metrics.filter(isUnresolved).length;
      packageItems.push({
        packageId: pkg.id,
        companyId: pkg.companyId,
        companyName: pkg.companyName,
        reportPeriod: pkg.reportPeriod,
        reportTitle: inferReportType(pkg.fileName, pkg.sourceFormat),
        fileName: pkg.fileName,
        unresolvedCount,
        isComplete: pkg.status === "Processed" && unresolvedCount === 0 && metrics.length > 0,
        status: pkg.status,
        priorityScore: getReviewPriorityScore({ pkg, metrics }),
        processedAt: pkg.processedAt ?? pkg.uploadedAt,
        lowConfidenceCount: metrics.filter((m) => isUnresolved(m) && m.confidence === "Low").length,
        errorMessage: pkg.errorMessage,
      });
    }

    if (packageItems.length === 0) continue;

    groups.push({
      companyId,
      companyName: packageItems[0].companyName,
      sector,
      unresolvedCount: packageItems.reduce((s, p) => s + p.unresolvedCount, 0),
      priorityScore: Math.max(...packageItems.map((p) => p.priorityScore)),
      packages: packageItems,
      latestProcessedAt: packageItems[0]?.processedAt ?? null,
    });
  }

  return sortCompanyGroups(groups, sort);
}

/** Package counts per quick view, respecting all other active filters. */
export function getQueueQuickViewCounts(
  state: PortfolioState,
  filters: ReviewQueueFilters,
  sort: NavigatorSort
): Record<ReviewQueueQuickView, number> {
  const countFor = (quickView: ReviewQueueQuickView) =>
    buildCompanyReviewGroups(state, { ...filters, quickView }, sort).reduce(
      (n, g) => n + g.packages.length,
      0
    );
  return {
    all: countFor("all"),
    remaining: countFor("remaining"),
    "in-review": countFor("in-review"),
    blocked: countFor("blocked"),
    completed: countFor("completed"),
  };
}

/** Sort company groups for the review navigator (priority, name, age, etc.). */
function sortCompanyGroups(groups: CompanyReviewGroup[], sort: NavigatorSort): CompanyReviewGroup[] {
  const copy = [...groups];
  switch (sort) {
    case "companyName":
      copy.sort((a, b) => a.companyName.localeCompare(b.companyName));
      break;
    case "mostUnresolved":
      copy.sort((a, b) => b.unresolvedCount - a.unresolvedCount);
      break;
    case "oldestUnresolved":
      copy.sort((a, b) => {
        const aT = a.latestProcessedAt ? new Date(a.latestProcessedAt).getTime() : 0;
        const bT = b.latestProcessedAt ? new Date(b.latestProcessedAt).getTime() : 0;
        return aT - bT;
      });
      break;
    case "recentlyProcessed":
      copy.sort((a, b) => {
        const aT = a.latestProcessedAt ? new Date(a.latestProcessedAt).getTime() : 0;
        const bT = b.latestProcessedAt ? new Date(b.latestProcessedAt).getTime() : 0;
        return bT - aT;
      });
      break;
    default:
      copy.sort((a, b) => b.priorityScore - a.priorityScore);
  }
  return copy;
}

/** Total count of metrics across the portfolio that still need validation. */
export function getTotalUnresolvedCount(state: PortfolioState): number {
  return dedupeMetrics(state.metrics).filter(isUnresolved).length;
}

/** Flat list of individual metrics needing review, sorted by priority. */
export function getReviewQueueItems(
  state: PortfolioState,
  filters: ReviewQueueFilters
): ReviewQueueItem[] {
  const items: ReviewQueueItem[] = [];
  const companyById = new Map(state.companies.map((c) => [c.id, c]));

  for (const pkg of state.packages) {
    if (pkg.status !== "Processed") continue;
    const sector = companyById.get(pkg.companyId)?.sector ?? "Unclassified";
    const allPkgMetrics = getPackageMetrics(state, pkg.id);
    if (!packageMatchesFilters(pkg, allPkgMetrics, filters, sector)) continue;

    const reportTitle = inferReportType(pkg.fileName, pkg.sourceFormat);
    for (const metric of allPkgMetrics.filter(isUnresolved)) {
      items.push({
        metric,
        package: pkg,
        reportTitle,
        issue: inferReviewIssue(metric),
        ageDays: ageInDays(pkg.processedAt ?? pkg.uploadedAt),
        priorityScore: getReviewPriorityScore({ pkg, metrics: [metric] }),
      });
    }
  }

  return items.sort((a, b) => b.priorityScore - a.priorityScore);
}

/** Metrics for one package filtered by the active review tab (all, low confidence, etc.). */
export function getFilteredPackageMetrics(
  packageId: string,
  state: PortfolioState,
  tab: MetricReviewTab
): ExtractedMetric[] {
  let metrics = getPackageMetrics(state, packageId);
  switch (tab) {
    case "needsValidation":
      return metrics.filter(isUnresolved);
    case "lowConfidence":
      return metrics.filter((m) => m.confidence === "Low" && isUnresolved(m));
    case "approved":
      return metrics.filter((m) => m.status === "Approved for reporting");
    case "missing":
      return metrics.filter((m) => m.status === "Missing from report");
    default:
      return metrics;
  }
}

/** Number of metrics in each review tab for one package. */
export function getTabCounts(
  packageId: string,
  state: PortfolioState
): Record<MetricReviewTab, number> {
  const metrics = getPackageMetrics(state, packageId);
  return {
    all: metrics.length,
    needsValidation: metrics.filter(isUnresolved).length,
    lowConfidence: metrics.filter((m) => m.confidence === "Low" && isUnresolved(m)).length,
    approved: metrics.filter((m) => m.status === "Approved for reporting").length,
    missing: metrics.filter((m) => m.status === "Missing from report").length,
  };
}

/** Next unresolved metric in a package, optionally preferring low-confidence items. */
export function getNextUnresolvedMetric(
  packageId: string,
  state: PortfolioState,
  currentMetricId?: string | null,
  preferLowConfidence = false
): ExtractedMetric | null {
  let pool = getPackageMetrics(state, packageId).filter(isUnresolved);
  if (preferLowConfidence) {
    const low = pool.filter((m) => m.confidence === "Low");
    if (low.length > 0) pool = low;
  }
  if (pool.length === 0) return null;
  if (!currentMetricId) return pool[0];
  const idx = pool.findIndex((m) => m.id === currentMetricId);
  return pool[idx + 1] ?? pool[0];
}

/** Previous unresolved metric in a package for back navigation. */
export function getPreviousUnresolvedMetric(
  packageId: string,
  state: PortfolioState,
  currentMetricId?: string | null
): ExtractedMetric | null {
  const pool = getPackageMetrics(state, packageId).filter(isUnresolved);
  if (pool.length === 0) return null;
  if (!currentMetricId) return pool[pool.length - 1];
  const idx = pool.findIndex((m) => m.id === currentMetricId);
  if (idx <= 0) return pool[pool.length - 1];
  return pool[idx - 1];
}

/** Previous metric in catalog order within the same package (any status). */
export function getPreviousMetric(
  packageId: string,
  state: PortfolioState,
  currentMetricId: string
): ExtractedMetric | null {
  const pool = getPackageMetrics(state, packageId);
  const idx = pool.findIndex((m) => m.id === currentMetricId);
  if (idx <= 0) return null;
  return pool[idx - 1];
}

/** Flat ordered list of packages matching current filters and sort. */
export function getOrderedReviewPackages(
  state: PortfolioState,
  filters: ReviewQueueFilters,
  sort: NavigatorSort
): PackageReviewItem[] {
  return buildCompanyReviewGroups(state, filters, sort).flatMap((g) => g.packages);
}

/** Next package in the filtered review queue after the current one. */
export function getNextReviewPackage(
  state: PortfolioState,
  currentPackageId: string | null,
  filters: ReviewQueueFilters,
  sort: NavigatorSort
): PackageReviewItem | null {
  const items = getOrderedReviewPackages(state, filters, sort);
  if (items.length === 0) return null;
  if (!currentPackageId) return items[0];
  const idx = items.findIndex((p) => p.packageId === currentPackageId);
  return items[idx + 1] ?? null;
}

/** Previous package in the filtered review queue before the current one. */
export function getPreviousReviewPackage(
  state: PortfolioState,
  currentPackageId: string,
  filters: ReviewQueueFilters,
  sort: NavigatorSort
): PackageReviewItem | null {
  const items = getOrderedReviewPackages(state, filters, sort);
  const idx = items.findIndex((p) => p.packageId === currentPackageId);
  if (idx <= 0) return null;
  return items[idx - 1];
}

/** Most recent approved value for the same metric from an earlier reporting period. */
export function getComparablePreviousMetric(
  metric: ExtractedMetric,
  allMetrics: ExtractedMetric[]
): ExtractedMetric | null {
  const approved = allMetrics.filter(
    (m) =>
      m.companyId === metric.companyId &&
      m.metricName === metric.metricName &&
      m.unit === metric.unit &&
      m.status === "Approved for reporting" &&
      m.id !== metric.id &&
      m.reportPeriod !== metric.reportPeriod
  );
  if (approved.length === 0) return null;
  approved.sort((a, b) => b.reportPeriod.localeCompare(a.reportPeriod));
  return approved[0];
}

/** Recent metric review decisions from the audit log, newest first. */
export function getRecentlyReviewedMetrics(
  state: PortfolioState,
  decisionFilter: "all" | MetricAuditEntry["action"] = "all"
) {
  const metricById = new Map(state.metrics.map((m) => [m.id, m]));
  const pkgById = new Map(state.packages.map((p) => [p.id, p]));

  let log = [...state.metricAuditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  if (decisionFilter !== "all") {
    log = log.filter((e) => e.action === decisionFilter);
  }

  return log.slice(0, 100).map((audit) => {
    const metric = metricById.get(audit.metricId);
    const pkg = pkgById.get(audit.packageId);
    return {
      audit,
      metric,
      package: pkg,
      reportTitle: pkg ? inferReportType(pkg.fileName, pkg.sourceFormat) : "—",
    };
  });
}

/** True when at least one package has finished or failed processing. */
export function hasProcessedPackages(state: PortfolioState): boolean {
  return state.packages.some((p) => p.status === "Processed" || p.status === "Failed");
}

/** Split evidence text into before/highlight/after so the UI can bold the value. */
export function highlightEvidenceExcerpt(
  evidenceText: string,
  extractedValue: string
): { before: string; highlight: string; after: string } | null {
  if (!extractedValue || !evidenceText) return null;
  const idx = evidenceText.indexOf(extractedValue);
  if (idx !== -1) {
    return {
      before: evidenceText.slice(0, idx),
      highlight: extractedValue,
      after: evidenceText.slice(idx + extractedValue.length),
    };
  }
  const numeric = extractedValue.replace(/[^0-9.]/g, "");
  if (!numeric) return null;
  const re = new RegExp(numeric.replace(".", "\\."), "i");
  const match = evidenceText.match(re);
  if (match?.index !== undefined) {
    return {
      before: evidenceText.slice(0, match.index),
      highlight: match[0],
      after: evidenceText.slice(match.index + match[0].length),
    };
  }
  return null;
}

export const REJECT_REASONS = [
  "Wrong reporting period",
  "Forecast selected instead of actual",
  "Wrong metric",
  "Wrong value",
  "Wrong unit",
  "Duplicate extraction",
  "Unsupported evidence",
  "Other",
] as const;

export const MISSING_REASONS = [
  "Not present in report",
  "Not applicable to company",
  "Report incomplete",
  "Other",
] as const;

/** Infer a report section title from evidence text when none is stored. */
export function inferSourceSection(evidenceText: string | undefined | null): string | null {
  if (!evidenceText?.trim()) return null;
  const titled = evidenceText.match(
    /(?:^|\n)\s*([A-Z][A-Za-z0-9 &/\-]{8,80}(?:Performance|Highlights|Overview|Summary|Results|Update))/
  );
  if (titled?.[1]) return titled[1].trim();
  // Common board-pack style headings embedded in sentence context
  const known = evidenceText.match(
    /(Financial and Recurring Revenue Performance|Recurring Revenue|Financial Highlights|Key Metrics|Operating Metrics)/i
  );
  return known?.[1] ?? null;
}

export type MetricHistoryRow = {
  reportPeriod: string;
  extractedValue: string;
  finalValue: string;
  status: string;
  reviewer: string | null;
  reviewedAt: string | null;
  sourceFile: string;
  sourcePage: number;
};

/** Approved comparable history for the same company/metric/unit (earlier or other periods). */
export function getMetricComparableHistory(
  metric: ExtractedMetric,
  allMetrics: ExtractedMetric[]
): MetricHistoryRow[] {
  return allMetrics
    .filter(
      (m) =>
        m.companyId === metric.companyId &&
        m.metricName === metric.metricName &&
        m.unit === metric.unit &&
        m.status === "Approved for reporting" &&
        m.id !== metric.id
    )
    .sort((a, b) => b.reportPeriod.localeCompare(a.reportPeriod))
    .map((m) => ({
      reportPeriod: m.reportPeriod,
      extractedValue: m.originalExtractedValue ?? m.extractedValue,
      finalValue: m.extractedValue,
      status: m.status,
      reviewer: m.reviewedBy ?? null,
      reviewedAt: m.reviewedAt ?? null,
      sourceFile: m.sourceFile,
      sourcePage: m.sourcePage,
    }));
}

/** Format an ISO timestamp for display in evidence panels. */
export function formatEvidenceDateTime(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
