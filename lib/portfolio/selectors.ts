/**
 * Read-only helpers that turn raw portfolio state into dashboard numbers and table rows.
 * Used by overview screens to count metrics, compute coverage, and build KPI summaries.
 */

import { ALL_METRICS } from "./types";
import type {
  ExtractedMetric,
  MetricName,
  MetricStatus,
  PortfolioCompany,
  PortfolioState,
  ReportingPackage,
} from "./types";

/** Count how many metrics have a given review status. */
export function countByStatus(metrics: ExtractedMetric[], status: MetricStatus) {
  return metrics.filter((m) => m.status === status).length;
}

/** Summarize approved, pending, and missing metrics for one company from its latest report. */
export function computeCompanyStats(
  companyId: string,
  metrics: ExtractedMetric[],
  packages: ReportingPackage[]
): Pick<
  PortfolioCompany,
  "metricsApproved" | "metricsNeedsValidation" | "metricsMissing" | "coverage"
> {
  const latestPkg = packages
    .filter((p) => p.companyId === companyId && p.status === "Processed")
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

  const companyMetrics = latestPkg
    ? metrics.filter((m) => m.packageId === latestPkg.id)
    : metrics.filter((m) => m.companyId === companyId);

  const approved = countByStatus(companyMetrics, "Approved for reporting");
  const needsValidation = countByStatus(companyMetrics, "Needs validation");
  const missing = countByStatus(companyMetrics, "Missing from report");
  const found = approved + needsValidation;
  const coverage =
    ALL_METRICS.length > 0 ? Math.round((found / ALL_METRICS.length) * 100) : 0;

  return {
    metricsApproved: approved,
    metricsNeedsValidation: needsValidation,
    metricsMissing: missing,
    coverage: Math.min(100, coverage),
  };
}

/** Refresh each company's metric counts and latest report date from current packages. */
export function recomputeCompanies(state: PortfolioState): PortfolioCompany[] {
  return state.companies.map((company) => {
    const stats = computeCompanyStats(company.id, state.metrics, state.packages);
    const latestPkg = state.packages
      .filter((p) => p.companyId === company.id && p.status === "Processed")
      .sort(
        (a, b) =>
          new Date(b.processedAt ?? b.uploadedAt).getTime() -
          new Date(a.processedAt ?? a.uploadedAt).getTime()
      )[0];

    return {
      ...company,
      ...stats,
      latestReportDate: latestPkg
        ? (latestPkg.processedAt ?? latestPkg.uploadedAt).slice(0, 10)
        : company.latestReportDate,
    };
  });
}

/** Summarize extraction results for a single uploaded report package. */
export function computePackageStats(
  packageId: string,
  metrics: ExtractedMetric[]
): Pick<
  ReportingPackage,
  "metricsExtracted" | "needsValidation" | "missingMetrics" | "coverage"
> {
  const pkgMetrics = metrics.filter((m) => m.packageId === packageId);
  const extracted = pkgMetrics.filter((m) => m.status !== "Missing from report").length;
  const needsValidation = countByStatus(pkgMetrics, "Needs validation");
  const missing = countByStatus(pkgMetrics, "Missing from report");
  const found = extracted;
  const coverage =
    ALL_METRICS.length > 0 ? Math.round((found / ALL_METRICS.length) * 100) : 0;

  return {
    metricsExtracted: extracted,
    needsValidation,
    missingMetrics: missing,
    coverage: Math.min(100, coverage),
  };
}

/** Refresh each package's metric counts; mark empty processed packages as failed. */
export function recomputePackages(state: PortfolioState): ReportingPackage[] {
  return state.packages.map((pkg) => {
    const stats = computePackageStats(pkg.id, state.metrics);
    // A finished package with no extracted metrics is a failure, not a success.
    if (pkg.status === "Processed" && stats.metricsExtracted === 0) {
      return {
        ...pkg,
        ...stats,
        status: "Failed" as const,
        errorMessage:
          pkg.errorMessage ?? "No metrics could be extracted from this PDF.",
      };
    }
    return {
      ...pkg,
      ...stats,
    };
  });
}

/** Top-level portfolio counts for the main dashboard tiles. */
export function getPortfolioKpis(state: PortfolioState) {
  const { metrics, packages, companies } = state;
  return {
    companiesMonitored: companies.length,
    reportsReceived: packages.filter((p) => p.status === "Processed").length,
    metricsExtracted: metrics.filter((m) => m.status !== "Missing from report").length,
    approvedForReporting: countByStatus(metrics, "Approved for reporting"),
    needsValidation: countByStatus(metrics, "Needs validation"),
    missingFromReport: countByStatus(metrics, "Missing from report"),
  };
}

/** Break down metrics by validation status with counts and percentages. */
export function getValidationSummary(state: PortfolioState) {
  const { metrics } = state;
  const approved = countByStatus(metrics, "Approved for reporting");
  const needsValidation = countByStatus(metrics, "Needs validation");
  const missing = countByStatus(metrics, "Missing from report");
  const rejected = countByStatus(metrics, "Rejected");
  const total = approved + needsValidation + missing + rejected;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return {
    approved: { count: approved, percent: pct(approved) },
    needsValidation: { count: needsValidation, percent: pct(needsValidation) },
    missing: { count: missing, percent: pct(missing) },
    rejected: { count: rejected, percent: pct(rejected) },
    total,
  };
}

/** Demo-style month-by-month extraction trend for charts (scaled from current totals). */
export function getExtractionTrend(state: PortfolioState) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const base = getPortfolioKpis(state);
  return months.map((month, i) => ({
    month,
    extracted: Math.round(base.metricsExtracted * (0.5 + i * 0.1)),
    approved: Math.round(base.approvedForReporting * (0.4 + i * 0.12)),
    needsValidation: Math.round(base.needsValidation * (0.6 + i * 0.08)),
    missing: Math.round(base.missingFromReport * (0.5 + i * 0.1)),
  }));
}

export type CompanyPerformanceRow = {
  companyId: string;
  company: string;
  latestReport: string;
  revenue: string;
  arr: string;
  ebitda: string;
  cash: string;
  headcount: string;
  validationStatus: string;
  coverage: number;
};

function latestMetricValue(
  metrics: ExtractedMetric[],
  companyId: string,
  metricName: MetricName
): string {
  const row = metrics
    .filter(
      (m) =>
        m.companyId === companyId &&
        m.metricName === metricName &&
        m.status !== "Rejected"
    )
    .sort((a, b) => new Date(b.reviewedAt ?? 0).getTime() - new Date(a.reviewedAt ?? 0).getTime())[0];

  if (!row || row.status === "Missing from report") return "—";
  return row.extractedValue || "—";
}

function validationLabel(metrics: ExtractedMetric[], companyId: string): string {
  const companyMetrics = metrics.filter((m) => m.companyId === companyId);
  const needs = countByStatus(companyMetrics, "Needs validation");
  const missing = countByStatus(companyMetrics, "Missing from report");
  if (needs > 0) return "Needs validation";
  if (missing > 0) return "Missing from report";
  return "Approved for reporting";
}

/** Build one table row per company with latest metric values and validation status. */
export function getCompanyPerformanceRows(state: PortfolioState): CompanyPerformanceRow[] {
  return state.companies.map((company) => ({
    companyId: company.id,
    company: company.name,
    latestReport: company.latestReportDate
      ? new Date(company.latestReportDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
    revenue: latestMetricValue(state.metrics, company.id, "Revenue"),
    arr: latestMetricValue(state.metrics, company.id, "ARR"),
    ebitda: latestMetricValue(state.metrics, company.id, "EBITDA"),
    cash: latestMetricValue(state.metrics, company.id, "Cash"),
    headcount: latestMetricValue(state.metrics, company.id, "Headcount"),
    validationStatus: validationLabel(state.metrics, company.id),
    coverage: company.coverage,
  }));
}

/** List the five metric names that most often need human review. */
export function getTopMetricsNeedingValidation(state: PortfolioState) {
  const counts = new Map<string, number>();
  for (const m of state.metrics) {
    if (m.status === "Needs validation") {
      counts.set(m.metricName, (counts.get(m.metricName) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([metric, count]) => ({ metric, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** Sort companies by how complete their latest metric extraction is. */
export function getCoverageByCompany(state: PortfolioState) {
  return state.companies
    .map((c) => ({ company: c.name, companyId: c.id, coverage: c.coverage }))
    .sort((a, b) => b.coverage - a.coverage);
}

/** Return the most recently processed packages for a quick-look list. */
export function getRecentPackages(state: PortfolioState, limit = 5) {
  return [...state.packages]
    .sort(
      (a, b) =>
        new Date(b.processedAt ?? b.uploadedAt).getTime() -
        new Date(a.processedAt ?? a.uploadedAt).getTime()
    )
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      company: p.companyName,
      fileName: p.fileName,
      period: p.reportPeriod,
      uploadedAt: p.uploadedAt,
      status: p.status,
      needsValidation: p.needsValidation,
    }));
}

/** Load one company with its reports and metrics, or null if not found. */
export function getCompanyDetail(state: PortfolioState, companyId: string) {
  const company = state.companies.find((c) => c.id === companyId);
  if (!company) return null;

  const packages = state.packages
    .filter((p) => p.companyId === companyId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const metrics = state.metrics.filter((m) => m.companyId === companyId);

  return { company, packages, metrics };
}

/** Turn a metric record into the text shown in tables and cards. */
export function formatMetricDisplay(metric: ExtractedMetric): string {
  if (metric.status === "Missing from report") return "Missing from report";
  if (!metric.extractedValue) return "—";
  return metric.extractedValue;
}

/** Count metrics waiting for a reviewer to approve or fix them. */
export function needsValidationBadgeCount(state: PortfolioState): number {
  return countByStatus(state.metrics, "Needs validation");
}

/** Summarize how well extraction is working across all metrics. */
export function getExtractionQualitySummary(state: PortfolioState) {
  const { metrics } = state;
  const extracted = metrics.filter((m) => m.status !== "Missing from report").length;
  const approved = countByStatus(metrics, "Approved for reporting");
  const needsValidation = countByStatus(metrics, "Needs validation");
  const missing = countByStatus(metrics, "Missing from report");
  const totalSlots = metrics.length;
  const coverage =
    totalSlots > 0
      ? Math.round(((extracted) / totalSlots) * 100)
      : 0;

  return {
    totalExtracted: extracted,
    approvedForReporting: approved,
    needsValidation,
    missingFromReport: missing,
    coveragePercent: coverage,
  };
}

export type ExtractionQualityRow = {
  sourceFormat: "Company-formatted PDF" | "ICReady template";
  coverage: number;
  needsValidationLabel: string;
  missingMetricsLabel: string;
  packageCount: number;
  lowConfidenceCount: number;
};

const DEMO_QUALITY: ExtractionQualityRow[] = [
  {
    sourceFormat: "Company-formatted PDF",
    coverage: 78,
    needsValidationLabel: "Higher",
    missingMetricsLabel: "Higher",
    packageCount: 0,
    lowConfidenceCount: 0,
  },
  {
    sourceFormat: "ICReady template",
    coverage: 96,
    needsValidationLabel: "Lower",
    missingMetricsLabel: "Lower",
    packageCount: 0,
    lowConfidenceCount: 0,
  },
];

/** Compare extraction quality between company PDFs and ICReady template PDFs. */
export function getExtractionQualityBySourceFormat(state: PortfolioState): ExtractionQualityRow[] {
  const processed = state.packages.filter((p) => p.status === "Processed");
  if (processed.length === 0) return DEMO_QUALITY;

  const formats: Array<"Company-formatted PDF" | "ICReady template"> = [
    "Company-formatted PDF",
    "ICReady template",
  ];

  return formats.map((sourceFormat) => {
    const pkgs = processed.filter((p) => p.sourceFormat === sourceFormat);
    if (pkgs.length === 0) {
      const demo = DEMO_QUALITY.find((d) => d.sourceFormat === sourceFormat)!;
      return { ...demo };
    }

    const avgCoverage = Math.round(
      pkgs.reduce((sum, p) => sum + p.coverage, 0) / pkgs.length
    );
    const totalNeedsValidation = pkgs.reduce((sum, p) => sum + p.needsValidation, 0);
    const totalMissing = pkgs.reduce((sum, p) => sum + p.missingMetrics, 0);
    const avgNeeds = totalNeedsValidation / pkgs.length;
    const avgMissing = totalMissing / pkgs.length;

    const pkgIds = new Set(pkgs.map((p) => p.id));
    const lowConfidence = state.metrics.filter(
      (m) => pkgIds.has(m.packageId) && m.confidence === "Low"
    ).length;

    const companyFormattedBaseline = DEMO_QUALITY[0];
    const templateBaseline = DEMO_QUALITY[1];
    const baseline = sourceFormat === "ICReady template" ? templateBaseline : companyFormattedBaseline;

    return {
      sourceFormat,
      coverage: avgCoverage || baseline.coverage,
      needsValidationLabel:
        avgNeeds <= 2 ? "Lower" : avgNeeds >= 4 ? "Higher" : "Moderate",
      missingMetricsLabel:
        avgMissing <= 0.5 ? "Lower" : avgMissing >= 1.5 ? "Higher" : "Moderate",
      packageCount: pkgs.length,
      lowConfidenceCount: lowConfidence,
    };
  });
}
