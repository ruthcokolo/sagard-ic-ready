import { formatCompanyDisplayName } from "./company-identity";
import { normalizeCompanyName } from "./company-normalize";
import { periodSortKey } from "./metric-comparison";
import { getPackageReviewSummary } from "./metric-review-selectors";
import { getActivePortfolioSectors } from "./sector-classification";
import type {
  PortfolioCompany,
  PortfolioState,
  ReportingPackage,
} from "./types";

export type DirectoryReportingHealth =
  | "On track"
  | "Needs validation"
  | "Processing issue"
  | "Report overdue"
  | "Awaiting report"
  | "No reports yet";

export type CompanyDirectorySort =
  | "az"
  | "za"
  | "latest_report"
  | "most_reports"
  | "highest_coverage"
  | "most_validation"
  | "reporting_health";

export type CompanyDirectoryFilters = {
  search: string;
  sector: string; // "all" | sector
  status: string; // "all" | investment status
  reportingHealth: string; // "all" | DirectoryReportingHealth
  sort: CompanyDirectorySort;
};

export const DEFAULT_COMPANY_DIRECTORY_FILTERS: CompanyDirectoryFilters = {
  search: "",
  sector: "all",
  status: "all",
  reportingHealth: "all",
  sort: "az",
};

export type CompanyDirectoryRow = {
  company: PortfolioCompany;
  displayName: string;
  descriptor?: string;
  sector: string;
  latestReportPeriod: string | null;
  latestFileReceivedAt: string | null;
  reportsReceived: number;
  coverage: number | null;
  needsValidation: number;
  reportingHealth: DirectoryReportingHealth;
  latestPackage: ReportingPackage | null;
  websiteUrl?: string;
};

const HEALTH_SORT_RANK: Record<DirectoryReportingHealth, number> = {
  "Processing issue": 0,
  "Report overdue": 1,
  "Needs validation": 2,
  "Awaiting report": 3,
  "No reports yet": 4,
  "On track": 5,
};

export function getAllCompanies(state: PortfolioState): PortfolioCompany[] {
  return state.companies;
}

export function getCompanyPackages(
  state: PortfolioState,
  companyId: string
): ReportingPackage[] {
  return state.packages.filter((p) => p.companyId === companyId);
}

/** Newest package by reporting period, then processed/uploaded date. */
export function getCompanyLatestPackage(
  state: PortfolioState,
  companyId: string
): ReportingPackage | null {
  const pkgs = getCompanyPackages(state, companyId);
  if (pkgs.length === 0) return null;
  return [...pkgs].sort((a, b) => {
    const period = periodSortKey(b.reportPeriod) - periodSortKey(a.reportPeriod);
    if (period !== 0) return period;
    return (
      new Date(b.processedAt ?? b.uploadedAt).getTime() -
      new Date(a.processedAt ?? a.uploadedAt).getTime()
    );
  })[0];
}

export function getCompanyLatestReportPeriod(
  state: PortfolioState,
  companyId: string
): string | null {
  return getCompanyLatestPackage(state, companyId)?.reportPeriod ?? null;
}

export function getCompanyReportsReceivedCount(
  state: PortfolioState,
  companyId: string
): number {
  return getCompanyPackages(state, companyId).length;
}

export function getCompanyLatestCoverage(
  state: PortfolioState,
  companyId: string
): number | null {
  const latest = getCompanyLatestPackage(state, companyId);
  if (!latest || latest.status !== "Processed") return null;
  return latest.coverage;
}

export function getCompanyNeedsValidationCount(
  state: PortfolioState,
  companyId: string
): number {
  const latest = getCompanyLatestPackage(state, companyId);
  if (!latest || latest.status !== "Processed") return 0;
  return getPackageReviewSummary(state, latest.id).needsValidation;
}

export function getCompanyReportingHealth(
  state: PortfolioState,
  companyId: string
): DirectoryReportingHealth {
  const company = state.companies.find((c) => c.id === companyId);
  const pkgs = getCompanyPackages(state, companyId);
  if (pkgs.length === 0) return "No reports yet";

  const latest = getCompanyLatestPackage(state, companyId)!;
  if (latest.status === "Failed" || latest.status === "Processing") {
    return latest.status === "Failed" ? "Processing issue" : "Processing issue";
  }

  const needsValidation = getPackageReviewSummary(state, latest.id).needsValidation;
  if (needsValidation > 0) return "Needs validation";

  if (company?.nextExpectedReportDate) {
    const due = new Date(company.nextExpectedReportDate).getTime();
    if (!Number.isNaN(due)) {
      if (Date.now() > due) return "Report overdue";
      return "Awaiting report";
    }
  }

  return "On track";
}

export function companyNeedsAttention(
  state: PortfolioState,
  companyId: string
): boolean {
  const health = getCompanyReportingHealth(state, companyId);
  if (
    health === "Needs validation" ||
    health === "Processing issue" ||
    health === "Report overdue"
  ) {
    return true;
  }
  const company = state.companies.find((c) => c.id === companyId);
  if (company?.pendingWebsiteUrl) return true;
  return false;
}

export function buildCompanyDirectoryRow(
  state: PortfolioState,
  company: PortfolioCompany
): CompanyDirectoryRow {
  const latest = getCompanyLatestPackage(state, company.id);
  return {
    company,
    displayName: formatCompanyDisplayName(company.name),
    descriptor: company.descriptor,
    sector: company.sector,
    latestReportPeriod: latest?.reportPeriod ?? null,
    latestFileReceivedAt: latest?.uploadedAt ?? null,
    reportsReceived: getCompanyReportsReceivedCount(state, company.id),
    coverage: getCompanyLatestCoverage(state, company.id),
    needsValidation: getCompanyNeedsValidationCount(state, company.id),
    reportingHealth: getCompanyReportingHealth(state, company.id),
    latestPackage: latest,
    websiteUrl: company.websiteUrl,
  };
}

export function getCompanyDirectorySummary(state: PortfolioState) {
  const companies = state.companies;
  const total = companies.length;
  const sectors = getActivePortfolioSectors(companies).length;
  const active = companies.filter((c) => c.status === "Active").length;
  const needsAttention = companies.filter((c) =>
    companyNeedsAttention(state, c.id)
  ).length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return {
    total,
    sectors,
    active,
    activePct: pct(active),
    needsAttention,
    needsAttentionPct: pct(needsAttention),
  };
}

function matchesSearch(row: CompanyDirectoryRow, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [
    row.displayName,
    row.company.name,
    row.sector,
    row.company.websiteDomain,
    row.company.websiteUrl,
    row.latestReportPeriod,
    row.latestPackage?.fileName,
    row.descriptor,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return haystacks.some((h) => h.includes(q));
}

export function getFilteredCompanyDirectoryRows(
  state: PortfolioState,
  filters: CompanyDirectoryFilters
): CompanyDirectoryRow[] {
  let rows = state.companies.map((c) => buildCompanyDirectoryRow(state, c));

  rows = rows.filter((row) => {
    if (!matchesSearch(row, filters.search)) return false;
    if (filters.sector !== "all" && row.sector !== filters.sector) return false;
    if (filters.status !== "all" && row.company.status !== filters.status) return false;
    if (
      filters.reportingHealth !== "all" &&
      row.reportingHealth !== filters.reportingHealth
    ) {
      return false;
    }
    return true;
  });

  rows.sort((a, b) => {
    switch (filters.sort) {
      case "za":
        return b.displayName.localeCompare(a.displayName);
      case "latest_report": {
        const at = a.latestFileReceivedAt
          ? new Date(a.latestFileReceivedAt).getTime()
          : 0;
        const bt = b.latestFileReceivedAt
          ? new Date(b.latestFileReceivedAt).getTime()
          : 0;
        return bt - at;
      }
      case "most_reports":
        return b.reportsReceived - a.reportsReceived;
      case "highest_coverage":
        return (b.coverage ?? -1) - (a.coverage ?? -1);
      case "most_validation":
        return b.needsValidation - a.needsValidation;
      case "reporting_health":
        return (
          HEALTH_SORT_RANK[a.reportingHealth] - HEALTH_SORT_RANK[b.reportingHealth]
        );
      case "az":
      default:
        return a.displayName.localeCompare(b.displayName);
    }
  });

  return rows;
}

export function getInvestmentStatusesInUse(
  companies: PortfolioCompany[]
): PortfolioCompany["status"][] {
  const order: PortfolioCompany["status"][] = [
    "Active",
    "Watchlist",
    "On hold",
    "Exited",
    "Inactive",
  ];
  const present = new Set(companies.map((c) => c.status));
  return order.filter((s) => present.has(s));
}

export function buildCompanyDirectoryCsv(rows: CompanyDirectoryRow[]): string {
  const headers = [
    "company_name",
    "sector",
    "latest_report_period",
    "reports_received",
    "extraction_coverage",
    "metrics_needing_validation",
    "reporting_health",
    "assigned_owner",
    "website",
    "created_at",
  ];
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.displayName,
        row.sector,
        row.latestReportPeriod ?? "",
        row.reportsReceived,
        row.coverage ?? "",
        row.needsValidation,
        row.reportingHealth,
        row.company.assignedAssociateName ?? "",
        row.websiteUrl ?? "",
        row.company.createdAt ?? "",
      ]
        .map(escape)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function ensureNormalizedCompanyName(
  company: PortfolioCompany
): PortfolioCompany {
  if (company.normalizedName) return company;
  return { ...company, normalizedName: normalizeCompanyName(company.name) };
}
