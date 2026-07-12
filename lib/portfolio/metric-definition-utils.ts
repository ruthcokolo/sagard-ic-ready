/**
 * Helpers for metric setup: guess data types from units, show labels, and check if a metric can be deleted.
 */

import type {
  ExtractionRule,
  MetricDataType,
  MetricName,
  MetricValueContext,
  PortfolioState,
} from "./types";
import { METRIC_DEFINITION_META } from "./metric-definitions";
import { getMetricExpectation } from "./metric-expectations";

export const METRIC_DATA_TYPE_LABELS: Record<MetricDataType, string> = {
  currency: "Currency",
  percentage: "Percentage",
  count: "Count",
  ratio: "Ratio",
  text: "Text",
};

export const METRIC_CONTEXT_LABELS: Record<MetricValueContext, string> = {
  actual: "Actual",
  forecast: "Forecast",
  budget: "Budget",
  prior_period: "Prior period",
};

/** Guess whether a metric is money, a percent, a count, etc. from its unit and name. */
export function inferMetricDataType(
  expectedUnit: string,
  metricName?: string
): MetricDataType {
  const unit = expectedUnit.trim().toLowerCase();
  const name = (metricName ?? "").toLowerCase();
  if (unit === "%" || unit === "percent" || unit.includes("percent") || name.includes("churn") || name.includes("margin") || name.includes("rate")) {
    return "percentage";
  }
  if (
    unit === "count" ||
    unit === "fte" ||
    unit === "employees" ||
    unit === "customers" ||
    unit === "units" ||
    name.includes("headcount") ||
    name.includes("count")
  ) {
    return "count";
  }
  if (unit === "x" || unit === "ratio" || name.includes("ratio") || name.includes("multiple")) {
    return "ratio";
  }
  if (
    unit === "usd" ||
    unit === "cad" ||
    unit === "eur" ||
    unit === "gbp" ||
    unit.includes("dollar")
  ) {
    return "currency";
  }
  if (unit === "n/a" || unit === "text" || unit === "not applicable") {
    return "text";
  }
  return "currency";
}

/** List the unit choices shown in the UI for each metric data type. */
export function unitsForType(type: MetricDataType): string[] {
  switch (type) {
    case "currency":
      return ["USD", "CAD", "EUR", "GBP", "Other"];
    case "percentage":
      return ["%"];
    case "count":
      return ["FTE", "employees", "customers", "units", "other"];
    case "ratio":
      return ["x", "ratio"];
    case "text":
      return ["Not applicable"];
    default:
      return ["value"];
  }
}

/** Format a unit for display (e.g. show "%" instead of the word "percent"). */
export function displayUnit(unit: string, type?: MetricDataType): string {
  if (type === "percentage" || unit.toLowerCase() === "percent") return "%";
  if (unit.toLowerCase() === "not applicable") return "—";
  return unit;
}

/** Fill in missing type, description, and unit defaults on extraction rules. */
export function normalizeExtractionRules(rules: ExtractionRule[]): ExtractionRule[] {
  return rules.map((rule) => {
    const type = rule.type ?? inferMetricDataType(rule.expectedUnit, rule.metricName);
    const meta = METRIC_DEFINITION_META[rule.metricName as MetricName];
    return {
      ...rule,
      type,
      description: rule.description?.trim() || meta?.description || rule.rationale,
      supportedContexts:
        rule.supportedContexts && rule.supportedContexts.length > 0
          ? rule.supportedContexts
          : (["actual"] as MetricValueContext[]),
      enabled: rule.enabled !== false,
      expectedUnit:
        rule.expectedUnit === "percent" ? "%" : rule.expectedUnit || unitsForType(type)[0],
    };
  });
}

export type MetricUsageSummary = {
  sectorCount: number;
  companyCount: number;
  hasActiveRequirements: boolean;
  hasExtractedValues: boolean;
  hasApprovedValues: boolean;
  hasCompanyOverrides: boolean;
  canDelete: boolean;
  blockReason?: string;
};

/** Usage derived only from existing portfolio store data — never fabricated. */
export function getMetricUsage(
  state: PortfolioState,
  metricName: string
): MetricUsageSummary {
  const key = metricName.toLowerCase();
  const expectations = state.metricExpectations ?? [];

  const sectorKeys = new Set<string>();
  let hasCompanyOverrides = false;
  for (const e of expectations) {
    if (e.metricName.toLowerCase() !== key) continue;
    if (e.companyId) {
      hasCompanyOverrides = true;
      continue;
    }
    if (e.requirement && e.requirement !== "not_configured" && e.sector) {
      sectorKeys.add(e.sector);
    }
  }

  const companyIds = new Set<string>();
  for (const company of state.companies) {
    const effective = getMetricExpectation(expectations, {
      companyId: company.id,
      sector: company.sector,
      metricName,
    });
    if (effective.requirement !== "not_configured") {
      companyIds.add(company.id);
    }
  }

  const extracted = state.metrics.filter((m) => m.metricName.toLowerCase() === key);
  const hasExtractedValues = extracted.length > 0;
  const hasApprovedValues = extracted.some((m) => m.status === "Approved for reporting");
  const hasActiveRequirements = sectorKeys.size > 0 || companyIds.size > 0;

  const canDelete =
    !hasExtractedValues &&
    !hasApprovedValues &&
    !hasActiveRequirements &&
    !hasCompanyOverrides;

  let blockReason: string | undefined;
  if (!canDelete) {
    const parts: string[] = [];
    if (sectorKeys.size) parts.push(`${sectorKeys.size} sector${sectorKeys.size === 1 ? "" : "s"}`);
    if (companyIds.size) {
      parts.push(`${companyIds.size} compan${companyIds.size === 1 ? "y" : "ies"}`);
    }
    if (hasExtractedValues || hasApprovedValues) {
      parts.push("historical extracted values");
    }
    blockReason = `${metricName} is used by ${parts.join(", ") || "existing records"}.`;
  }

  return {
    sectorCount: sectorKeys.size,
    companyCount: companyIds.size,
    hasActiveRequirements,
    hasExtractedValues,
    hasApprovedValues,
    hasCompanyOverrides,
    canDelete,
    blockReason,
  };
}

/** Find other metrics that already use the same search alias. */
export function findAliasConflicts(
  rules: ExtractionRule[],
  alias: string,
  excludeMetricName?: string
): ExtractionRule[] {
  const normalized = alias.trim().toLowerCase();
  if (!normalized) return [];
  return rules.filter((rule) => {
    if (
      excludeMetricName &&
      rule.metricName.toLowerCase() === excludeMetricName.toLowerCase()
    ) {
      return false;
    }
    return rule.aliases.some((a) => a.trim().toLowerCase() === normalized);
  });
}
