/**
 * Exports approved metrics to CSV and triggers a browser download of the file.
 */

import type { ExtractedMetric, PortfolioState } from "./types";

const CSV_HEADERS = [
  "company",
  "sector",
  "reporting_period",
  "metric",
  "value",
  "unit",
  "source_file",
  "source_page",
  "evidence",
  "validation_status",
  "reviewed_by",
  "reviewed_at",
];

function companySectorForExport(state: PortfolioState | undefined, companyId: string): string {
  if (!state) return "";
  const company = state.companies.find((c) => c.id === companyId);
  return company?.sector ?? "";
}

function escapeCsv(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Turn extracted metrics into a CSV string with standard export columns. */
export function metricsToCsv(
  metrics: ExtractedMetric[],
  state?: PortfolioState
): string {
  const rows = metrics.map((m) =>
    [
      m.companyName,
      companySectorForExport(state, m.companyId),
      m.reportPeriod,
      m.metricName,
      m.extractedValue,
      m.unit,
      m.sourceFile,
      m.sourcePage,
      m.evidenceText,
      m.status,
      m.reviewedBy ?? "",
      m.reviewedAt ?? "",
    ]
      .map(escapeCsv)
      .join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

/** Save a CSV string as a file download in the browser. */
export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
