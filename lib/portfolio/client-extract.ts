import { classifyCompanySector } from "./sector-classification";
import { inferCompanyNameFromFileName } from "./pdf-filename";
import { ALL_METRICS } from "./types";
import type {
  ExtractionCandidate,
  ExtractionRule,
  MetricName,
  PackageSourceFormat,
} from "./types";

export type ClientExtractionResult = {
  candidates: ExtractionCandidate[];
  missingMetrics: MetricName[];
  pagesProcessed: number;
  sourceFormat: PackageSourceFormat;
  documentText?: string;
  sector?: string;
  warning?: string;
  extractionSource: "server";
};

/**
 * Extract metrics via the server API only.
 * PDF.js runs on the server (Node) — never bundled into the browser.
 */
export async function extractMetricsFromPdfFile(
  file: File,
  rules: ExtractionRule[],
  companyName = ""
): Promise<ClientExtractionResult> {
  const inferredName = companyName || inferCompanyNameFromFileName(file.name);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("rules", JSON.stringify(rules));
  formData.append("companyName", inferredName);

  let response: Response;
  try {
    response = await fetch("/api/portfolio/extract", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not reach extraction service.";
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      response.status === 401
        ? "Session expired. Refresh the page and sign in again."
        : `Extraction service returned an unexpected response (${response.status}).`
    );
  }

  const data = (await response.json()) as {
    success?: boolean;
    candidates?: ExtractionCandidate[];
    missingMetrics?: MetricName[];
    pagesProcessed?: number;
    sourceFormat?: PackageSourceFormat;
    warning?: string;
    error?: string;
    sector?: string;
    documentText?: string;
  };

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ?? data.warning ?? `PDF extraction failed (${response.status}).`
    );
  }

  return {
    candidates: data.candidates ?? [],
    missingMetrics: data.missingMetrics ?? [...ALL_METRICS],
    pagesProcessed: data.pagesProcessed ?? 0,
    sourceFormat: data.sourceFormat ?? "Company-formatted PDF",
    documentText: data.documentText,
    sector:
      data.sector ?? classifyCompanySector(inferredName, data.documentText ?? ""),
    warning: data.warning,
    extractionSource: "server",
  };
}
