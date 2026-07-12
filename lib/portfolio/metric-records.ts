import type { MetricName, MetricStatus } from "./types";
import { ALL_METRICS } from "./types";
import type { ExtractedMetric } from "./types";
import type { extractMetricsFromPages } from "./extraction";
import type { MetricExpectation } from "./monitoring-phase-types";
import {
  classifyMetricResolution,
  getMetricExpectation,
} from "./metric-expectations";

export function metricRecordId(packageId: string, metricName: string) {
  return `m-${packageId}-${metricName.toLowerCase().replace(/\s+/g, "-")}`;
}

function resolutionToMetricStatus(resolution: string): MetricStatus {
  switch (resolution) {
    case "Missing from report":
      return "Missing from report";
    case "Optional metric not reported":
      return "Optional metric not reported";
    case "Not applicable":
      return "Not applicable";
    case "Not configured":
      return "Not configured";
    case "Needs clarification":
      return "Needs clarification";
    case "Extraction failed":
      return "Extraction failed";
    case "Conflicting values found":
      return "Conflicting values found";
    case "Approved":
      return "Approved for reporting";
    case "Found — needs validation":
    case "Found":
      return "Needs validation";
    default:
      return "Needs validation";
  }
}

export function buildMetricsFromExtraction(
  packageId: string,
  companyId: string,
  companyName: string,
  reportPeriod: string,
  sourceFile: string,
  candidates: ReturnType<typeof extractMetricsFromPages>,
  missing: string[],
  options?: {
    expectations?: MetricExpectation[];
    sector?: string;
    knownMetrics?: string[];
  }
): ExtractedMetric[] {
  const byMetric = new Map<string, ExtractedMetric>();
  const expectations = options?.expectations ?? [];
  const sector = options?.sector ?? "Enterprise Software";

  for (const c of candidates) {
    byMetric.set(c.metricName, {
      id: metricRecordId(packageId, c.metricName),
      companyId,
      companyName,
      packageId,
      reportPeriod,
      metricName: c.metricName,
      extractedValue: c.extractedValue,
      normalizedValue: c.normalizedValue,
      unit: c.unit,
      sourceFile,
      sourcePage: c.sourcePage,
      evidenceText: c.evidenceText,
      status: "Needs validation" as const,
      confidence: c.confidence,
      originalExtractedValue: c.extractedValue,
      originalNormalizedValue: c.normalizedValue,
      valueType: c.valueType,
      tableContext: c.tableContext,
      evidenceRegions: c.evidenceRegions,
    });
  }

  // Include expectation-aware rows for all known metrics when expectations provided.
  const catalog = options?.knownMetrics?.length ? options.knownMetrics : ALL_METRICS;
  const absentNames =
    expectations.length > 0
      ? catalog.filter((m) => !byMetric.has(m))
      : missing;

  for (const metricName of absentNames) {
    if (byMetric.has(metricName)) continue;

    const expectation = getMetricExpectation(expectations, {
      companyId,
      sector,
      metricName,
    });
    const resolution = classifyMetricResolution({
      requirement: expectation.requirement,
      found: false,
    });
    const status = resolutionToMetricStatus(resolution);

    // Skip creating rows for not_configured absences unless they were in the
    // extraction "missing" list (enabled rule with no candidate).
    if (
      status === "Not configured" &&
      !missing.includes(metricName) &&
      expectation.requirement === "not_configured"
    ) {
      continue;
    }

    const evidence =
      status === "Not applicable"
        ? `${metricName} is marked not applicable for this company (${expectation.reason ?? "expectation"}).`
        : status === "Optional metric not reported"
          ? `${metricName} is optional and was not reported in this package.`
          : status === "Not configured"
            ? `${metricName} has no expectation configured for this company.`
            : `${metricName} metric not found in reporting package.`;

    byMetric.set(metricName, {
      id: metricRecordId(packageId, metricName),
      companyId,
      companyName,
      packageId,
      reportPeriod,
      metricName,
      extractedValue: "",
      normalizedValue: null,
      unit:
        metricName === "Churn"
          ? "percent"
          : metricName === "Headcount"
            ? "count"
            : "USD",
      sourceFile,
      sourcePage: 0,
      evidenceText: evidence,
      status,
      confidence: "Low",
    });
  }

  return Array.from(byMetric.values());
}
