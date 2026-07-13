/**
 * Helpers for cleaning up saved portfolio data: dedupe reports, fix old records, and build lookup keys.
 * Runs when the app loads stored state so duplicate uploads do not break the UI.
 */

import type { ExtractedMetric, MetricName, PortfolioState, ReportingPackage } from "./types";
import {
  companyIdFromName,
  parsePdfFileName,
  refreshLegacyCompanySectors,
  syncCompaniesWithPackages,
} from "./company-from-upload";
import { applyDemoCompanyProfiles } from "./demo-company-profiles";
import { inferSourceFormatFromFileName } from "./sample-pdf-catalog";

export function packageKey(pkg: Pick<ReportingPackage, "companyId" | "reportPeriod" | "fileName">) {
  return `${pkg.companyId}::${pkg.reportPeriod}::${pkg.fileName}`;
}

export function periodPackageKey(pkg: Pick<ReportingPackage, "companyId" | "reportPeriod">) {
  return `${pkg.companyId}::${pkg.reportPeriod}`;
}

export function metricKey(packageId: string, metricName: string) {
  return `${packageId}::${metricName}`;
}

function processedTime(pkg: ReportingPackage) {
  return new Date(pkg.processedAt ?? pkg.uploadedAt).getTime();
}

export function normalizePackage(pkg: ReportingPackage): ReportingPackage {
  const parsed = parsePdfFileName(pkg.fileName);
  const companyId = companyIdFromName(parsed.companyName);
  return {
    ...pkg,
    companyId,
    companyName: parsed.companyName,
    reportPeriod: parsed.reportPeriod || pkg.reportPeriod,
    runCount: pkg.runCount ?? 1,
    processedAt: pkg.processedAt ?? pkg.uploadedAt,
    sourceFormat:
      pkg.sourceFormat ?? inferSourceFormatFromFileName(pkg.fileName),
  };
}

export function findPackageByKey(
  packages: ReportingPackage[],
  key: string
): ReportingPackage | undefined {
  return packages.find((p) => packageKey(p) === key);
}

export function findPackageByCompanyPeriod(
  packages: ReportingPackage[],
  companyId: string,
  reportPeriod: string
): ReportingPackage | undefined {
  const key = periodPackageKey({ companyId, reportPeriod });
  const matches = packages.filter((p) => periodPackageKey(p) === key);
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => packageRank(b) - packageRank(a));
  return matches[0];
}

function packageRank(pkg: ReportingPackage) {
  const statusBoost =
    pkg.status === "Processed" ? 3 : pkg.status === "Processing" ? 2 : pkg.status === "Failed" ? 0 : 1;
  const activeBoost = pkg.activeVersion === false ? 0 : 1;
  return statusBoost * 1e13 + activeBoost * 1e12 + processedTime(pkg);
}

/** Keep one package per company + period; prefer processed/active rows and sum run counts. */
export function dedupePackages(packages: ReportingPackage[]): ReportingPackage[] {
  const groups = new Map<string, ReportingPackage[]>();

  for (const pkg of packages.map(normalizePackage)) {
    // Skip empty periods — fall back to full packageKey so malformed rows stay distinct.
    const key = pkg.reportPeriod
      ? periodPackageKey(pkg)
      : packageKey(pkg);
    const list = groups.get(key) ?? [];
    list.push(pkg);
    groups.set(key, list);
  }

  const survivors: ReportingPackage[] = [];

  for (const group of groups.values()) {
    group.sort((a, b) => packageRank(b) - packageRank(a));
    const winner = { ...group[0], activeVersion: true };
    winner.runCount = group.reduce((sum, p) => sum + (p.runCount ?? 1), 0);
    survivors.push(winner);
  }

  return survivors.sort((a, b) => processedTime(b) - processedTime(a));
}

/** One metric per packageId + metricName; prefer most recently reviewed, then highest confidence. */
export function dedupeMetrics(metrics: ExtractedMetric[]): ExtractedMetric[] {
  const confidenceRank = { High: 3, Medium: 2, Low: 1 };
  const byKey = new Map<string, ExtractedMetric>();

  for (const metric of metrics) {
    const key = metricKey(metric.packageId, metric.metricName);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, metric);
      continue;
    }

    const existingTime = existing.reviewedAt ? new Date(existing.reviewedAt).getTime() : 0;
    const metricTime = metric.reviewedAt ? new Date(metric.reviewedAt).getTime() : 0;

    if (metricTime > existingTime) {
      byKey.set(key, metric);
      continue;
    }
    if (metricTime < existingTime) continue;

    if (confidenceRank[metric.confidence] > confidenceRank[existing.confidence]) {
      byKey.set(key, metric);
    }
  }

  return Array.from(byKey.values());
}

/**
 * On load: collapse duplicate packages, remap metrics to surviving package ids,
 * then dedupe metrics by packageId + metricName.
 */
export function migratePortfolioState(state: PortfolioState): PortfolioState {
  const normalizedPackages = (state.packages ?? []).map(normalizePackage);
  const dedupedPackages = dedupePackages(normalizedPackages);

  const survivorByKey = new Map<string, ReportingPackage>();
  for (const pkg of dedupedPackages) {
    survivorByKey.set(
      pkg.reportPeriod ? periodPackageKey(pkg) : packageKey(pkg),
      pkg
    );
  }

  const duplicateToSurvivor = new Map<string, string>();
  for (const pkg of normalizedPackages) {
    const survivor = survivorByKey.get(
      pkg.reportPeriod ? periodPackageKey(pkg) : packageKey(pkg)
    );
    if (survivor && survivor.id !== pkg.id) {
      duplicateToSurvivor.set(pkg.id, survivor.id);
    }
  }

  const remappedMetrics = (state.metrics ?? []).map((metric) => {
    const survivorId = duplicateToSurvivor.get(metric.packageId);
    if (!survivorId) return metric;
    return {
      ...metric,
      packageId: survivorId,
      id: `m-${survivorId}-${metric.metricName.toLowerCase().replace(/\s+/g, "-")}`,
    };
  });

  const validPackageIds = new Set(dedupedPackages.map((p) => p.id));
  const packageById = new Map(dedupedPackages.map((p) => [p.id, p]));
  const metricsForSurvivors = remappedMetrics
    .filter((m) => validPackageIds.has(m.packageId))
    .map((metric) => {
      const pkg = packageById.get(metric.packageId);
      if (!pkg) return metric;
      return {
        ...metric,
        companyId: pkg.companyId,
        companyName: pkg.companyName,
        reportPeriod: pkg.reportPeriod,
      };
    });

  const companies = applyDemoCompanyProfiles(
    refreshLegacyCompanySectors(
      syncCompaniesWithPackages(state.companies ?? [], dedupedPackages)
    )
  );

  return {
    ...state,
    companies,
    packages: dedupedPackages,
    metrics: dedupeMetrics(metricsForSurvivors).map((metric) => ({
      ...metric,
      originalExtractedValue: metric.originalExtractedValue ?? metric.extractedValue,
      originalNormalizedValue:
        metric.originalNormalizedValue ?? metric.normalizedValue,
    })),
    metricAuditLog: state.metricAuditLog ?? [],
    assignmentAuditLog: state.assignmentAuditLog ?? [],
    companyAuditLog: state.companyAuditLog ?? [],
    reviewWaitlist: state.reviewWaitlist ?? [],
    companyNotes: state.companyNotes ?? [],
    companyFollowUps: state.companyFollowUps ?? [],
    metricExpectations: state.metricExpectations,
    companyContacts: state.companyContacts ?? [],
    companyCommunications: state.companyCommunications ?? [],
    communicationTemplates: state.communicationTemplates,
    companyAliases: state.companyAliases ?? [],
    portfolioAuditEvents: state.portfolioAuditEvents ?? [],
  };
}

export function sampleFileName(companyName: string, reportPeriod: string) {
  return `${companyName.replace(/\s+/g, "_")}_${reportPeriod.replace(/\s+/g, "_")}_Sample.pdf`;
}
