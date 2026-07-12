/**
 * Default rules that tell the extractor which labels to look for and what
 * unit each standard metric (Revenue, ARR, EBITDA, etc.) should use.
 */

import type { ExtractionRule, MetricDataType, MetricValueContext } from "./types";
import { METRIC_DEFINITION_META } from "./metric-definitions";
import type { MetricName } from "./types";

function rule(
  metricName: MetricName,
  aliases: string[],
  expectedUnit: string,
  type: MetricDataType
): ExtractionRule {
  return {
    metricName,
    aliases,
    expectedUnit,
    enabled: true,
    type,
    description: METRIC_DEFINITION_META[metricName].description,
    supportedContexts: ["actual"] as MetricValueContext[],
  };
}

/** Built-in extraction rules for the six standard portfolio metrics. */
export const DEFAULT_EXTRACTION_RULES: ExtractionRule[] = [
  rule(
    "Revenue",
    ["q2 revenue", "total revenue", "net revenue", "revenue", "sales", "net sales"],
    "USD",
    "currency"
  ),
  rule(
    "ARR",
    ["arr", "annual recurring revenue", "recurring revenue", "run-rate revenue"],
    "USD",
    "currency"
  ),
  rule(
    "EBITDA",
    [
      "ebitda",
      "adjusted ebitda",
      "earnings before interest taxes depreciation amortization",
    ],
    "USD",
    "currency"
  ),
  rule(
    "Cash",
    ["cash", "cash balance", "cash and cash equivalents", "liquidity"],
    "USD",
    "currency"
  ),
  rule(
    "Headcount",
    ["headcount", "employees", "total employees", "fte", "full-time employees"],
    "FTE",
    "count"
  ),
  rule(
    "Churn",
    ["churn", "logo churn", "gross churn", "net churn", "revenue churn"],
    "%",
    "percentage"
  ),
];
