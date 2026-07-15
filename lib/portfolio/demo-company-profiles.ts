/**
 * Default investment-profile fields for key demo companies.
 * Only fills empty fields on companies that already exist — never creates stub companies.
 */

import type { PortfolioCompany } from "./types";

type DemoProfile = Pick<
  PortfolioCompany,
  | "investmentDate"
  | "reportingFrequency"
  | "assignedAssociateId"
  | "assignedAssociateName"
  | "nextExpectedReportDate"
>;

const DEMO_COMPANY_PROFILES: Record<string, DemoProfile> = {
  "veridian-cloud-systems": {
    investmentDate: "2023-03-15",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-alex",
    assignedAssociateName: "Alex Rivera",
    nextExpectedReportDate: "2026-10-15",
  },
  "stonegate-properties": {
    investmentDate: "2022-09-01",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-jordan",
    assignedAssociateName: "Jordan Lee",
    nextExpectedReportDate: "2026-10-31",
  },
  "sagard-auto": {
    investmentDate: "2021-06-01",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-alex",
    assignedAssociateName: "Alex Rivera",
    nextExpectedReportDate: "2026-10-15",
  },
  "horizon-care-network": {
    investmentDate: "2022-01-20",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-sam",
    assignedAssociateName: "Sam Chen",
    nextExpectedReportDate: "2026-10-20",
  },
  "summit-industrial-solutions": {
    investmentDate: "2020-11-12",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-jordan",
    assignedAssociateName: "Jordan Lee",
    nextExpectedReportDate: "2026-10-25",
  },
  "northwind-consumer-group": {
    investmentDate: "2023-08-01",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-alex",
    assignedAssociateName: "Alex Rivera",
    nextExpectedReportDate: "2026-10-18",
  },
};

/**
 * Fill missing profile fields for known demo companies without overwriting
 * associate edits and without injecting empty placeholder companies.
 */
export function applyDemoCompanyProfiles(
  companies: PortfolioCompany[]
): PortfolioCompany[] {
  return companies.map((company) => {
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
