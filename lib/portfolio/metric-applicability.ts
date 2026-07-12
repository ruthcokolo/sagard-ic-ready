/**
 * Metric applicability suggestions — never auto-mutates expectations.
 */
import type { ConfidenceLevel } from "./types";
import type {
  MetricApplicabilitySuggestion,
  MetricExpectation,
  MetricRequirement,
} from "./monitoring-phase-types";
import { getMetricExpectation } from "./metric-expectations";

export function suggestMetricApplicability(input: {
  companyId: string;
  companyName: string;
  sector: string;
  businessModelHint?: string;
  metricName: string;
  found: boolean;
  expectations: MetricExpectation[];
}): MetricApplicabilitySuggestion | null {
  if (input.found) return null;

  const expectation = getMetricExpectation(input.expectations, {
    companyId: input.companyId,
    sector: input.sector,
    metricName: input.metricName,
  });

  if (expectation.requirement === "not_applicable") {
    return null;
  }

  if (expectation.requirement === "not_configured") {
    return {
      metricName: input.metricName,
      companyId: input.companyId,
      suggestion: "not_configured",
      confidence: "Medium",
      rationale: `${input.metricName} has no configured expectation for ${input.companyName}. Configure whether it is required, optional, or not applicable.`,
    };
  }

  const sector = input.sector.toLowerCase();
  const metric = input.metricName.toLowerCase();
  const isRealEstate =
    sector.includes("real estate") || sector.includes("property");
  const isSaasMetric = ["arr", "churn", "nrr", "logo churn"].includes(metric);

  if (isRealEstate && isSaasMetric) {
    return {
      metricName: input.metricName,
      companyId: input.companyId,
      suggestion: "possibly_not_applicable",
      confidence: "Medium" as ConfidenceLevel,
      rationale: `${input.companyName} operates in ${input.sector}. Recurring rental revenue, NOI, occupancy, and funds from operations are generally more relevant than SaaS-style ${input.metricName}.`,
      recommendedReplacement: metric === "arr" ? "NOI" : undefined,
    };
  }

  if (expectation.requirement === "required") {
    return {
      metricName: input.metricName,
      companyId: input.companyId,
      suggestion: "missing_required",
      confidence: "High",
      rationale: `${input.metricName} is configured as required for ${input.companyName} (${expectation.reason ?? "company/sector expectation"}) and was not found in the report.`,
    };
  }

  if (expectation.requirement === "optional") {
    return {
      metricName: input.metricName,
      companyId: input.companyId,
      suggestion: "needs_clarification",
      confidence: "Low",
      rationale: `Optional metric ${input.metricName} was not reported. No urgent follow-up is required unless monitoring needs change.`,
    };
  }

  return null;
}

export function requirementLabel(requirement: MetricRequirement): string {
  switch (requirement) {
    case "required":
      return "Required";
    case "optional":
      return "Optional";
    case "not_applicable":
      return "Not applicable";
    case "not_configured":
      return "Not configured";
  }
}
