/**
 * Rules for which metrics each company should report: sector defaults,
 * company overrides, and how missing values are labeled.
 */

import type { MetricName } from "./types";
import { ALL_METRICS } from "./types";
import type {
  MetricExpectation,
  MetricRequirement,
  MetricResolutionState,
} from "./monitoring-phase-types";

const id = (parts: string[]) => `exp-${parts.join("-").toLowerCase().replace(/\s+/g, "-")}`;

/**
 * Map portfolio classification sectors onto expectation-default keys.
 */
export function mapPortfolioSectorToExpectationKey(sector: string): string {
  const s = sector.trim();
  const map: Record<string, string> = {
    Fintech: "Financial Services",
    "Financial Services": "Financial Services",
    "Industrial & Manufacturing": "Industrial",
    Industrial: "Industrial",
    Healthcare: "Healthcare",
    "Healthcare Services": "Healthcare Services",
    "Enterprise Software": "Enterprise Software",
    "B2B SaaS": "B2B SaaS",
    "Real Estate": "Real Estate",
    Consumer: "Consumer",
    "Energy & Climate": "Industrial",
    "Logistics & Transportation": "Industrial",
  };
  return map[s] ?? s;
}

/** Sector default expectations — company overrides take precedence. */
export const SECTOR_METRIC_DEFAULTS: Record<
  string,
  Partial<Record<MetricName | string, MetricRequirement>>
> = {
  "Enterprise Software": {
    Revenue: "required",
    ARR: "required",
    EBITDA: "required",
    Cash: "required",
    Headcount: "required",
    Churn: "required",
  },
  "B2B SaaS": {
    Revenue: "required",
    ARR: "required",
    EBITDA: "required",
    Cash: "required",
    Headcount: "required",
    Churn: "required",
  },
  "Real Estate": {
    Revenue: "required",
    ARR: "not_applicable",
    EBITDA: "optional",
    Cash: "required",
    Headcount: "optional",
    Churn: "not_applicable",
  },
  Healthcare: {
    Revenue: "required",
    ARR: "not_applicable",
    EBITDA: "required",
    Cash: "required",
    Headcount: "required",
    Churn: "optional",
  },
  "Healthcare Services": {
    Revenue: "required",
    ARR: "not_applicable",
    EBITDA: "required",
    Cash: "required",
    Headcount: "required",
    Churn: "optional",
  },
  "Financial Services": {
    Revenue: "required",
    ARR: "optional",
    EBITDA: "required",
    Cash: "required",
    Headcount: "required",
    Churn: "optional",
  },
  Industrial: {
    Revenue: "required",
    ARR: "not_applicable",
    EBITDA: "required",
    Cash: "required",
    Headcount: "required",
    Churn: "not_applicable",
  },
  Consumer: {
    Revenue: "required",
    ARR: "not_applicable",
    EBITDA: "required",
    Cash: "required",
    Headcount: "optional",
    Churn: "optional",
  },
};

/** Build default expectation records for every metric in one sector. */
export function buildSectorDefaultExpectations(sector: string): MetricExpectation[] {
  const key = mapPortfolioSectorToExpectationKey(sector);
  const defaults = SECTOR_METRIC_DEFAULTS[key] ?? {};
  return ALL_METRICS.map((metricName) => {
    const requirement = defaults[metricName] ?? "not_configured";
    return {
      id: id(["sector", key, metricName]),
      metricDefinitionId: metricName.toLowerCase(),
      metricName,
      sector: key,
      requirement,
      reason: `Sector default for ${key}`,
      reasonSource: "sector_default" as const,
    };
  });
}

/**
 * Resolve effective expectation: company override > sector default > not_configured.
 */
export function getMetricExpectation(
  expectations: MetricExpectation[],
  input: { companyId: string; sector: string; metricName: string }
): MetricExpectation {
  const sectorKey = mapPortfolioSectorToExpectationKey(input.sector);
  const companyOverride = expectations.find(
    (e) =>
      e.companyId === input.companyId &&
      e.metricName.toLowerCase() === input.metricName.toLowerCase()
  );
  if (companyOverride) return companyOverride;

  const sectorDefault = expectations.find(
    (e) =>
      !e.companyId &&
      (e.sector === sectorKey || e.sector === input.sector) &&
      e.metricName.toLowerCase() === input.metricName.toLowerCase()
  );
  if (sectorDefault) return sectorDefault;

  const built = buildSectorDefaultExpectations(sectorKey).find(
    (e) => e.metricName.toLowerCase() === input.metricName.toLowerCase()
  );
  return (
    built ?? {
      id: id(["none", input.companyId, input.metricName]),
      metricDefinitionId: input.metricName.toLowerCase(),
      metricName: input.metricName,
      companyId: input.companyId,
      requirement: "not_configured",
      reasonSource: "manual",
      reason: "No expectation configured",
    }
  );
}

/** List the effective expectation for every standard metric at one company. */
export function getExpectedMetricsForCompany(
  expectations: MetricExpectation[],
  companyId: string,
  sector: string
): MetricExpectation[] {
  return ALL_METRICS.map((metricName) =>
    getMetricExpectation(expectations, { companyId, sector, metricName })
  );
}

/** Decide the status label when a metric was or was not found, given what was required. */
export function classifyMetricResolution(input: {
  requirement: MetricRequirement;
  found: boolean;
  needsValidation?: boolean;
  approved?: boolean;
  extractionFailed?: boolean;
  conflicting?: boolean;
}): MetricResolutionState {
  if (input.conflicting) return "Conflicting values found";
  if (input.extractionFailed) return "Extraction failed";
  if (input.requirement === "not_applicable") return "Not applicable";
  if (input.requirement === "not_configured") {
    return input.found
      ? input.approved
        ? "Approved"
        : input.needsValidation
          ? "Found — needs validation"
          : "Found"
      : "Not configured";
  }
  if (input.found) {
    if (input.approved) return "Approved";
    if (input.needsValidation) return "Found — needs validation";
    return "Found";
  }
  if (input.requirement === "optional") return "Optional metric not reported";
  if (input.requirement === "required") return "Missing from report";
  return "Needs clarification";
}

/** Create a company-specific override for one metric's reporting requirement. */
export function createCompanyOverride(input: {
  companyId: string;
  metricName: string;
  requirement: MetricRequirement;
  reason: string;
  configuredBy: string;
  reasonSource?: MetricExpectation["reasonSource"];
}): MetricExpectation {
  return {
    id: id(["company", input.companyId, input.metricName]),
    metricDefinitionId: input.metricName.toLowerCase(),
    metricName: input.metricName,
    companyId: input.companyId,
    requirement: input.requirement,
    reason: input.reason,
    reasonSource: input.reasonSource ?? "company_policy",
    configuredBy: input.configuredBy,
    configuredAt: new Date().toISOString(),
  };
}

/** Create or update a sector-wide default requirement for one metric. */
export function createSectorRequirement(input: {
  sector: string;
  metricName: string;
  requirement: MetricRequirement;
  reason: string;
  configuredBy: string;
}): MetricExpectation {
  const key = mapPortfolioSectorToExpectationKey(input.sector);
  return {
    id: id(["sector", key, input.metricName]),
    metricDefinitionId: input.metricName.toLowerCase(),
    metricName: input.metricName,
    sector: key,
    requirement: input.requirement,
    reason: input.reason,
    reasonSource: "sector_policy",
    configuredBy: input.configuredBy,
    configuredAt: new Date().toISOString(),
  };
}
