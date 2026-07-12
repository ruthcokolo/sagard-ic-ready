/**
 * Heuristic metadata from filename + text sample before full extraction runs.
 * Does not replace PDF extraction — used for upload queue readiness.
 */

import type { DetectedPackageMetadata } from "./monitoring-phase-types";
import {
  extractCompanyNameFromFileName,
  extractReportPeriodFromFileName,
  normalizeFileNameTokens,
} from "./pdf-filename";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URL_RE =
  /\b(?:https?:\/\/)?(?:www\.)[a-z0-9-]+(?:\.[a-z]{2,})+(?:\/[^\s]*)?|\b(?:https?:\/\/)[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i;
const CURRENCY_RE = /\b(USD|CAD|EUR|GBP|US\$|C\$)\b/i;

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function detectPackageMetadata(input: {
  fileName: string;
  textSample?: string;
  knownCompanyNames?: string[];
}): DetectedPackageMetadata {
  const text = `${input.fileName}\n${input.textSample ?? ""}`;
  const emailMatch = text.match(EMAIL_RE);
  const currencyMatch = text.match(CURRENCY_RE);
  const urlMatch = text.match(URL_RE);

  const parsedCompany = extractCompanyNameFromFileName(input.fileName);
  const parsedPeriod = extractReportPeriodFromFileName(input.fileName);

  let companyName: DetectedPackageMetadata["companyName"] = {
    confidence: "low",
  };

  if (input.knownCompanyNames?.length) {
    const haystack = normalizeForMatch(
      `${normalizeFileNameTokens(input.fileName)} ${input.textSample ?? ""} ${parsedCompany}`
    );
    const hit = input.knownCompanyNames.find((n) => {
      const needle = normalizeForMatch(n);
      return needle.length >= 3 && haystack.includes(needle);
    });
    if (hit) {
      companyName = {
        value: hit,
        confidence: "high",
        evidenceText: hit,
      };
    }
  }

  if (!companyName.value && parsedCompany && parsedCompany !== "Unknown Company") {
    companyName = {
      value: parsedCompany,
      confidence: "high",
      evidenceText: input.fileName,
    };
  }

  const periodFromText = extractReportPeriodFromFileName(
    `${input.fileName} ${input.textSample ?? ""}`
  );
  const reportingPeriod = parsedPeriod ?? periodFromText;

  const isTemplate =
    /icready[_\s-]?template/i.test(input.fileName) ||
    /icready template/i.test(input.textSample ?? "");
  const looksScanned =
    (input.textSample?.trim().length ?? 0) < 40 && Boolean(input.textSample !== undefined);

  return {
    companyName,
    reportingPeriod: {
      value: reportingPeriod,
      confidence: reportingPeriod ? "high" : "low",
      evidenceText: reportingPeriod
        ? `Period found in filename: ${input.fileName}`
        : undefined,
    },
    currency: {
      value: currencyMatch?.[0],
      confidence: currencyMatch ? "medium" : "low",
      evidenceText: currencyMatch?.[0],
    },
    website: {
      value: urlMatch?.[0],
      confidence: urlMatch ? "medium" : "low",
      evidenceText: urlMatch?.[0],
    },
    reportingContactEmail: {
      value: emailMatch?.[0],
      confidence: emailMatch ? "medium" : "low",
      evidenceText: emailMatch?.[0],
    },
    sourceFormat: {
      value: looksScanned
        ? "Scanned PDF"
        : isTemplate
          ? "ICReady template"
          : "Company-formatted PDF",
      confidence: isTemplate || looksScanned ? "high" : "medium",
    },
  };
}

export function periodsConflict(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const na = a.toLowerCase().replace(/\s+/g, "");
  const nb = b.toLowerCase().replace(/\s+/g, "");
  return na !== nb;
}
