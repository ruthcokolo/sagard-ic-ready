import type { ExtractedMetric, PackageStatus, ReportingPackage } from "./types";
import { countByStatus } from "./selectors";

export type PackageValidationStatus =
  | "Needs validation"
  | "Partially approved"
  | "Approved"
  | null;

export type ReportingPackageRow = ReportingPackage & {
  sector: string;
  reportType: string;
  processedBy: string;
  validationStatus: PackageValidationStatus;
  fileUrl?: string;
  approvedCount?: number;
};

export type ReportingPackageStats = {
  total: number;
  processed: number;
  needsAttention: number;
  inProgress: number;
  failed: number;
};

import { getCompanyAvatarColor, getCompanyInitials } from "./company-identity";
import { computeReportingPackageOpsStats } from "./reporting-packages-selectors";

export function getCompanyMeta(companyId: string, companyName: string) {
  const palette = getCompanyAvatarColor(companyId, companyName);
  return {
    name: companyName,
    initials: getCompanyInitials(companyName),
    color: palette.bgHex,
    textColor: "text-white",
  };
}

export function inferReportType(fileName: string, sourceFormat: ReportingPackage["sourceFormat"]) {
  if (sourceFormat === "ICReady template") return "ICReady Template";
  const lower = fileName.toLowerCase();
  if (lower.includes("board pack")) return "Board Pack";
  if (lower.includes("board report")) return "Board Report";
  if (lower.includes("board")) return "Board Update";
  if (lower.includes("investor")) return "Investor Update";
  if (lower.includes("outlook")) return "Investment Outlook";
  if (lower.includes("results") || lower.includes("earnings")) return "Earnings Report";
  if (lower.includes("report")) return "Quarterly Report";
  return "Board Update";
}

/** Primary package label for Metric Review surfaces, e.g. "Q2 2026 Board Update". */
export function formatPackagePeriodTitle(
  reportPeriod: string,
  fileName: string,
  sourceFormat: ReportingPackage["sourceFormat"]
): string {
  const type = inferReportType(fileName, sourceFormat);
  const period = reportPeriod.trim();
  if (!period || period === "—") return type;
  return `${period} ${type}`;
}

export function deriveValidationStatus(
  pkg: Pick<ReportingPackage, "status" | "needsValidation" | "metricsExtracted">,
  metrics?: ExtractedMetric[]
): PackageValidationStatus {
  if (pkg.status !== "Processed") return null;
  const pkgMetrics = metrics?.filter((m) => m.status !== "Missing from report" && m.status !== "Rejected");
  const approved = pkgMetrics
    ? pkgMetrics.filter((m) => m.status === "Approved for reporting").length
    : Math.max(0, pkg.metricsExtracted - pkg.needsValidation);
  const needs = pkgMetrics
    ? pkgMetrics.filter((m) => m.status === "Needs validation").length
    : pkg.needsValidation;

  if (needs > 0 && approved > 0) return "Partially approved";
  if (needs > 0) return "Needs validation";
  if (approved > 0 || pkg.metricsExtracted > 0) return "Approved";
  return null;
}

export function toReportingPackageRow(
  pkg: ReportingPackage,
  metrics: ExtractedMetric[] = [],
  processedBy = "Alex Rivera",
  sector = "Unclassified"
): ReportingPackageRow {
  const pkgMetrics = metrics.filter((m) => m.packageId === pkg.id);
  const approvedCount = countByStatus(pkgMetrics, "Approved for reporting");
  return {
    ...pkg,
    sector,
    reportType: inferReportType(pkg.fileName, pkg.sourceFormat),
    processedBy,
    validationStatus: deriveValidationStatus(pkg, pkgMetrics),
    approvedCount,
  };
}

export function computeReportingPackageStats(
  packages: ReportingPackage[],
  _metrics?: ExtractedMetric[]
): ReportingPackageStats {
  return computeReportingPackageOpsStats(packages);
}

import { companyIdFromName, parsePdfFileName } from "./company-from-upload";

export function detectMetadataFromFileName(
  fileName: string,
  companies: { id: string; name: string }[] = []
): { companyId?: string; companyName?: string; reportPeriod?: string } {
  const parsed = parsePdfFileName(fileName);
  const inferredId = companyIdFromName(parsed.companyName);
  const matched = companies.find(
    (c) => c.id === inferredId || c.name.toLowerCase() === parsed.companyName.toLowerCase()
  );
  return {
    companyId: matched?.id ?? inferredId,
    companyName: matched?.name ?? parsed.companyName,
    reportPeriod: parsed.reportPeriod,
  };
}

export const REPORT_TYPE_STYLES: Record<string, string> = {
  "Quarterly Report": "bg-emerald-50 text-emerald-700",
  "Board Pack": "bg-sky-50 text-sky-700",
  "Board Report": "bg-sky-50 text-sky-700",
  "Investor Update": "bg-violet-50 text-violet-700",
  "Earnings Report": "bg-blue-50 text-blue-700",
  "ICReady Template": "bg-emerald-50 text-emerald-800",
  "Company-formatted PDF": "bg-stone-100 text-stone-700",
  "ICReady Portfolio Report": "bg-emerald-50 text-emerald-800",
};

export type PackageStatusFilter = PackageStatus | "In progress" | "all";
