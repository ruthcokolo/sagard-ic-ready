import type {
  ExtractedMetric,
  MetricName,
  PortfolioCompany,
  PortfolioState,
  ReportingPackage,
} from "./types";
import { ALL_METRICS } from "./types";
import { getActivePortfolioSectors, normalizePortfolioSector } from "./sector-classification";

export type ComparisonSort = "highest" | "lowest" | "name" | "recent";

export type ExplorerCompanyOption = {
  id: string;
  name: string;
  sector: string;
};

export type ComparableMetricRow = ExtractedMetric & {
  sector: string;
};

export type ComparisonBuildResult = {
  comparableRows: ComparableMetricRow[];
  excludedCompanies: { id: string; name: string; reason: string }[];
  tableRows: ComparableMetricRow[];
  hasMixedCurrencies: boolean;
  availableCompanyIds: string[];
  effectiveCompanyIds: string[];
};

export type EligibilityFilters = {
  metric: string;
  period: string;
  sector: string;
  includeNeedsValidation: boolean;
};

type UnitProfile = {
  kind: "currency" | "percent" | "count" | "other";
  currency?: string;
  normalized: string;
};

function unitProfile(unit: string): UnitProfile {
  const trimmed = unit.trim();
  const upper = trimmed.toUpperCase();

  if (upper.includes("CAD") || upper.includes("C$")) {
    return { kind: "currency", currency: "CAD", normalized: "CAD" };
  }
  if (
    upper.includes("USD") ||
    upper === "$" ||
    upper.includes("US DOLLAR") ||
    /^[\$]/.test(trimmed)
  ) {
    return { kind: "currency", currency: "USD", normalized: "USD" };
  }
  if (upper.includes("%") || upper.includes("PERCENT") || upper.includes("BPS")) {
    return { kind: "percent", normalized: "percent" };
  }
  if (/headcount|employee|people|visits|count|fte/i.test(trimmed)) {
    return { kind: "count", normalized: trimmed.toLowerCase() };
  }
  return { kind: "other", normalized: trimmed.toLowerCase() };
}

export function areUnitsCompatible(a: string, b: string): boolean {
  const pa = unitProfile(a);
  const pb = unitProfile(b);
  if (pa.kind !== pb.kind) return false;
  if (pa.kind === "currency") return pa.currency === pb.currency;
  return pa.normalized === pb.normalized;
}

function getDominantUnit(rows: ExtractedMetric[]): string | null {
  if (rows.length === 0) return null;
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.unit, (counts.get(row.unit) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function getProcessedPackages(state: PortfolioState): ReportingPackage[] {
  return state.packages.filter((p) => p.status === "Processed");
}

function processedPackageIds(state: PortfolioState): Set<string> {
  return new Set(getProcessedPackages(state).map((p) => p.id));
}

function processedMetrics(state: PortfolioState): ExtractedMetric[] {
  const ids = processedPackageIds(state);
  return state.metrics.filter((m) => ids.has(m.packageId));
}

export function hasProcessedPortfolioData(state: PortfolioState): boolean {
  const packages = getProcessedPackages(state);
  if (packages.length === 0) return false;
  const ids = new Set(packages.map((p) => p.id));
  return state.metrics.some((m) => ids.has(m.packageId));
}

export function getProcessedCompanies(state: PortfolioState): PortfolioCompany[] {
  const processedIds = new Set(getProcessedPackages(state).map((p) => p.companyId));
  return state.companies.filter((c) => processedIds.has(c.id));
}

function companySectorLabel(company: PortfolioCompany): string {
  return normalizePortfolioSector(company.sector) ?? company.sector;
}

function companySector(state: PortfolioState, companyId: string): string {
  const company = state.companies.find((c) => c.id === companyId);
  if (!company) return "—";
  return companySectorLabel(company);
}

function matchesSector(state: PortfolioState, companyId: string, sector: string): boolean {
  if (sector === "all") return true;
  const company = state.companies.find((c) => c.id === companyId);
  if (!company) return false;
  return companySectorLabel(company) === sector;
}

function metricIsEligible(metric: ExtractedMetric, includeNeedsValidation: boolean): boolean {
  if (metric.status === "Rejected" || metric.status === "Missing from report") return false;
  if (!includeNeedsValidation && metric.status !== "Approved for reporting") return false;
  return true;
}

function recordMatchesFilters(
  state: PortfolioState,
  metric: ExtractedMetric,
  filters: EligibilityFilters,
  selectedCompanyIds: string[]
): boolean {
  if (metric.metricName !== filters.metric) return false;
  if (filters.period !== "all" && metric.reportPeriod !== filters.period) return false;
  if (!matchesSector(state, metric.companyId, filters.sector)) return false;
  if (selectedCompanyIds.length > 0 && !selectedCompanyIds.includes(metric.companyId)) {
    return false;
  }
  return metricIsEligible(metric, filters.includeNeedsValidation);
}

/** Stable dedupe key: company + period + metric + unit */
export function metricRowDedupeKey(row: Pick<ExtractedMetric, "companyId" | "reportPeriod" | "metricName" | "unit">): string {
  return `${row.companyId}::${row.reportPeriod}::${row.metricName}::${row.unit}`;
}

/** Keep the most recently reviewed record per dedupe key. */
export function dedupeMetricRows(rows: ComparableMetricRow[]): ComparableMetricRow[] {
  const byKey = new Map<string, ComparableMetricRow>();
  for (const row of rows) {
    const key = metricRowDedupeKey(row);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      continue;
    }
    const existingTs = new Date(existing.reviewedAt ?? 0).getTime();
    const rowTs = new Date(row.reviewedAt ?? 0).getTime();
    if (rowTs >= existingTs) {
      byKey.set(key, row);
    }
  }
  return [...byKey.values()];
}

export function getAvailableMetrics(state: PortfolioState): string[] {
  const found = new Set<string>();
  for (const metric of processedMetrics(state)) {
    if (metricIsEligible(metric, true)) {
      found.add(metric.metricName);
    }
  }
  const catalog = state.extractionRules?.length
    ? state.extractionRules.map((r) => r.metricName)
    : ALL_METRICS;
  return catalog.filter((name) => found.has(name));
}

export function getAvailablePeriods(state: PortfolioState): string[] {
  const periods = new Set<string>();
  for (const pkg of getProcessedPackages(state)) {
    if (pkg.reportPeriod) periods.add(pkg.reportPeriod);
  }
  for (const metric of processedMetrics(state)) {
    periods.add(metric.reportPeriod);
  }
  return [...periods].sort().reverse();
}

export function getAvailableSectors(state: PortfolioState): string[] {
  return getActivePortfolioSectors(getProcessedCompanies(state));
}

/** Companies with data matching metric, period, and sector — picker options only. */
export function getEligibleCompanies(
  state: PortfolioState,
  options: EligibilityFilters & { companySearch?: string }
): ExplorerCompanyOption[] {
  let companies = getProcessedCompanies(state);

  if (options.sector !== "all") {
    companies = companies.filter((c) => companySectorLabel(c) === options.sector);
  }

  const eligibleIds = new Set<string>();
  for (const metric of processedMetrics(state)) {
    if (!recordMatchesFilters(state, metric, options, [])) continue;
    eligibleIds.add(metric.companyId);
  }

  companies = companies.filter((c) => eligibleIds.has(c.id));

  const query = options.companySearch?.trim().toLowerCase() ?? "";
  if (query) {
    companies = companies.filter((c) => c.name.toLowerCase().includes(query));
  }

  return companies
    .map((company) => ({
      id: company.id,
      name: company.name,
      sector: companySectorLabel(company),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAvailableCompanyIds(
  state: PortfolioState,
  filters: EligibilityFilters
): string[] {
  return getEligibleCompanies(state, filters).map((c) => c.id);
}

/** Empty selection = all eligible companies. Explicit selection = narrowed subset. */
export function getEffectiveCompanyIds(
  selectedCompanyIds: string[],
  availableCompanyIds: string[]
): string[] {
  return selectedCompanyIds.length > 0 ? selectedCompanyIds : availableCompanyIds;
}

export function pruneIneligibleSelections(
  state: PortfolioState,
  selectedCompanyIds: string[],
  filters: EligibilityFilters
): { nextIds: string[]; removed: PortfolioCompany[] } {
  if (selectedCompanyIds.length === 0) {
    return { nextIds: [], removed: [] };
  }

  const eligibleIds = new Set(getAvailableCompanyIds(state, filters));
  const removed: PortfolioCompany[] = [];

  const nextIds = selectedCompanyIds.filter((id) => {
    if (eligibleIds.has(id)) return true;
    const company = state.companies.find((c) => c.id === id);
    if (company) removed.push(company);
    return false;
  });

  return { nextIds, removed };
}

export function getComparisonResults(
  state: PortfolioState,
  options: EligibilityFilters & {
    selectedCompanyIds: string[];
    comparisonSort: ComparisonSort;
  }
): ComparisonBuildResult {
  const availableCompanyIds = getAvailableCompanyIds(state, options);
  const effectiveCompanyIds = getEffectiveCompanyIds(
    options.selectedCompanyIds,
    availableCompanyIds
  );
  const effectiveSet = new Set(effectiveCompanyIds);

  const candidateMetrics = processedMetrics(state).filter((m) => {
    if (!recordMatchesFilters(state, m, options, options.selectedCompanyIds)) return false;
    return effectiveSet.has(m.companyId);
  });

  let tableRows: ComparableMetricRow[] = dedupeMetricRows(
    candidateMetrics.map((metric) => ({
      ...metric,
      sector: companySector(state, metric.companyId),
    }))
  );

  const excludedCompanies: { id: string; name: string; reason: string }[] = [];
  if (options.selectedCompanyIds.length > 0) {
    for (const companyId of options.selectedCompanyIds) {
      const hasRow = tableRows.some((r) => r.companyId === companyId);
      if (!hasRow) {
        const company = state.companies.find((c) => c.id === companyId);
        if (!company) continue;
        excludedCompanies.push({
          id: companyId,
          name: company.name,
          reason: `No ${options.includeNeedsValidation ? "" : "approved "}${options.metric} data for ${
            options.period === "all" ? "the selected filters" : options.period
          }`,
        });
      }
    }
  }

  // All periods: one chart row per company + period. Specific period: one row per company.
  let comparableRows = [...tableRows];

  const dominantUnit = getDominantUnit(comparableRows);
  if (dominantUnit) {
    comparableRows = comparableRows.filter((row) => areUnitsCompatible(row.unit, dominantUnit));
  }

  const multiPeriod = options.period === "all";
  comparableRows = sortComparableRows(comparableRows, options.comparisonSort, multiPeriod);
  tableRows = sortComparableRows(tableRows, options.comparisonSort, multiPeriod);

  const currencies = new Set(
    comparableRows
      .filter((r) => unitProfile(r.unit).kind === "currency")
      .map((r) => unitProfile(r.unit).currency ?? r.unit)
  );

  return {
    comparableRows,
    excludedCompanies,
    tableRows,
    hasMixedCurrencies: currencies.size > 1,
    availableCompanyIds,
    effectiveCompanyIds,
  };
}

function sortComparableRows(
  rows: ComparableMetricRow[],
  sort: ComparisonSort,
  multiPeriod: boolean
): ComparableMetricRow[] {
  const copy = [...rows];
  switch (sort) {
    case "lowest":
      return copy.sort(
        (a, b) =>
          (a.normalizedValue ?? 0) - (b.normalizedValue ?? 0) ||
          a.companyName.localeCompare(b.companyName) ||
          (multiPeriod ? a.reportPeriod.localeCompare(b.reportPeriod) : 0)
      );
    case "name":
      return copy.sort(
        (a, b) =>
          a.companyName.localeCompare(b.companyName) ||
          (multiPeriod ? a.reportPeriod.localeCompare(b.reportPeriod) : 0)
      );
    case "recent":
      return copy.sort(
        (a, b) =>
          new Date(b.reviewedAt ?? b.reportPeriod).getTime() -
            new Date(a.reviewedAt ?? a.reportPeriod).getTime() ||
          a.companyName.localeCompare(b.companyName)
      );
    case "highest":
    default:
      return copy.sort(
        (a, b) =>
          (b.normalizedValue ?? 0) - (a.normalizedValue ?? 0) ||
          a.companyName.localeCompare(b.companyName) ||
          (multiPeriod ? a.reportPeriod.localeCompare(b.reportPeriod) : 0)
      );
  }
}

export function getApprovedExportRows(rows: ComparableMetricRow[]): ComparableMetricRow[] {
  return rows.filter((row) => row.status === "Approved for reporting");
}

export const getAvailableExplorerMetrics = getAvailableMetrics;
export const getAvailableExplorerPeriods = getAvailablePeriods;
export const getExplorerSectors = getAvailableSectors;
export const getExplorerCompanyOptions = getEligibleCompanies;
export const buildComparisonResult = getComparisonResults;
