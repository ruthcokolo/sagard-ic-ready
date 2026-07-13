/**
 * Default investment-profile fields for key demo companies.
 * Only fills empty fields so associate edits are kept.
 */

import type { PortfolioCompany } from "./types";

type DemoProfile = Pick<
  PortfolioCompany,
  | "investmentDate"
  | "reportingFrequency"
  | "assignedAssociateId"
  | "assignedAssociateName"
  | "nextExpectedReportDate"
> & {
  name: string;
  sector: string;
};

const DEMO_COMPANY_PROFILES: Record<string, DemoProfile> = {
  "veridian-cloud-systems": {
    name: "Veridian Cloud Systems",
    sector: "Enterprise Software",
    investmentDate: "2023-03-15",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-alex",
    assignedAssociateName: "Alex Rivera",
    nextExpectedReportDate: "2026-10-15",
  },
  "stonegate-properties": {
    name: "Stonegate Properties",
    sector: "Real Estate",
    investmentDate: "2022-09-01",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-jordan",
    assignedAssociateName: "Jordan Lee",
    nextExpectedReportDate: "2026-10-31",
  },
};

function stubCompany(id: string, demo: DemoProfile): PortfolioCompany {
  const now = new Date().toISOString();
  return {
    id,
    name: demo.name,
    sector: demo.sector,
    status: "Active",
    latestReportDate: null,
    coverage: 0,
    metricsApproved: 0,
    metricsNeedsValidation: 0,
    metricsMissing: 0,
    investmentDate: demo.investmentDate,
    reportingFrequency: demo.reportingFrequency,
    assignedAssociateId: demo.assignedAssociateId,
    assignedAssociateName: demo.assignedAssociateName,
    nextExpectedReportDate: demo.nextExpectedReportDate,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Ensure Veridian / Stonegate exist and fill missing profile fields
 * without overwriting associate edits.
 */
export function applyDemoCompanyProfiles(
  companies: PortfolioCompany[]
): PortfolioCompany[] {
  const byId = new Map(companies.map((c) => [c.id, c]));

  for (const [id, demo] of Object.entries(DEMO_COMPANY_PROFILES)) {
    if (!byId.has(id)) {
      byId.set(id, stubCompany(id, demo));
    }
  }

  return Array.from(byId.values()).map((company) => {
    const demo = DEMO_COMPANY_PROFILES[company.id];
    if (!demo) return company;
    return {
      ...company,
      investmentDate: company.investmentDate ?? demo.investmentDate,
      reportingFrequency: company.reportingFrequency ?? demo.reportingFrequency,
      assignedAssociateId: company.assignedAssociateId ?? demo.assignedAssociateId,
      assignedAssociateName:
        company.assignedAssociateName ?? demo.assignedAssociateName,
      nextExpectedReportDate:
        company.nextExpectedReportDate ?? demo.nextExpectedReportDate,
    };
  });
}
