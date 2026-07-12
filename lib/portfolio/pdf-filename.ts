import { TEMPLATE_COMPANY_SPECS } from "./template-companies";
import { COMPANY_FORMATTED_PDF_CATALOG } from "./sample-pdf-catalog";

/**
 * Shared filename parsing for upload queue + package creation.
 * Handles underscores, ICReady template prefixes, and CamelCase company tokens.
 */

const PERIOD_PATTERN =
  /\b((?:Q[1-4]|H[12]|FY)\s*20\d{2}|20\d{2}\s*(?:Q[1-4]|H[12]))\b/i;

const REPORT_TYPE_PATTERN =
  /\b(?:board\s*pack|board\s*report|board\s*update|portfolio\s*report|operating\s*review|investor\s*(?:deck|update)|management\s*report|financial\s*pack|quarterly\s*(?:report|results|submission)|results|earnings|update|report|appendix|scanned(?:\s*appendix)?|ocr\s*required|submission)\b/gi;

const NOISE_WORDS =
  /\b(?:icready|template|confidential|company[- ]provided|reporting)\b/gi;

const KNOWN_COMPANY_ALIASES: { compact: string; name: string }[] = [
  ...TEMPLATE_COMPANY_SPECS.map((s) => ({
    compact: s.slug.replace(/[^a-z0-9]/gi, "").toLowerCase(),
    name: s.name,
  })),
  ...COMPANY_FORMATTED_PDF_CATALOG.map((s) => ({
    compact: s.companyName.replace(/[^a-z0-9]/gi, "").toLowerCase(),
    name: s.companyName,
  })),
  { compact: "dataharbor", name: "Data Harbor" },
  { compact: "summitindustrial", name: "Summit Industrial" },
  { compact: "northwindconsumer", name: "Northwind Consumer" },
  { compact: "novafinancialgroup", name: "Nova Financial Group" },
];

/** Normalize separators so Q1_2026 / Q1-2026 / Q1 2026 all match. */
export function normalizeFileNameTokens(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Format a matched period token as "Q2 2026" / "H1 2026" / "FY 2026". */
export function formatReportPeriod(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const q = cleaned.match(/^Q\s*([1-4])\s*(20\d{2})$/i);
  if (q) return `Q${q[1]} ${q[2]}`;
  const h = cleaned.match(/^H\s*([12])\s*(20\d{2})$/i);
  if (h) return `H${h[1]} ${h[2]}`;
  const fy = cleaned.match(/^FY\s*(20\d{2})$/i);
  if (fy) return `FY ${fy[1]}`;
  const yearFirst = cleaned.match(/^(20\d{2})\s*Q\s*([1-4])$/i);
  if (yearFirst) return `Q${yearFirst[2]} ${yearFirst[1]}`;
  return cleaned;
}

/** Pull a reporting period like "Q2 2026" out of a PDF filename. */
export function extractReportPeriodFromFileName(fileName: string): string | undefined {
  const normalized = normalizeFileNameTokens(fileName);
  const match = normalized.match(PERIOD_PATTERN);
  if (!match) return undefined;
  return formatReportPeriod(match[0]);
}

/** Split CamelCase / PascalCase tokens: DataHarbor → Data Harbor. */
export function splitCamelCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCaseWords(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^(?:Q[1-4]|H[12]|FY|\d+)$/i.test(word)) return word.toUpperCase();
      if (/^(?:OS|IT|AI|ARR|USD|PDF)$/i.test(word)) return word.toUpperCase();
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Ensure CamelCase tokens become spaced display names: RouteMind → Route Mind. */
export function humanizeCompanyDisplayName(value: string): string {
  const spaced = splitCamelCase(value);
  const titled = titleCaseWords(spaced);
  const parts = titled.split(" ");
  const deduped: string[] = [];
  for (const part of parts) {
    if (deduped[deduped.length - 1]?.toLowerCase() === part.toLowerCase()) continue;
    deduped.push(part);
  }
  return deduped.join(" ").trim();
}

function matchKnownCompany(candidate: string): string | undefined {
  const compact = candidate.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (!compact) return undefined;
  const exact = KNOWN_COMPANY_ALIASES.find((a) => a.compact === compact);
  if (exact) return humanizeCompanyDisplayName(exact.name);
  const contained = KNOWN_COMPANY_ALIASES.filter(
    (a) => a.compact.length >= 6 && compact.includes(a.compact)
  ).sort((a, b) => b.compact.length - a.compact.length)[0];
  return contained ? humanizeCompanyDisplayName(contained.name) : undefined;
}

/**
 * Derive a clean company display name from a PDF filename.
 * Example: ICReady_Template_RouteMind_Q2_2026.pdf → Route Mind
 */
export function extractCompanyNameFromFileName(fileName: string): string {
  let base = normalizeFileNameTokens(fileName);

  base = base.replace(/^icready\s+template\s+/i, "");
  base = base.replace(/^icready\s+/i, "");
  base = base.replace(PERIOD_PATTERN, " ");
  base = base.replace(REPORT_TYPE_PATTERN, " ");
  base = base.replace(NOISE_WORDS, " ");
  base = base.replace(/\s+/g, " ").trim();

  const known = matchKnownCompany(base);
  if (known) return known;

  return humanizeCompanyDisplayName(base) || "Unknown Company";
}

export function parsePdfFileName(fileName: string): {
  companyName: string;
  reportPeriod: string;
} {
  return {
    companyName: extractCompanyNameFromFileName(fileName),
    reportPeriod: extractReportPeriodFromFileName(fileName) ?? "",
  };
}

/** @deprecated Prefer extractCompanyNameFromFileName */
export function inferCompanyNameFromFileName(fileName: string): string {
  return extractCompanyNameFromFileName(fileName);
}

/** Green / yellow / red band for coverage percentage display. */
export function coverageTone(value: number): "green" | "yellow" | "red" {
  if (value >= 80) return "green";
  if (value >= 65) return "yellow";
  return "red";
}

/** Hex stroke color for a coverage ring chart at this percentage. */
export function coverageStrokeColor(value: number): string {
  switch (coverageTone(value)) {
    case "green":
      return "#059669";
    case "yellow":
      return "#d97706";
    default:
      return "#dc2626";
  }
}

/** Tailwind background class for a coverage progress bar. */
export function coverageBarClass(value: number): string {
  switch (coverageTone(value)) {
    case "green":
      return "bg-emerald-500";
    case "yellow":
      return "bg-amber-500";
    default:
      return "bg-red-500";
  }
}
