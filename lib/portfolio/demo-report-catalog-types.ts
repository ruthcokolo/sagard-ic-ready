/**
 * Type definitions for the demo report catalog and expected metric fixtures.
 */

export type DemoReportExpectedMetric = {
  name: string;
  expectedValue?: string | number;
  unit?: string;
  page?: number;
  valueType?: "actual" | "budget" | "forecast" | "prior_period";
  expectation: "required" | "optional" | "not_applicable" | "not_configured";
};

export type DemoReportCatalogItem = {
  id: string;
  companyName: string;
  companyId?: string;
  reportingPeriod: string;
  folderType: "company_formatted" | "icready_template";
  sourceFormat: "company_formatted_pdf" | "icready_template" | "scanned_pdf";
  fileName: string;
  filePath: string;
  /** Path under /public for browser fetch in demo mode */
  publicPath?: string;
  expectedMetrics: DemoReportExpectedMetric[];
  expectedWarnings?: string[];
  expectedDuplicateOf?: string;
  expectedVersionRelationship?: "duplicate" | "revision" | "supplement";
  /** Demo-only known prior upload timestamp for duplicate messaging */
  uploadedAtDemo?: string;
};
