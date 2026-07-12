/**
 * Extracts metrics from ICReady template PDFs that use fixed field labels
 * instead of free-form company report layouts.
 */

import type { ExtractionCandidate, MetricName, PageText } from "./types";
import { ICReady_TEMPLATE_MARKER } from "./template-companies";
import { parseValueFromSegment } from "./extraction-parse";
import { extractMetricEvidenceSentence } from "./pdf-text";

const TEMPLATE_FIELD_MAP: { label: string; metricName: MetricName }[] = [
  { label: "Total Revenue:", metricName: "Revenue" },
  { label: "Annual Recurring Revenue (ARR):", metricName: "ARR" },
  { label: "Adjusted EBITDA:", metricName: "EBITDA" },
  { label: "Cash and Cash Equivalents:", metricName: "Cash" },
  { label: "Total Employees:", metricName: "Headcount" },
  { label: "Logo Churn:", metricName: "Churn" },
];

const ALL_TEMPLATE_LABELS = TEMPLATE_FIELD_MAP.map((f) => f.label);

/** True when the PDF text contains the ICReady template marker string. */
export function isIcReadyTemplateDocument(pages: PageText[]): boolean {
  const full = pages.map((p) => p.text).join(" ");
  return full.includes(ICReady_TEMPLATE_MARKER);
}

function segmentAfterLabel(fullText: string, label: string): string {
  const idx = fullText.indexOf(label);
  if (idx < 0) return "";

  let rest = fullText.slice(idx + label.length);
  let end = rest.length;

  for (const other of ALL_TEMPLATE_LABELS) {
    if (other === label) continue;
    const pos = rest.indexOf(other);
    if (pos > 0 && pos < end) end = pos;
  }

  for (const marker of [
    "Section 1:",
    "Section 2:",
    "Section 3:",
    "Section 4:",
    "Management Commentary:",
    "Key Risks:",
    "Follow-up Items:",
    "The company confirms",
  ]) {
    const pos = rest.indexOf(marker);
    if (pos > 0 && pos < end) end = pos;
  }

  return rest.slice(0, end).trim();
}

function evidenceLine(fullText: string, label: string, rawValue: string): string {
  const idx = fullText.indexOf(label);
  if (idx < 0) return `${label} ${rawValue}`;
  const segment = fullText.slice(idx, idx + label.length + rawValue.length + 8).trim();
  return segment.replace(/\s+/g, " ");
}

/** Read fixed-label fields from ICReady template pages into extraction candidates. */
export function extractMetricsFromTemplatePages(pages: PageText[]): ExtractionCandidate[] {
  const results: ExtractionCandidate[] = [];
  const found = new Set<MetricName>();

  for (const page of pages) {
    const text = page.text;

    for (const field of TEMPLATE_FIELD_MAP) {
      if (found.has(field.metricName)) continue;

      const segment = segmentAfterLabel(text, field.label);
      if (!segment) continue;

      const value = parseValueFromSegment(segment, field.metricName);
      if (!value) continue;

      found.add(field.metricName);
      const line = evidenceLine(text, field.label, value.raw);

      results.push({
        metricName: field.metricName,
        extractedValue: value.raw,
        normalizedValue: value.normalized,
        unit: value.unit,
        sourcePage: page.page,
        evidenceText: extractMetricEvidenceSentence(line, field.label.slice(0, -1), value.raw),
        confidence: "High",
        matchedLabel: field.label.slice(0, -1),
      });
    }
  }

  return results;
}

/** Tell whether a PDF is an ICReady template or a company-formatted report. */
export function detectSourceFormat(
  pages: PageText[],
  fileName?: string
): "Company-formatted PDF" | "ICReady template" {
  if (isIcReadyTemplateDocument(pages)) return "ICReady template";
  if (fileName?.includes("ICReady_Template")) return "ICReady template";
  return "Company-formatted PDF";
}
