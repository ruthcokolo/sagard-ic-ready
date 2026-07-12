/**
 * Build the rows shown on Reporting Requirements screens: what each company
 * must report, where the rule comes from, and why it applies.
 */
import type { ExtractionRule, MetricName } from "./types";
import { ALL_METRICS } from "./types";
import { getMetricDescription } from "./metric-definitions";
import {
  buildSectorDefaultExpectations,
  getMetricExpectation,
  mapPortfolioSectorToExpectationKey,
} from "./metric-expectations";
import { requirementLabel } from "./metric-applicability";
import type {
  MetricExpectation,
  MetricExpectationReasonSource,
  MetricRequirement,
} from "./monitoring-phase-types";

export type RequirementRuleSourceKind =
  | "company_override"
  | "sector_default"
  | "not_configured";

export type DisplayRationaleSource =
  | "sector_policy"
  | "company_policy"
  | "investment_team_decision"
  | "confirmed_ai_suggestion"
  | "other"
  | "—";

export type EffectiveRequirementRow = {
  metricName: string;
  metricDescription: string;
  requirement: MetricRequirement;
  requirementLabel: string;
  ruleSourceKind: RequirementRuleSourceKind;
  ruleSourcePrimary: string;
  ruleSourceSecondary: string;
  rationale: string;
  rationaleSource: DisplayRationaleSource;
  rationaleSourceLabel: string;
  isOverride: boolean;
  sectorRequirement: MetricRequirement;
  sectorRequirementLabel: string;
  sectorKey: string;
  override?: MetricExpectation;
};

const SECTOR_RATIONALE: Partial<Record<MetricName, string>> = {
  Revenue: "Core financial performance metric.",
  ARR: "Subscription / recurring revenue KPI for this sector.",
  EBITDA: "Operating profitability metric.",
  Cash: "Liquidity monitoring metric.",
  Headcount: "Workforce scale for portfolio monitoring.",
  Churn: "Retention quality for recurring businesses.",
};

/** Turn an internal reason code into a short label for the UI. */
export function rationaleSourceLabel(source: DisplayRationaleSource | string): string {
  switch (source) {
    case "sector_policy":
    case "sector_default":
      return "Sector policy";
    case "company_policy":
    case "company_override":
    case "manual":
      return "Company policy";
    case "investment_team_decision":
      return "Investment team decision";
    case "confirmed_ai_suggestion":
    case "ai_suggestion":
      return "Confirmed AI suggestion";
    case "other":
    case "historical_reporting":
      return "Other";
    case "—":
      return "—";
    default:
      return "Other";
  }
}

/** Map stored reason codes to the labels shown in requirement tables. */
export function toDisplayRationaleSource(
  source: MetricExpectationReasonSource | string | undefined,
  kind: RequirementRuleSourceKind
): DisplayRationaleSource {
  if (kind === "not_configured") return "—";
  if (kind === "sector_default") return "sector_policy";
  switch (source) {
    case "company_policy":
      return "company_policy";
    case "investment_team_decision":
      return "investment_team_decision";
    case "confirmed_ai_suggestion":
    case "ai_suggestion":
      return "confirmed_ai_suggestion";
    case "other":
    case "historical_reporting":
      return "other";
    case "manual":
    case "company_override":
      return "company_policy";
    case "sector_default":
    case "sector_policy":
      return "sector_policy";
    default:
      return kind === "company_override" ? "company_policy" : "sector_policy";
  }
}

function sectorRationale(metricName: string, sectorKey: string): string {
  if (metricName === "ARR") {
    const defaults = buildSectorDefaultExpectations(sectorKey);
    const arr = defaults.find((d) => d.metricName === "ARR");
    if (arr?.requirement === "not_applicable") {
      return "Not typically a primary KPI for this sector.";
    }
  }
  return SECTOR_RATIONALE[metricName as MetricName] ?? `Sector default for ${sectorKey}.`;
}

function describeMetric(metricName: string, rules?: ExtractionRule[]) {
  return getMetricDescription(metricName, rules);
}

/** Look up the sector-level rule for one metric (required, optional, or not applicable). */
export function getSectorRequirement(
  expectations: MetricExpectation[],
  sector: string,
  metricName: string
): MetricExpectation {
  const sectorKey = mapPortfolioSectorToExpectationKey(sector);
  const stored = expectations.find(
    (e) =>
      !e.companyId &&
      (e.sector === sectorKey || e.sector === sector) &&
      e.metricName.toLowerCase() === metricName.toLowerCase()
  );
  if (stored) return stored;
  return (
    buildSectorDefaultExpectations(sectorKey).find(
      (e) => e.metricName.toLowerCase() === metricName.toLowerCase()
    ) ?? {
      id: `exp-none-${sectorKey}-${metricName}`,
      metricDefinitionId: metricName.toLowerCase(),
      metricName,
      sector: sectorKey,
      requirement: "not_configured",
      reason: "No expectation defined yet.",
      reasonSource: "sector_default",
    }
  );
}

/** Find a company-specific override for one metric, if any. */
export function getCompanyOverride(
  expectations: MetricExpectation[],
  companyId: string,
  metricName: string
): MetricExpectation | undefined {
  return expectations.find(
    (e) =>
      e.companyId === companyId &&
      e.metricName.toLowerCase() === metricName.toLowerCase()
  );
}

/** Build one display row showing the final rule for a metric at one company. */
export function buildEffectiveRequirementRow(input: {
  expectations: MetricExpectation[];
  companyId: string;
  companyName: string;
  sector: string;
  metricName: string;
  extractionRules?: ExtractionRule[];
}): EffectiveRequirementRow {
  const sectorKey = mapPortfolioSectorToExpectationKey(input.sector);
  const sectorExp = getSectorRequirement(input.expectations, input.sector, input.metricName);
  const override = getCompanyOverride(input.expectations, input.companyId, input.metricName);
  const effective = getMetricExpectation(input.expectations, {
    companyId: input.companyId,
    sector: input.sector,
    metricName: input.metricName,
  });
  const metricDescription = describeMetric(input.metricName, input.extractionRules);

  if (override) {
    const displaySource = toDisplayRationaleSource(override.reasonSource, "company_override");
    return {
      metricName: input.metricName,
      metricDescription,
      requirement: override.requirement,
      requirementLabel: requirementLabel(override.requirement),
      ruleSourceKind: "company_override",
      ruleSourcePrimary: "Company override",
      ruleSourceSecondary: `Was ${requirementLabel(sectorExp.requirement)} in sector`,
      rationale: override.reason?.trim() || "No rationale provided.",
      rationaleSource: displaySource,
      rationaleSourceLabel: rationaleSourceLabel(displaySource),
      isOverride: true,
      sectorRequirement: sectorExp.requirement,
      sectorRequirementLabel: requirementLabel(sectorExp.requirement),
      sectorKey,
      override,
    };
  }

  if (sectorExp.requirement === "not_configured") {
    return {
      metricName: input.metricName,
      metricDescription,
      requirement: "not_configured",
      requirementLabel: "Not configured",
      ruleSourceKind: "not_configured",
      ruleSourcePrimary: "Not configured",
      ruleSourceSecondary: "No sector expectation",
      rationale: "No expectation defined yet.",
      rationaleSource: "—",
      rationaleSourceLabel: "—",
      isOverride: false,
      sectorRequirement: "not_configured",
      sectorRequirementLabel: "Not configured",
      sectorKey,
    };
  }

  const rationale =
    sectorExp.reason && !sectorExp.reason.startsWith("Sector default for")
      ? sectorExp.reason
      : sectorRationale(input.metricName, sectorKey);

  return {
    metricName: input.metricName,
    metricDescription,
    requirement: effective.requirement,
    requirementLabel: requirementLabel(effective.requirement),
    ruleSourceKind: "sector_default",
    ruleSourcePrimary: `Inherited from ${sectorKey}`,
    ruleSourceSecondary: "Sector default",
    rationale,
    rationaleSource: "sector_policy",
    rationaleSourceLabel: "Sector policy",
    isOverride: false,
    sectorRequirement: sectorExp.requirement,
    sectorRequirementLabel: requirementLabel(sectorExp.requirement),
    sectorKey,
  };
}

/** Build requirement rows for every metric at one company. */
export function buildCompanyRequirementRows(input: {
  expectations: MetricExpectation[];
  companyId: string;
  companyName: string;
  sector: string;
  metricNames?: string[];
  extractionRules?: ExtractionRule[];
}): EffectiveRequirementRow[] {
  const names = input.metricNames?.length ? input.metricNames : [...ALL_METRICS];
  return names.map((metricName) =>
    buildEffectiveRequirementRow({
      ...input,
      metricName,
      extractionRules: input.extractionRules,
    })
  );
}

/** Build requirement rows for every metric under one sector's defaults. */
export function buildSectorRequirementRows(
  expectations: MetricExpectation[],
  sector: string,
  metricNames?: string[],
  extractionRules?: ExtractionRule[]
): EffectiveRequirementRow[] {
  const sectorKey = mapPortfolioSectorToExpectationKey(sector);
  const names = metricNames?.length ? metricNames : [...ALL_METRICS];
  return names.map((metricName) => {
    const sectorExp = getSectorRequirement(expectations, sector, metricName);
    const kind: RequirementRuleSourceKind =
      sectorExp.requirement === "not_configured" ? "not_configured" : "sector_default";
    const rationale =
      sectorExp.reason && !sectorExp.reason.startsWith("Sector default for")
        ? sectorExp.reason
        : kind === "not_configured"
          ? "No expectation defined yet."
          : sectorRationale(metricName, sectorKey);
    return {
      metricName,
      metricDescription: describeMetric(metricName, extractionRules),
      requirement: sectorExp.requirement,
      requirementLabel: requirementLabel(sectorExp.requirement),
      ruleSourceKind: kind,
      ruleSourcePrimary:
        kind === "not_configured" ? "Not configured" : `${sectorKey} sector default`,
      ruleSourceSecondary: kind === "not_configured" ? "No sector expectation" : "Sector policy",
      rationale,
      rationaleSource: kind === "not_configured" ? "—" : "sector_policy",
      rationaleSourceLabel: kind === "not_configured" ? "—" : "Sector policy",
      isOverride: false,
      sectorRequirement: sectorExp.requirement,
      sectorRequirementLabel: requirementLabel(sectorExp.requirement),
      sectorKey,
    };
  });
}

export { requirementLabel };
