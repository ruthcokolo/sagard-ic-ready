/**
 * Formatting and summary helpers for portfolio metric extraction data —
 * display values, confidence tones, and company coverage matrices.
 */

import type { PortfolioMetric } from "@/lib/portfolio-metrics-data";
import { METRIC_CATALOG, PORTFOLIO_METRICS } from "@/lib/portfolio-metrics-data";

/** Formats a normalized metric value for display (currency, percent, or count). */
export function formatMetricValue(metric: PortfolioMetric): string {
  if (metric.unit === "percent") return `${metric.normalizedValue}%`;
  if (metric.unit === "count") return metric.normalizedValue.toLocaleString();
  if (metric.normalizedValue >= 1_000_000) {
    return `$${(metric.normalizedValue / 1_000_000).toFixed(1)}M`;
  }
  return `$${metric.normalizedValue.toLocaleString()}`;
}

/** Maps a numeric confidence score to a high/medium/low tone bucket. */
export function confidenceTone(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.75) return "medium";
  return "low";
}

/** Aggregate counts for companies, metrics, and low-confidence extractions. */
export function getPortfolioSummary(metrics: PortfolioMetric[] = PORTFOLIO_METRICS) {
  const companies = [...new Set(metrics.map((metric) => metric.company))];
  const lowConfidence = metrics.filter((metric) => metric.confidence < 0.85).length;
  return {
    reportCount: companies.length,
    metricCount: metrics.length,
    companies,
    lowConfidence,
  };
}

/** Per-company presence matrix across the standard metric catalog. */
export function getCoverageMatrix(metrics: PortfolioMetric[] = PORTFOLIO_METRICS) {
  const companies = [...new Set(metrics.map((metric) => metric.company))].sort();
  return companies.map((company) => {
    const companyMetrics = new Set(
      metrics.filter((metric) => metric.company === company).map((metric) => metric.metricKey),
    );
    return {
      company,
      cells: METRIC_CATALOG.map((metric) => ({
        key: metric.key,
        label: metric.label,
        present: companyMetrics.has(metric.key),
      })),
    };
  });
}

/** Human-readable label for an extraction method enum value. */
export function methodLabel(method: PortfolioMetric["extractionMethod"]): string {
  switch (method) {
    case "inline_label":
      return "Inline label";
    case "table_row":
      return "Table row";
    case "narrative_prose":
      return "Narrative prose";
  }
}
