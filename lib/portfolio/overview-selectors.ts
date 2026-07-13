import { deriveValidationStatus, getCompanyMeta, inferReportType } from "./reporting-packages-demo";
import { resolvePersonActorName } from "./actor-names";
import { countByStatus } from "./selectors";
import { getApprovedMetricChanges } from "./metric-comparison";
import { ALL_METRICS } from "./types";
import type {
  ExtractedMetric,
  MetricName,
  PortfolioState,
  ReportingPackage,
} from "./types";

export type ActiveReportingCycle = {
  period: string;
  label: string;
  rangeLabel: string;
};

export type OverviewKpis = {
  portfolioCompanies: number;
  reportsReceived: number;
  awaitingValidation: number;
  awaitingValidationPct: number;
  approvedMetrics: number;
  extractionSuccessRate: number | null;
  portfolioCoverage: number | null;
};

export type NeedsAttentionIssueType =
  | "validation"
  | "missing"
  | "failed"
  | "low_coverage"
  | "partial";

export type NeedsAttentionItem = {
  id: string;
  companyId: string;
  companyName: string;
  reportPeriod: string;
  reportLabel: string;
  issueLabel: string;
  issueType: NeedsAttentionIssueType;
  priority: "High" | "Medium" | "Low";
  actionLabel: string;
  actionHref: string;
  sortScore: number;
};

export type ActivityEventType =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed"
  | "approved"
  | "export"
  | "overdue";

export type ActivityEvent = {
  id: string;
  timestamp: string;
  type: ActivityEventType;
  description: string;
  context: string;
};

export type ReportingProgress = {
  cycle: ActiveReportingCycle;
  submittedCount: number;
  totalExpected: number;
  completionPct: number;
};

export type WorkflowHealthSegment = {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type ExpectedMetricCoverageRow = {
  metricName: MetricName;
  presentCount: number;
  expectedCount: number;
  percent: number;
};

export type ExtractionPerformance = {
  packagesProcessed: number;
  metricsExtracted: number;
  processingSuccessRate: number | null;
  averageProcessingTimeMs: number | null;
  manualCorrections: number;
  needsValidation: number;
};

export type CompanyReportingStatus =
  | "Reporting complete"
  | "Needs validation"
  | "Processing"
  | "Failed"
  | "Report missing"
  | "Overdue";

export type CompanySubmissionRow = {
  companyId: string;
  companyName: string;
  sector: string;
  reportPeriod: string;
  reportingStatus: CompanyReportingStatus;
  coverage: number;
  lastUpdatedAt: string | null;
  lastUpdatedBy: string;
  changes: ReturnType<typeof getApprovedMetricChanges>;
  totalChanges: number;
  packageId?: string;
  actionLabel: string;
  actionHref: string;
};

function getCurrentQuarterLabel(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `Q${quarter} ${now.getFullYear()}`;
}

export function getActiveReportingCycle(state: PortfolioState): ActiveReportingCycle {
  const periodCounts = new Map<string, number>();
  for (const pkg of state.packages) {
    periodCounts.set(pkg.reportPeriod, (periodCounts.get(pkg.reportPeriod) ?? 0) + 1);
  }

  let period = getCurrentQuarterLabel();
  if (periodCounts.size > 0) {
    period = [...periodCounts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  }

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" });
  const year = now.getFullYear();
  const rangeStart = new Date(year, now.getMonth(), 1);
  const rangeEnd = new Date(year, now.getMonth() + 1, 0);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    period,
    label: `${monthName} ${year} Reporting Cycle`,
    rangeLabel: `${fmt(rangeStart)} – ${fmt(rangeEnd)}`,
  };
}

function packagesForCycle(state: PortfolioState, period: string) {
  return state.packages.filter((p) => p.reportPeriod === period);
}

function submittedPackages(state: PortfolioState, period: string) {
  return packagesForCycle(state, period).filter(
    (p) => p.status === "Processed" || p.status === "Processing" || p.status === "Failed"
  );
}

export function getOverviewKpis(state: PortfolioState): OverviewKpis {
  const cycle = getActiveReportingCycle(state);
  const cyclePackages = packagesForCycle(state, cycle.period);
  const submitted = cyclePackages.filter((p) => p.status === "Processed");
  const submittedAll = submittedPackages(state, cycle.period);

  const awaitingValidationPackages = submitted.filter((p) => p.needsValidation > 0);
  const processedOrFailed = cyclePackages.filter(
    (p) => p.status === "Processed" || p.status === "Failed"
  );
  const successRate =
    processedOrFailed.length > 0
      ? Math.round(
          (cyclePackages.filter((p) => p.status === "Processed").length /
            processedOrFailed.length) *
            1000
        ) / 10
      : null;

  const submittedIds = new Set(submitted.map((p) => p.id));
  const cycleMetrics = state.metrics.filter((m) => submittedIds.has(m.packageId));
  const approvedInCycle = countByStatus(cycleMetrics, "Approved for reporting");

  const expectedSlots = submitted.length * ALL_METRICS.length;
  const presentSlots = cycleMetrics.filter(
    (m) => m.status !== "Rejected" && m.status !== "Missing from report"
  ).length;
  const portfolioCoverage =
    expectedSlots > 0 ? Math.round((presentSlots / expectedSlots) * 100) : null;

  return {
    portfolioCompanies: state.companies.length,
    reportsReceived: submitted.length,
    awaitingValidation: awaitingValidationPackages.length,
    awaitingValidationPct:
      submittedAll.length > 0
        ? Math.round((awaitingValidationPackages.length / submittedAll.length) * 100)
        : 0,
    approvedMetrics: approvedInCycle,
    extractionSuccessRate: successRate,
    portfolioCoverage,
  };
}

function companyPackageForCycle(
  state: PortfolioState,
  companyId: string,
  period: string
): ReportingPackage | undefined {
  return state.packages
    .filter((p) => p.companyId === companyId && p.reportPeriod === period)
    .sort(
      (a, b) =>
        new Date(b.processedAt ?? b.uploadedAt).getTime() -
        new Date(a.processedAt ?? a.uploadedAt).getTime()
    )[0];
}

function deriveCompanyReportingStatus(
  pkg: ReportingPackage | undefined,
  metrics: ExtractedMetric[]
): CompanyReportingStatus {
  if (!pkg) return "Report missing";
  if (pkg.status === "Processing") return "Processing";
  if (pkg.status === "Failed") return "Failed";

  const pkgMetrics = metrics.filter((m) => m.packageId === pkg.id);
  const validation = deriveValidationStatus(pkg, pkgMetrics);
  if (validation === "Needs validation" || validation === "Partially approved") {
    return "Needs validation";
  }
  if (validation === "Approved") return "Reporting complete";
  if (pkg.needsValidation > 0) return "Needs validation";
  return "Reporting complete";
}

function actionForStatus(
  status: CompanyReportingStatus,
  companyId: string,
  packageId?: string
): { label: string; href: string } {
  switch (status) {
    case "Reporting complete":
      return {
        label: "View",
        href: `/dashboard/portfolio/companies/${companyId}`,
      };
    case "Needs validation":
      return {
        label: "Review",
        href: `/dashboard/portfolio/metric-review?company=${encodeURIComponent(companyId)}`,
      };
    case "Failed":
      return {
        label: "Retry",
        href: `/dashboard/portfolio/reporting-packages?failedOnly=1`,
      };
    case "Report missing":
    case "Overdue":
      return {
        label: "View company",
        href: `/dashboard/portfolio/companies/${companyId}`,
      };
    case "Processing":
      return {
        label: "View progress",
        href: `/dashboard/portfolio/reporting-packages`,
      };
    default:
      return { label: "View", href: `/dashboard/portfolio/companies/${companyId}` };
  }
}

export function getNeedsAttentionItems(state: PortfolioState): NeedsAttentionItem[] {
  const cycle = getActiveReportingCycle(state);
  const items: NeedsAttentionItem[] = [];

  for (const company of state.companies) {
    const pkg = companyPackageForCycle(state, company.id, cycle.period);
    const pkgMetrics = pkg ? state.metrics.filter((m) => m.packageId === pkg.id) : [];

    if (!pkg) {
      items.push({
        id: `missing-${company.id}`,
        companyId: company.id,
        companyName: company.name,
        reportPeriod: cycle.period,
        reportLabel: `${cycle.period} report`,
        issueLabel: "Report missing",
        issueType: "missing",
        priority: "High",
        actionLabel: "View company",
        actionHref: `/dashboard/portfolio/companies/${company.id}`,
        sortScore: 100,
      });
      continue;
    }

    const reportLabel = inferReportType(pkg.fileName, pkg.sourceFormat);

    if (pkg.status === "Failed") {
      items.push({
        id: `failed-${pkg.id}`,
        companyId: company.id,
        companyName: company.name,
        reportPeriod: pkg.reportPeriod,
        reportLabel,
        issueLabel: "Extraction failed",
        issueType: "failed",
        priority: "High",
        actionLabel: "Retry",
        actionHref: `/dashboard/portfolio/reporting-packages?failedOnly=1`,
        sortScore: 95,
      });
      continue;
    }

    if (pkg.status !== "Processed") continue;

    const validation = deriveValidationStatus(pkg, pkgMetrics);
    if (validation === "Partially approved") {
      items.push({
        id: `partial-${pkg.id}`,
        companyId: company.id,
        companyName: company.name,
        reportPeriod: pkg.reportPeriod,
        reportLabel,
        issueLabel: "Partial approval",
        issueType: "partial",
        priority: "Medium",
        actionLabel: "Review",
        actionHref: `/dashboard/portfolio/metric-review?company=${encodeURIComponent(company.id)}`,
        sortScore: 70,
      });
    }

    if (pkg.needsValidation > 0) {
      items.push({
        id: `validation-${pkg.id}`,
        companyId: company.id,
        companyName: company.name,
        reportPeriod: pkg.reportPeriod,
        reportLabel,
        issueLabel: `${pkg.needsValidation} metrics awaiting validation`,
        issueType: "validation",
        priority: pkg.needsValidation >= 10 ? "High" : "Medium",
        actionLabel: "Review",
        actionHref: `/dashboard/portfolio/metric-review?company=${encodeURIComponent(company.id)}`,
        sortScore: 80 + Math.min(pkg.needsValidation, 15),
      });
    }

    if (pkg.coverage > 0 && pkg.coverage < 70) {
      items.push({
        id: `coverage-${pkg.id}`,
        companyId: company.id,
        companyName: company.name,
        reportPeriod: pkg.reportPeriod,
        reportLabel,
        issueLabel: `Coverage ${pkg.coverage}%`,
        issueType: "low_coverage",
        priority: "Medium",
        actionLabel: "Review",
        actionHref: `/dashboard/portfolio/metric-review?company=${encodeURIComponent(company.id)}`,
        sortScore: 60,
      });
    }
  }

  return items.sort((a, b) => b.sortScore - a.sortScore);
}

export function getRecentActivity(
  state: PortfolioState,
  limit = 8,
  options?: { currentUserName?: string }
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const packageById = new Map(state.packages.map((pkg) => [pkg.id, pkg]));
  const companyById = new Map(state.companies.map((c) => [c.id, c]));

  function actorForMetric(metric: ExtractedMetric): string | null {
    const pkg = packageById.get(metric.packageId);
    const company = companyById.get(metric.companyId);
    const fromAudit = (state.metricAuditLog ?? [])
      .filter((entry) => entry.metricId === metric.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .map((entry) => entry.reviewer);
    return resolvePersonActorName(
      metric.reviewedBy,
      ...fromAudit,
      pkg?.uploadedBy,
      pkg?.assignedReviewerName,
      company?.assignedAssociateName,
      options?.currentUserName
    );
  }

  for (const pkg of state.packages) {
    const uploader = resolvePersonActorName(
      pkg.uploadedBy,
      options?.currentUserName
    );
    events.push({
      id: `upload-${pkg.id}`,
      timestamp: pkg.uploadedAt,
      type: "uploaded",
      description: uploader
        ? `${uploader} uploaded ${pkg.companyName} ${pkg.reportPeriod} report`
        : `${pkg.companyName} ${pkg.reportPeriod} report uploaded`,
      context: pkg.fileName,
    });

    if (pkg.status === "Processing") {
      events.push({
        id: `proc-${pkg.id}`,
        timestamp: pkg.uploadedAt,
        type: "processing",
        description: `${pkg.companyName} ${pkg.reportPeriod} extraction started`,
        context: pkg.fileName,
      });
    }

    if (pkg.status === "Processed" && pkg.processedAt) {
      events.push({
        id: `done-${pkg.id}`,
        timestamp: pkg.processedAt,
        type: "completed",
        description: `${pkg.companyName} ${pkg.reportPeriod} ${inferReportType(pkg.fileName, pkg.sourceFormat)} processed successfully`,
        context: pkg.fileName,
      });
    }

    if (pkg.status === "Failed") {
      events.push({
        id: `fail-${pkg.id}`,
        timestamp: pkg.processedAt ?? pkg.uploadedAt,
        type: "failed",
        description: `${pkg.companyName} ${pkg.reportPeriod} extraction failed`,
        context: pkg.errorMessage ?? pkg.fileName,
      });
    }
  }

  const approvalGroups = new Map<
    string,
    { count: number; ts: string; company: string; period: string; by: string | null }
  >();
  for (const m of state.metrics) {
    if (m.status !== "Approved for reporting" || !m.reviewedAt) continue;
    const by = actorForMetric(m);
    const day = m.reviewedAt.slice(0, 16);
    const key = `${m.companyId}::${m.reportPeriod}::${day}::${by ?? "unknown"}`;
    const existing = approvalGroups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      approvalGroups.set(key, {
        count: 1,
        ts: m.reviewedAt,
        company: m.companyName,
        period: m.reportPeriod,
        by,
      });
    }
  }

  for (const [key, group] of approvalGroups) {
    events.push({
      id: `approve-${key}`,
      timestamp: group.ts,
      type: "approved",
      description: group.by
        ? `${group.by} approved ${group.count} metric${group.count === 1 ? "" : "s"} for ${group.company} ${group.period}`
        : `${group.count} metric${group.count === 1 ? "" : "s"} approved for ${group.company} ${group.period}`,
      context: group.company,
    });
  }

  for (const exp of state.exportHistory) {
    const exporter = resolvePersonActorName(
      exp.createdBy,
      options?.currentUserName
    );
    events.push({
      id: `export-${exp.id}`,
      timestamp: exp.createdAt,
      type: "export",
      description: exporter
        ? `${exporter} generated export ${exp.exportName}`
        : `Export ${exp.exportName} generated`,
      context: `${exp.metricsIncluded} metrics`,
    });
  }

  const cycle = getActiveReportingCycle(state);
  const overdueTs = new Date(cycle.rangeLabel.split(" – ")[0] ?? Date.now()).toISOString();

  for (const company of state.companies) {
    const pkg = companyPackageForCycle(state, company.id, cycle.period);
    if (!pkg && state.packages.some((p) => p.reportPeriod === cycle.period)) {
      events.push({
        id: `overdue-${company.id}-${cycle.period}`,
        timestamp: overdueTs,
        type: "overdue",
        description: `${company.name} ${cycle.period} report marked overdue`,
        context: company.name,
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getReportingProgress(state: PortfolioState): ReportingProgress {
  const cycle = getActiveReportingCycle(state);
  const totalExpected = state.companies.length;
  const submittedCount = state.companies.filter((c) => {
    const pkg = companyPackageForCycle(state, c.id, cycle.period);
    return pkg && (pkg.status === "Processed" || pkg.status === "Processing");
  }).length;

  return {
    cycle,
    submittedCount,
    totalExpected,
    completionPct:
      totalExpected > 0 ? Math.round((submittedCount / totalExpected) * 100) : 0,
  };
}

export function getPortfolioWorkflowHealth(state: PortfolioState): {
  total: number;
  segments: WorkflowHealthSegment[];
} {
  const cycle = getActiveReportingCycle(state);
  const counts = {
    complete: 0,
    needsValidation: 0,
    processingIssue: 0,
    reportMissing: 0,
  };

  for (const company of state.companies) {
    const pkg = companyPackageForCycle(state, company.id, cycle.period);
    const status = deriveCompanyReportingStatus(
      pkg,
      pkg ? state.metrics.filter((m) => m.packageId === pkg.id) : []
    );
    if (status === "Reporting complete") counts.complete += 1;
    else if (status === "Needs validation") counts.needsValidation += 1;
    else if (status === "Failed" || status === "Processing") counts.processingIssue += 1;
    else counts.reportMissing += 1;
  }

  const total = state.companies.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const segments: WorkflowHealthSegment[] = [
    { key: "complete", label: "Reporting complete", count: counts.complete, percent: pct(counts.complete), color: "#10b981" },
    { key: "validation", label: "Needs validation", count: counts.needsValidation, percent: pct(counts.needsValidation), color: "#f59e0b" },
    { key: "processing", label: "Processing issue", count: counts.processingIssue, percent: pct(counts.processingIssue), color: "#eab308" },
    { key: "missing", label: "Report missing", count: counts.reportMissing, percent: pct(counts.reportMissing), color: "#94a3b8" },
  ];

  return { total, segments };
}

export function getExpectedMetricCoverage(state: PortfolioState): ExpectedMetricCoverageRow[] {
  const cycle = getActiveReportingCycle(state);
  const submitted = packagesForCycle(state, cycle.period).filter((p) => p.status === "Processed");
  const expectedCount = submitted.length;

  return ALL_METRICS.map((metricName) => {
    let presentCount = 0;
    for (const pkg of submitted) {
      const metric = state.metrics.find(
        (m) =>
          m.packageId === pkg.id &&
          m.metricName === metricName &&
          m.status !== "Rejected" &&
          m.status !== "Missing from report"
      );
      if (metric) presentCount += 1;
    }
    return {
      metricName,
      presentCount,
      expectedCount,
      percent: expectedCount > 0 ? Math.round((presentCount / expectedCount) * 100) : 0,
    };
  });
}

export function getExtractionPerformance(state: PortfolioState): ExtractionPerformance {
  const cycle = getActiveReportingCycle(state);
  const cyclePackages = packagesForCycle(state, cycle.period);
  const processed = cyclePackages.filter((p) => p.status === "Processed");
  const processedOrFailed = cyclePackages.filter(
    (p) => p.status === "Processed" || p.status === "Failed"
  );

  const processingTimes = processed
    .filter((p) => p.processedAt)
    .map((p) => new Date(p.processedAt!).getTime() - new Date(p.uploadedAt).getTime())
    .filter((ms) => ms >= 0);

  const avgMs =
    processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : null;

  const submittedIds = new Set(processed.map((p) => p.id));
  const cycleMetrics = state.metrics.filter((m) => submittedIds.has(m.packageId));

  return {
    packagesProcessed: processed.length,
    metricsExtracted: cycleMetrics.filter((m) => m.status !== "Missing from report").length,
    processingSuccessRate:
      processedOrFailed.length > 0
        ? Math.round((processed.length / processedOrFailed.length) * 1000) / 10
        : null,
    averageProcessingTimeMs: avgMs,
    manualCorrections: state.metrics.filter((m) => m.reviewedAt).length,
    needsValidation: countByStatus(state.metrics, "Needs validation"),
  };
}

export function getCompanySubmissionRows(state: PortfolioState): CompanySubmissionRow[] {
  const cycle = getActiveReportingCycle(state);

  return state.companies
    .map((company) => {
    const pkg = companyPackageForCycle(state, company.id, cycle.period);
    const pkgMetrics = pkg ? state.metrics.filter((m) => m.packageId === pkg.id) : [];
    const reportingStatus = deriveCompanyReportingStatus(pkg, pkgMetrics);
    const changes = pkg
      ? getApprovedMetricChanges(state.metrics, company.id, pkg.reportPeriod, 2)
      : [];
    const totalChanges = pkg
      ? getApprovedMetricChanges(state.metrics, company.id, pkg.reportPeriod, 99).length
      : 0;

    const action = actionForStatus(reportingStatus, company.id, pkg?.id);

    const lastReviewer = pkgMetrics.find((m) => m.reviewedBy)?.reviewedBy;

    return {
      companyId: company.id,
      companyName: company.name,
      sector: company.sector,
      reportPeriod: pkg?.reportPeriod ?? cycle.period,
      reportingStatus,
      coverage: pkg?.coverage ?? 0,
      lastUpdatedAt: pkg ? (pkg.processedAt ?? pkg.uploadedAt) : null,
      lastUpdatedBy: lastReviewer ?? (pkg?.status === "Processed" ? "System" : "System"),
      changes,
      totalChanges,
      packageId: pkg?.id,
      actionLabel: action.label,
      actionHref: action.href,
    };
  })
    .sort((a, b) => {
      const aTime = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
      const bTime = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
      return bTime - aTime;
    });
}

export function getOverviewSnapshot(
  state: PortfolioState,
  options?: { currentUserName?: string }
) {
  return {
    cycle: getActiveReportingCycle(state),
    kpis: getOverviewKpis(state),
    needsAttention: getNeedsAttentionItems(state),
    recentActivity: getRecentActivity(state, 100, options),
    reportingProgress: getReportingProgress(state),
    workflowHealth: getPortfolioWorkflowHealth(state),
    expectedCoverage: getExpectedMetricCoverage(state),
    extractionPerformance: getExtractionPerformance(state),
    submissionRows: getCompanySubmissionRows(state),
  };
}

export { getCompanyMeta };
