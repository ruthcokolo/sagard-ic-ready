/**
 * Selectors for the Reporting Packages screen: operational status, counts,
 * and which action button each package should show.
 */

import type { ExtractedMetric, PackageStatus, ReportingPackage } from "./types";
import { ALL_METRICS } from "./types";
import { inferReportType } from "./reporting-packages-demo";

/** Operational display status for Reporting Packages (not Metric Review). */
export type PackageOpsStatus = "Processing" | "Processed" | "Failed" | "Needs attention";

export type PackagePrimaryActionKind =
  | "view_extraction"
  | "view_progress"
  | "retry"
  | "resolve_issue";

/** Map a package to a simple ops status (processing, done, failed, needs attention). */
export function getPackageOpsStatus(pkg: ReportingPackage): PackageOpsStatus {
  if (pkg.status === "Processing") return "Processing";
  if (pkg.status === "Failed") return "Failed";
  // Operational attention — not metric validation.
  if (pkg.coverage < 60 || pkg.metricsExtracted === 0) return "Needs attention";
  if (pkg.missingMetrics > 0 && pkg.metricsExtracted < ALL_METRICS.length / 2) {
    return "Needs attention";
  }
  return "Processed";
}

/** Pick the main button action for a package based on its ops status. */
export function getPackagePrimaryAction(pkg: ReportingPackage): PackagePrimaryActionKind {
  const ops = getPackageOpsStatus(pkg);
  if (ops === "Failed") return "retry";
  if (ops === "Processing") return "view_progress";
  if (ops === "Needs attention") return "resolve_issue";
  return "view_extraction";
}

/** Count all uploaded report packages. */
export function getTotalPackageCount(packages: ReportingPackage[]): number {
  return packages.length;
}

/** Count packages that finished processing successfully. */
export function getProcessedPackageCount(packages: ReportingPackage[]): number {
  return packages.filter((p) => getPackageOpsStatus(p) === "Processed").length;
}

/** Count packages that need someone to look at extraction issues. */
export function getAttentionPackageCount(packages: ReportingPackage[]): number {
  return packages.filter((p) => getPackageOpsStatus(p) === "Needs attention").length;
}

/** Count packages still being processed. */
export function getInProgressPackageCount(packages: ReportingPackage[]): number {
  return packages.filter((p) => p.status === "Processing").length;
}

/** Count packages whose extraction failed. */
export function getFailedPackageCount(packages: ReportingPackage[]): number {
  return packages.filter((p) => p.status === "Failed").length;
}

export type ReportingPackageOpsStats = {
  total: number;
  processed: number;
  needsAttention: number;
  inProgress: number;
  failed: number;
};

/** Build summary counts for the Reporting Packages dashboard header. */
export function computeReportingPackageOpsStats(
  packages: ReportingPackage[]
): ReportingPackageOpsStats {
  return {
    total: getTotalPackageCount(packages),
    processed: getProcessedPackageCount(packages),
    needsAttention: getAttentionPackageCount(packages),
    inProgress: getInProgressPackageCount(packages),
    failed: getFailedPackageCount(packages),
  };
}

/** Return extraction coverage percent for a package, or null if not ready yet. */
export function getPackageExtractionCoverage(pkg: ReportingPackage): number | null {
  if (pkg.status !== "Processed" && getPackageOpsStatus(pkg) !== "Needs attention") {
    if (pkg.status === "Failed" || pkg.status === "Processing") return null;
  }
  if (pkg.status === "Failed" || pkg.status === "Processing") return null;
  return pkg.coverage;
}

/** Find an existing package that looks like the same file for the same company and period. */
export function findLikelyDuplicatePackage(
  packages: ReportingPackage[],
  input: { companyId: string; reportPeriod: string; fileName: string }
): ReportingPackage | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const target = norm(input.fileName);
  return (
    packages.find(
      (p) =>
        p.companyId === input.companyId &&
        p.reportPeriod === input.reportPeriod &&
        (norm(p.fileName) === target ||
          norm(p.fileName).includes(target) ||
          target.includes(norm(p.fileName)))
    ) ?? null
  );
}

/** List all metrics extracted from one report package. */
export function getPackageSuggestedMetrics(
  packageId: string,
  metrics: ExtractedMetric[]
): ExtractedMetric[] {
  return metrics.filter((m) => m.packageId === packageId);
}

export { inferReportType };
