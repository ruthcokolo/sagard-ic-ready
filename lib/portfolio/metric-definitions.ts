/** Display metadata for portfolio metrics used in Reporting Requirements. */
import type { ExtractionRule, MetricName } from "./types";
import { ALL_METRICS } from "./types";

export type MetricDefinitionMeta = {
  id: string;
  name: string;
  description: string;
};

/** Built-in descriptions for the six standard portfolio metrics. */
export const METRIC_DEFINITION_META: Record<MetricName, MetricDefinitionMeta> = {
  Revenue: {
    id: "revenue",
    name: "Revenue",
    description: "Total revenue recognized in the period",
  },
  ARR: {
    id: "arr",
    name: "ARR",
    description: "Annual Recurring Revenue",
  },
  EBITDA: {
    id: "ebitda",
    name: "EBITDA",
    description: "Earnings Before Interest, Taxes, Depreciation & Amortization",
  },
  Cash: {
    id: "cash",
    name: "Cash",
    description: "Cash and cash equivalents",
  },
  Headcount: {
    id: "headcount",
    name: "Headcount",
    description: "Total number of FTEs",
  },
  Churn: {
    id: "churn",
    name: "Churn",
    description: "Customer churn rate",
  },
};

/** Return display names and descriptions for all metrics, using custom rules when present. */
export function listMetricDefinitions(rules?: ExtractionRule[]): MetricDefinitionMeta[] {
  if (rules?.length) {
    return rules.map((rule) => ({
      id: rule.metricName.toLowerCase().replace(/\s+/g, "-"),
      name: rule.metricName,
      description: getMetricDescription(rule.metricName, rules),
    }));
  }
  return ALL_METRICS.map((name) => METRIC_DEFINITION_META[name]);
}

/** Look up the human-readable description for a metric by name. */
export function getMetricDescription(
  metricName: string,
  rules?: ExtractionRule[]
): string {
  const key = metricName as MetricName;
  const builtIn = METRIC_DEFINITION_META[key]?.description;
  if (builtIn) return builtIn;
  const rule = rules?.find(
    (r) => r.metricName.toLowerCase() === metricName.toLowerCase()
  );
  if (rule?.description?.trim()) return rule.description.trim();
  if (rule?.rationale?.trim()) return rule.rationale.trim();
  return metricName;
}

/** Canonical metric list for requirements UI: extraction rules when available. */
export function metricNamesFromRules(rules: ExtractionRule[] | undefined): string[] {
  if (rules?.length) {
    return rules.map((r) => r.metricName);
  }
  return [...ALL_METRICS];
}
