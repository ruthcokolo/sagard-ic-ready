/**
 * Selectors for the company profile page: headline metrics, report history,
 * risks, notes, activity feed, and AI-style summary bullets.
 */

import { formatCompanyDisplayName } from "./company-identity";
import {
  arePeriodsComparable,
  periodSortKey,
} from "./metric-comparison";
import { inferReportType } from "./reporting-packages-demo";
import { normalizePortfolioSector, type PortfolioSector } from "./sector-classification";
import { getPackageMetrics, getPackageReviewSummary, isUnresolved } from "./metric-review-selectors";
import type {
  CompanyFollowUp,
  CompanyNote,
  ExtractedMetric,
  MetricName,
  PortfolioCompany,
  PortfolioState,
  ReportingPackage,
} from "./types";

export type CompanyProfileTab =
  | "overview"
  | "performance"
  | "reports"
  | "risks"
  | "activity"
  | "notes";

export type CompanyReportingStatusLabel =
  | "Up to date"
  | "Report overdue"
  | "Needs validation"
  | "Extraction issue"
  | "No reports yet";

export type HeadlineMetricCard = {
  metricName: string;
  period: string;
  displayValue: string;
  normalizedValue: number | null;
  unit: string;
  changeLabel: string | null;
  changeDirection: "up" | "down" | "flat" | null;
  sparkline: number[];
  metricId: string;
  packageId: string;
};

export type MetricChangeRow = {
  metricName: string;
  latestValue: string;
  changeLabel: string;
  direction: "up" | "down" | "flat";
  latestPeriod: string;
  previousPeriod: string;
};

export type ReportHistoryRow = {
  packageId: string;
  period: string;
  reportTitle: string;
  fileName: string;
  receivedAt: string;
  processedAt: string | null;
  processingStatus: ReportingPackage["status"];
  reviewStatus: "Not started" | "Needs validation" | "Partially reviewed" | "Completed" | "Blocked";
  coverage: number;
  reviewerName: string | null;
  runCount: number;
};

export type ReportingHealth = {
  reportsReceived: number;
  reportsExpected: number | null;
  reportsOnTime: number | null;
  averageDaysLate: number | null;
  averageCoverage: number;
  manualCorrections: number;
  extractionFailures: number;
};

export type AiSummaryCitation = {
  id: string;
  statement: string;
  section: "performance" | "risks" | "next";
  packageId?: string;
  reportPeriod?: string;
  page?: number;
  evidenceExcerpt?: string;
  metricName?: string;
};

export type AiSummary = {
  performance: string[];
  risks: string[];
  next: string[];
  citations: AiSummaryCitation[];
  insufficient: boolean;
};

export type CompanyActivityEvent = {
  id: string;
  timestamp: string;
  actor: string;
  event: string;
  context: string;
};

const SECTOR_HEADLINE_PREFS: Record<string, MetricName[]> = {
  "Real Estate": ["Revenue", "EBITDA", "Cash", "Headcount", "ARR", "Churn"],
  Healthcare: ["Revenue", "EBITDA", "Cash", "Headcount", "ARR", "Churn"],
  "Enterprise Software": ["Revenue", "ARR", "EBITDA", "Cash", "Churn", "Headcount"],
  Fintech: ["Revenue", "ARR", "EBITDA", "Cash", "Churn", "Headcount"],
  Consumer: ["Revenue", "EBITDA", "Cash", "Headcount", "Churn", "ARR"],
  "Industrial & Manufacturing": ["Revenue", "EBITDA", "Cash", "Headcount", "ARR", "Churn"],
  "Logistics & Transportation": ["Revenue", "EBITDA", "Cash", "Headcount", "ARR", "Churn"],
  "Energy & Climate": ["Revenue", "EBITDA", "Cash", "Headcount", "ARR", "Churn"],
};

function formatDisplayValue(metric: ExtractedMetric): string {
  if (metric.extractedValue?.trim()) return metric.extractedValue;
  if (metric.normalizedValue != null) {
    return metric.normalizedValue.toLocaleString("en-US");
  }
  return "—";
}

function isApproved(m: ExtractedMetric): boolean {
  return m.status === "Approved for reporting";
}

/** Look up one company by id. */
export function getCompanyById(
  state: PortfolioState,
  companyId: string
): PortfolioCompany | undefined {
  return state.companies.find((c) => c.id === companyId);
}

/** List a company's reports newest first. */
export function getCompanyReportingPackages(
  state: PortfolioState,
  companyId: string
): ReportingPackage[] {
  return state.packages
    .filter((p) => p.companyId === companyId)
    .sort(
      (a, b) =>
        new Date(b.processedAt ?? b.uploadedAt).getTime() -
        new Date(a.processedAt ?? a.uploadedAt).getTime()
    );
}

/** Return the company's most recently uploaded or processed report. */
export function getLatestCompanyPackage(
  state: PortfolioState,
  companyId: string
): ReportingPackage | null {
  return getCompanyReportingPackages(state, companyId)[0] ?? null;
}

/** List metrics for a company that a reviewer has approved for reporting. */
export function getApprovedCompanyMetrics(
  state: PortfolioState,
  companyId: string
): ExtractedMetric[] {
  return state.metrics.filter((m) => m.companyId === companyId && isApproved(m));
}

/** Map each metric name to its newest approved value for a company. */
export function getLatestApprovedMetricsByName(
  state: PortfolioState,
  companyId: string
): Map<string, ExtractedMetric> {
  const approved = getApprovedCompanyMetrics(state, companyId).sort((a, b) => {
    const p = periodSortKey(b.reportPeriod) - periodSortKey(a.reportPeriod);
    if (p !== 0) return p;
    return new Date(b.reviewedAt ?? 0).getTime() - new Date(a.reviewedAt ?? 0).getTime();
  });
  const map = new Map<string, ExtractedMetric>();
  for (const m of approved) {
    if (!map.has(m.metricName)) map.set(m.metricName, m);
  }
  return map;
}

/** List approved values for one metric across reporting periods, oldest to newest. */
export function getCompanyMetricHistory(
  state: PortfolioState,
  companyId: string,
  metricName: string,
  approvedOnly = true
): ExtractedMetric[] {
  return state.metrics
    .filter(
      (m) =>
        m.companyId === companyId &&
        m.metricName === metricName &&
        (!approvedOnly || isApproved(m))
    )
    .sort((a, b) => periodSortKey(a.reportPeriod) - periodSortKey(b.reportPeriod));
}

/** Find the previous approved value suitable for period-over-period comparison. */
export function getComparablePreviousMetric(
  state: PortfolioState,
  companyId: string,
  metricName: string,
  period: string
): ExtractedMetric | null {
  const history = getCompanyMetricHistory(state, companyId, metricName, true);
  const current = history.find((m) => m.reportPeriod === period);
  if (!current) return null;
  const earlier = history
    .filter(
      (m) =>
        periodSortKey(m.reportPeriod) < periodSortKey(period) &&
        arePeriodsComparable(period, m.reportPeriod) &&
        m.unit === current.unit &&
        m.normalizedValue != null &&
        current.normalizedValue != null
    )
    .sort((a, b) => periodSortKey(b.reportPeriod) - periodSortKey(a.reportPeriod));
  return earlier[0] ?? null;
}

function formatChange(
  latest: ExtractedMetric,
  previous: ExtractedMetric
): { label: string; direction: "up" | "down" | "flat" } {
  const a = latest.normalizedValue;
  const b = previous.normalizedValue;
  if (a == null || b == null || b === 0) {
    return { label: "No prior approved comparison", direction: "flat" };
  }
  const delta = a - b;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  if (latest.metricName === "Headcount") {
    const abs = Math.round(delta);
    return {
      label: `${direction === "up" ? "↑" : direction === "down" ? "↓" : "→"} ${Math.abs(abs)} vs ${previous.reportPeriod}`,
      direction,
    };
  }

  if (latest.unit.includes("%") || latest.metricName === "Churn") {
    const pts = Math.round((delta * 1000)) / 10;
    const bps = Math.round(delta * 10000);
    const useBps = Math.abs(bps) < 100;
    return {
      label: `${direction === "up" ? "↑" : direction === "down" ? "↓" : "→"} ${
        useBps ? `${Math.abs(bps)} bps` : `${Math.abs(pts)} pts`
      } vs ${previous.reportPeriod}`,
      direction,
    };
  }

  const pct = Math.round((delta / Math.abs(b)) * 1000) / 10;
  return {
    label: `${direction === "up" ? "↑" : direction === "down" ? "↓" : "→"} ${Math.abs(pct)}% vs ${previous.reportPeriod}`,
    direction,
  };
}

/** Pick which metrics to highlight first based on the company's sector. */
export function getPreferredHeadlineMetricNames(sector: string): MetricName[] {
  const normalized = normalizePortfolioSector(sector) as PortfolioSector | null;
  if (normalized && SECTOR_HEADLINE_PREFS[normalized]) {
    return SECTOR_HEADLINE_PREFS[normalized];
  }
  return ["Revenue", "EBITDA", "Cash", "Headcount", "ARR", "Churn"];
}

/** Build headline metric cards with values, trends, and sparklines for the profile overview. */
export function getCompanyHeadlineMetrics(
  state: PortfolioState,
  companyId: string
): HeadlineMetricCard[] {
  const company = getCompanyById(state, companyId);
  if (!company) return [];
  const latestByName = getLatestApprovedMetricsByName(state, companyId);
  const preferred = getPreferredHeadlineMetricNames(company.sector);
  const available = [...latestByName.keys()];
  const ordered: string[] = [
    ...preferred.filter((m) => latestByName.has(m)),
    ...available.filter((m) => !preferred.includes(m as (typeof preferred)[number])),
  ].slice(0, 6);

  return ordered.map((metricName) => {
    const latest = latestByName.get(metricName)!;
    const prev = getComparablePreviousMetric(
      state,
      companyId,
      metricName,
      latest.reportPeriod
    );
    const history = getCompanyMetricHistory(state, companyId, metricName, true);
    const sparkline = history
      .map((h) => h.normalizedValue)
      .filter((v): v is number => v != null)
      .slice(-6);
    const change = prev
      ? formatChange(latest, prev)
      : { label: "No prior approved comparison", direction: null as "up" | "down" | "flat" | null };

    return {
      metricName,
      period: latest.reportPeriod,
      displayValue: formatDisplayValue(latest),
      normalizedValue: latest.normalizedValue,
      unit: latest.unit,
      changeLabel: change.label,
      changeDirection: change.direction,
      sparkline,
      metricId: latest.id,
      packageId: latest.packageId,
    };
  });
}

/** List metrics that moved meaningfully since the prior approved report. */
export function getCompanyChangesSinceLastReport(
  state: PortfolioState,
  companyId: string
): MetricChangeRow[] {
  const rows: MetricChangeRow[] = [];
  for (const h of getCompanyHeadlineMetrics(state, companyId)) {
    if (
      h.changeDirection == null ||
      h.changeLabel == null ||
      h.changeLabel === "No prior approved comparison"
    ) {
      continue;
    }
    const prev = getComparablePreviousMetric(
      state,
      companyId,
      h.metricName,
      h.period
    );
    if (!prev) continue;
    rows.push({
      metricName: h.metricName,
      latestValue: h.displayValue,
      changeLabel: h.changeLabel.replace(/\s+vs\s+.+$/, ""),
      direction: h.changeDirection,
      latestPeriod: h.period,
      previousPeriod: prev.reportPeriod,
    });
  }
  return rows;
}

/** Short label showing which two periods are being compared in change rows. */
export function getChangesComparisonLabel(
  changes: MetricChangeRow[]
): string | null {
  const first = changes[0];
  if (!first) return null;
  return `${first.previousPeriod} → ${first.latestPeriod}`;
}

function deriveReviewStatus(
  state: PortfolioState,
  pkg: ReportingPackage
): ReportHistoryRow["reviewStatus"] {
  if (pkg.status === "Failed") return "Blocked";
  if (pkg.status === "Processing") return "Not started";
  const summary = getPackageReviewSummary(state, pkg.id);
  if (summary.totalMetrics === 0) return "Not started";
  if (summary.needsValidation === 0) return "Completed";
  if (summary.reviewed === 0) return "Needs validation";
  return "Partially reviewed";
}

/** Build rows for the report history table on the company profile. */
export function getCompanyReportHistory(
  state: PortfolioState,
  companyId: string
): ReportHistoryRow[] {
  return getCompanyReportingPackages(state, companyId).map((pkg) => ({
    packageId: pkg.id,
    period: pkg.reportPeriod,
    reportTitle: inferReportType(pkg.fileName, pkg.sourceFormat),
    fileName: pkg.fileName,
    receivedAt: pkg.uploadedAt,
    processedAt: pkg.processedAt ?? null,
    processingStatus: pkg.status,
    reviewStatus: deriveReviewStatus(state, pkg),
    coverage: pkg.coverage,
    reviewerName: pkg.assignedReviewerName ?? null,
    runCount: pkg.runCount,
  }));
}

/** One-line reporting status for the company profile header. */
export function getCompanyReportingStatus(
  state: PortfolioState,
  companyId: string
): CompanyReportingStatusLabel {
  const pkgs = getCompanyReportingPackages(state, companyId);
  if (pkgs.length === 0) return "No reports yet";
  if (pkgs.some((p) => p.status === "Failed")) return "Extraction issue";
  const latest = pkgs[0];
  const summary = getPackageReviewSummary(state, latest.id);
  if (summary.needsValidation > 0) return "Needs validation";
  const company = getCompanyById(state, companyId);
  if (company?.nextExpectedReportDate) {
    const due = new Date(company.nextExpectedReportDate).getTime();
    if (Date.now() > due) return "Report overdue";
  }
  return "Up to date";
}

/** Aggregate reporting stats (coverage, failures, manual edits) for the profile. */
export function getCompanyReportingHealth(
  state: PortfolioState,
  companyId: string
): ReportingHealth {
  const pkgs = getCompanyReportingPackages(state, companyId);
  const company = getCompanyById(state, companyId);
  const failures = pkgs.filter((p) => p.status === "Failed").length;
  const coverageVals = pkgs.filter((p) => p.status === "Processed").map((p) => p.coverage);
  const averageCoverage =
    coverageVals.length > 0
      ? Math.round(coverageVals.reduce((a, b) => a + b, 0) / coverageVals.length)
      : 0;

  const edited = state.metrics.filter(
    (m) =>
      m.companyId === companyId &&
      m.originalExtractedValue != null &&
      m.originalExtractedValue !== m.extractedValue
  ).length;

  // On-time / expected / days-late require schedule due dates we do not invent.
  void company;

  return {
    reportsReceived: pkgs.length,
    reportsExpected: null,
    reportsOnTime: null,
    averageDaysLate: null,
    averageCoverage,
    manualCorrections: edited,
    extractionFailures: failures,
  };
}

/** List open follow-ups and risks for a company, sorted by priority. */
export function getCompanyOpenRisks(
  state: PortfolioState,
  companyId: string
): CompanyFollowUp[] {
  const now = Date.now();
  return (state.companyFollowUps ?? [])
    .filter((f) => f.companyId === companyId && f.status !== "Resolved")
    .map((f) => {
      if (f.dueDate && new Date(f.dueDate).getTime() < now && f.status !== "Overdue") {
        return { ...f, status: "Overdue" as const };
      }
      return f;
    })
    .sort((a, b) => {
      const priorityRank = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
}

/** Derived risk candidates — not auto-created follow-ups. */
export function getCompanyRiskCandidates(
  state: PortfolioState,
  companyId: string
): { title: string; source: string; priority: "High" | "Normal" | "Low" }[] {
  const candidates: { title: string; source: string; priority: "High" | "Normal" | "Low" }[] = [];
  const pkgs = getCompanyReportingPackages(state, companyId);
  for (const pkg of pkgs) {
    if (pkg.status === "Failed") {
      candidates.push({
        title: `Extraction failed for ${pkg.reportPeriod}`,
        source: `${inferReportType(pkg.fileName, pkg.sourceFormat)} · ${pkg.fileName}`,
        priority: "High",
      });
    }
    const metrics = getPackageMetrics(state, pkg.id);
    const unresolvedLow = metrics.filter((m) => isUnresolved(m) && m.confidence === "Low");
    if (unresolvedLow.length > 0) {
      candidates.push({
        title: `${unresolvedLow.length} low-confidence metric${unresolvedLow.length === 1 ? "" : "s"} need review`,
        source: `${pkg.reportPeriod} · ${inferReportType(pkg.fileName, pkg.sourceFormat)}`,
        priority: "Normal",
      });
    }
  }
  const changes = getCompanyChangesSinceLastReport(state, companyId);
  for (const change of changes) {
    if (
      (change.metricName === "Cash" || change.metricName === "Churn") &&
      change.direction === (change.metricName === "Cash" ? "down" : "up")
    ) {
      candidates.push({
        title: `${change.metricName} moved materially (${change.changeLabel})`,
        source: "Approved metric comparison",
        priority: "Normal",
      });
    }
  }
  return candidates.slice(0, 5);
}

/** List notes attached to a company, newest first. */
export function getCompanyNotes(
  state: PortfolioState,
  companyId: string
): CompanyNote[] {
  return (state.companyNotes ?? [])
    .filter((n) => n.companyId === companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Merge uploads, reviews, notes, and follow-ups into one activity timeline. */
export function getCompanyRecentActivity(
  state: PortfolioState,
  companyId: string
): CompanyActivityEvent[] {
  const events: CompanyActivityEvent[] = [];
  const company = getCompanyById(state, companyId);
  const name = company ? formatCompanyDisplayName(company.name) : companyId;

  for (const pkg of getCompanyReportingPackages(state, companyId)) {
    events.push({
      id: `upload-${pkg.id}`,
      timestamp: pkg.uploadedAt,
      actor: "System",
      event: "Report uploaded",
      context: `${name} · ${pkg.reportPeriod} · ${pkg.fileName}`,
    });
    if (pkg.processedAt) {
      events.push({
        id: `processed-${pkg.id}`,
        timestamp: pkg.processedAt,
        actor: "System",
        event: pkg.status === "Failed" ? "Extraction failed" : "Extraction completed",
        context: `${name} · ${pkg.reportPeriod}`,
      });
    }
  }

  for (const entry of state.metricAuditLog ?? []) {
    if (entry.companyId !== companyId) continue;
    const labels: Record<string, string> = {
      approved: "Metric approved",
      edited: "Metric edited",
      rejected: "Metric rejected",
      marked_missing: "Metric marked missing",
    };
    events.push({
      id: entry.id,
      timestamp: entry.timestamp,
      actor: entry.reviewer,
      event: labels[entry.action] ?? entry.action,
      context: `${entry.metricName}${entry.finalValue ? ` · ${entry.finalValue}` : ""}`,
    });
  }

  for (const note of getCompanyNotes(state, companyId)) {
    events.push({
      id: `note-${note.id}`,
      timestamp: note.createdAt,
      actor: note.authorName,
      event: "Note added",
      context: note.body.slice(0, 80),
    });
  }

  for (const fu of state.companyFollowUps ?? []) {
    if (fu.companyId !== companyId) continue;
    events.push({
      id: `fu-${fu.id}`,
      timestamp: fu.createdAt,
      actor: fu.createdBy,
      event: "Follow-up created",
      context: fu.title,
    });
    if (fu.resolvedAt) {
      events.push({
        id: `fu-res-${fu.id}`,
        timestamp: fu.resolvedAt,
        actor: fu.ownerName ?? fu.createdBy,
        event: "Follow-up resolved",
        context: fu.title,
      });
    }
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** Build bullet-point performance, risk, and next-step summaries from real portfolio data. */
export function getCompanyAiSummary(
  state: PortfolioState,
  companyId: string
): AiSummary {
  const headlines = getCompanyHeadlineMetrics(state, companyId);
  const changes = getCompanyChangesSinceLastReport(state, companyId);
  const health = getCompanyReportingHealth(state, companyId);
  const openRisks = getCompanyOpenRisks(state, companyId);
  const candidates = getCompanyRiskCandidates(state, companyId);
  const citations: AiSummaryCitation[] = [];

  if (headlines.length === 0) {
    return {
      performance: [],
      risks: [],
      next: [],
      citations: [],
      insufficient: true,
    };
  }

  const performance: string[] = [];
  const risks: string[] = [];
  const next: string[] = [];

  for (const change of changes.slice(0, 4)) {
    const statement = `${change.metricName} is ${change.latestValue} (${change.changeLabel}).`;
    performance.push(statement);
    const metric = getLatestApprovedMetricsByName(state, companyId).get(change.metricName);
    citations.push({
      id: `perf-${change.metricName}`,
      statement,
      section: "performance",
      packageId: metric?.packageId,
      reportPeriod: metric?.reportPeriod,
      page: metric?.sourcePage,
      evidenceExcerpt: metric?.evidenceText,
      metricName: change.metricName,
    });
  }

  if (health.extractionFailures > 0) {
    const statement = `${health.extractionFailures} extraction failure${health.extractionFailures === 1 ? "" : "s"} in reporting history.`;
    risks.push(statement);
    citations.push({
      id: "risk-extract",
      statement,
      section: "risks",
    });
  }

  for (const risk of openRisks.slice(0, 3)) {
    risks.push(risk.title);
    citations.push({
      id: `risk-${risk.id}`,
      statement: risk.title,
      section: "risks",
      packageId: risk.linkedPackageId,
      page: risk.sourcePage,
      evidenceExcerpt: risk.source,
    });
  }

  for (const c of candidates.slice(0, 2)) {
    if (!risks.includes(c.title)) {
      risks.push(c.title);
      citations.push({
        id: `cand-${c.title}`,
        statement: c.title,
        section: "risks",
        evidenceExcerpt: c.source,
      });
    }
  }

  const needsValidation = state.metrics.filter(
    (m) => m.companyId === companyId && isUnresolved(m)
  ).length;
  if (needsValidation > 0) {
    const statement = `Validate ${needsValidation} unresolved metric${needsValidation === 1 ? "" : "s"} in Metric Review.`;
    next.push(statement);
    citations.push({ id: "next-validate", statement, section: "next" });
  }

  const latest = getLatestCompanyPackage(state, companyId);
  if (latest) {
    const statement = `Review the latest ${latest.reportPeriod} package (${inferReportType(latest.fileName, latest.sourceFormat)}).`;
    next.push(statement);
    citations.push({
      id: "next-latest",
      statement,
      section: "next",
      packageId: latest.id,
      reportPeriod: latest.reportPeriod,
    });
  }

  if (openRisks.length > 0) {
    next.push("Confirm or resolve open follow-ups with owners.");
  }

  return {
    performance,
    risks: risks.length > 0 ? risks : ["No material risk signals from approved metrics or open follow-ups."],
    next: next.length > 0 ? next : ["Continue monitoring upcoming reporting obligations."],
    citations,
    insufficient: false,
  };
}

/** Format a company name for display on the profile page. */
export function getCompanyProfileDisplayName(company: PortfolioCompany): string {
  return formatCompanyDisplayName(company.name);
}

/** Turn an investment status code into a longer label for the UI. */
export function getInvestmentStatusLabel(status: PortfolioCompany["status"]): string {
  if (status === "Active") return "Active Investment";
  if (status === "Watchlist") return "Watchlist";
  if (status === "On hold") return "On hold";
  if (status === "Exited") return "Exited";
  return "Inactive";
}
