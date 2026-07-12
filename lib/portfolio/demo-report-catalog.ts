import type { DemoReportCatalogItem } from "./demo-report-catalog-types";

export type { DemoReportCatalogItem, DemoReportExpectedMetric } from "./demo-report-catalog-types";

/**
 * Catalog of synthetic demo reports for smoke tests and interview demos.
 * Extraction must still read the PDF — this is not a fallback extractor.
 */
export const DEMO_REPORT_CATALOG: DemoReportCatalogItem[] = [
  {
    id: "sagard-auto-q2-2026",
    companyName: "Sagard Auto",
    companyId: "sagard-auto",
    reportingPeriod: "Q2 2026",
    folderType: "company_formatted",
    sourceFormat: "company_formatted_pdf",
    fileName: "sagard auto report.pdf",
    filePath: "public/demo-reports/company-formatted/Sagard-Auto/sagard auto report.pdf",
    publicPath: "/demo-reports/company-formatted/Sagard-Auto/sagard auto report.pdf",
    expectedMetrics: [
      { name: "Revenue", expectedValue: "$42.1M", unit: "USD", page: 2, valueType: "actual", expectation: "required" },
      { name: "EBITDA", expectedValue: "$6.4M", unit: "USD", page: 2, valueType: "actual", expectation: "required" },
      { name: "Cash", expectedValue: "$11.2M", unit: "USD", page: 3, valueType: "actual", expectation: "required" },
      { name: "ARR", expectation: "not_applicable" },
    ],
    expectedWarnings: ["exact_duplicate_when_reuploaded"],
    uploadedAtDemo: "2026-07-09T15:00:00.000Z",
  },
  {
    id: "veridian-q2-2026",
    companyName: "Veridian Cloud Systems",
    companyId: "veridian-cloud-systems",
    reportingPeriod: "Q2 2026",
    folderType: "company_formatted",
    sourceFormat: "company_formatted_pdf",
    fileName: "Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf",
    filePath:
      "public/sample-portfolio-pdfs/Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf",
    publicPath: "/sample-portfolio-pdfs/Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf",
    expectedMetrics: [
      { name: "Revenue", expectedValue: "$18.6M", valueType: "actual", expectation: "required" },
      { name: "ARR", expectation: "required" },
      { name: "Cash", expectation: "required" },
    ],
  },
  {
    id: "stonegate-q1-2026",
    companyName: "Stonegate Properties",
    companyId: "stonegate-properties",
    reportingPeriod: "Q1 2026",
    folderType: "company_formatted",
    sourceFormat: "company_formatted_pdf",
    fileName: "Stonegate_Properties_Q1_2026_Operating_Review.pdf",
    filePath:
      "public/demo-reports/company-formatted/Stonegate-Properties/Stonegate_Properties_Q1_2026_Operating_Review.pdf",
    publicPath:
      "/demo-reports/company-formatted/Stonegate-Properties/Stonegate_Properties_Q1_2026_Operating_Review.pdf",
    expectedMetrics: [
      { name: "Revenue", expectedValue: "$28.4M", expectation: "required" },
      { name: "EBITDA", expectedValue: "$11.8M", expectation: "required" },
      { name: "Cash", expectedValue: "$9.2M", expectation: "required" },
      { name: "ARR", expectation: "not_applicable" },
      { name: "Churn", expectation: "not_applicable" },
    ],
    expectedWarnings: ["arr_not_applicable_suggestion"],
  },
  {
    id: "brightpeak-template-q2",
    companyName: "BrightPeak Energy",
    companyId: "brightpeak-energy",
    reportingPeriod: "Q2 2026",
    folderType: "icready_template",
    sourceFormat: "icready_template",
    fileName: "ICReady_Template_BrightPeak_Energy_Q2_2026.pdf",
    filePath:
      "public/demo-reports/icready-template/BrightPeak-Energy/ICReady_Template_BrightPeak_Energy_Q2_2026.pdf",
    publicPath:
      "/demo-reports/icready-template/BrightPeak-Energy/ICReady_Template_BrightPeak_Energy_Q2_2026.pdf",
    expectedMetrics: [
      { name: "Revenue", expectation: "required" },
      { name: "EBITDA", expectation: "required" },
      { name: "Cash", expectation: "required" },
      { name: "Headcount", expectation: "optional" },
    ],
  },
  {
    id: "horizon-q2-2026",
    companyName: "Horizon Care Network",
    companyId: "horizon-care-network",
    reportingPeriod: "Q2 2026",
    folderType: "company_formatted",
    sourceFormat: "company_formatted_pdf",
    fileName: "Horizon_Care_Network_Q2_2026_Operating_Review.pdf",
    filePath:
      "public/demo-reports/company-formatted/Horizon-Care-Network/Horizon_Care_Network_Q2_2026_Operating_Review.pdf",
    publicPath:
      "/demo-reports/company-formatted/Horizon-Care-Network/Horizon_Care_Network_Q2_2026_Operating_Review.pdf",
    expectedMetrics: [
      { name: "Revenue", expectation: "required" },
      { name: "EBITDA", expectation: "required" },
      { name: "Cash", expectation: "required" },
      { name: "ARR", expectation: "not_applicable" },
    ],
  },
  {
    id: "atlas-template-q2",
    companyName: "Atlas Logistics",
    companyId: "atlas-logistics",
    reportingPeriod: "Q2 2026",
    folderType: "icready_template",
    sourceFormat: "icready_template",
    fileName: "ICReady_Template_Atlas_Logistics_Q2_2026.pdf",
    filePath:
      "public/demo-reports/icready-template/Atlas-Logistics/ICReady_Template_Atlas_Logistics_Q2_2026.pdf",
    publicPath:
      "/demo-reports/icready-template/Atlas-Logistics/ICReady_Template_Atlas_Logistics_Q2_2026.pdf",
    expectedMetrics: [
      { name: "Revenue", expectation: "required" },
      { name: "EBITDA", expectation: "required" },
      { name: "Cash", expectation: "required" },
    ],
  },
];

/** Return the demo catalog entry for a PDF filename, if it is a known sample report. */
export function getDemoReportByFileName(fileName: string): DemoReportCatalogItem | undefined {
  const norm = fileName.toLowerCase().trim();
  return DEMO_REPORT_CATALOG.find((i) => i.fileName.toLowerCase() === norm);
}

/** Check whether demo sample reports are turned on for this environment. */
export function isDemoReportsEnabled(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_REPORTS === "true") return true;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_REPORTS === "false") return false;
  return process.env.NODE_ENV !== "production";
}
