/**
 * Catalog of sample PDFs bundled with the demo: company-formatted reports
 * and ICReady template files, with paths and metadata for each entry.
 */

import { TEMPLATE_COMPANY_SPECS, toQ1TemplateSpec } from "./template-companies";

export type SamplePdfSource = "company-formatted" | "template";

export const SAMPLE_PDF_SOURCE_COPY: Record<
  SamplePdfSource,
  { label: string; description: string }
> = {
  "company-formatted": {
    label: "Company-formatted PDFs",
    description:
      "Varied company reporting formats — realistic but less standardized for extraction.",
  },
  template: {
    label: "ICReady template PDFs",
    description:
      "Standardized reporting format — consistent labels for higher extraction confidence.",
  },
};

export type SamplePdfEntry = {
  companyId: string;
  companyName: string;
  reportPeriod: string;
  fileName: string;
  /** Path under /public */
  publicPath: string;
  reportType: string;
  sourceFormat: "Company-formatted PDF" | "ICReady template";
};

export const COMPANY_FORMATTED_PDF_CATALOG: SamplePdfEntry[] = [
  {
    companyId: "northwind-logistics",
    companyName: "Northwind Logistics",
    reportPeriod: "Q2 2026",
    fileName: "Northwind Logistics - Q2 2026 Board Pack.pdf",
    publicPath: "/sample-portfolio-pdfs/Northwind Logistics - Q2 2026 Board Pack.pdf",
    reportType: "Board Pack",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "cyberdyne-systems",
    companyName: "Cyberdyne Systems",
    reportPeriod: "Q2 2026",
    fileName: "Cyberdyne Systems - Q2 2026 Board Report.pdf",
    publicPath: "/sample-portfolio-pdfs/Cyberdyne Systems - Q2 2026 Board Report.pdf",
    reportType: "Board Report",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "helix-energy",
    companyName: "Helix Energy",
    reportPeriod: "Q1 2026",
    fileName: "Helix Energy - Q1 2026 Report.pdf",
    publicPath: "/sample-portfolio-pdfs/Helix Energy - Q1 2026 Report.pdf",
    reportType: "Quarterly Report",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "apex-manufacturing",
    companyName: "Apex Manufacturing",
    reportPeriod: "Q1 2026",
    fileName: "Apex Manufacturing - Q1 2026 Results.pdf",
    publicPath: "/sample-portfolio-pdfs/Apex Manufacturing - Q1 2026 Results.pdf",
    reportType: "Quarterly Results",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "lumos-health",
    companyName: "Lumos Health",
    reportPeriod: "Q2 2026",
    fileName: "Lumos Health - Q2 2026 Board Pack.pdf",
    publicPath: "/sample-portfolio-pdfs/Lumos Health - Q2 2026 Board Pack.pdf",
    reportType: "Board Pack",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "veridian-cloud-systems",
    companyName: "Veridian Cloud Systems",
    reportPeriod: "Q2 2026",
    fileName: "Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf",
    publicPath: "/sample-portfolio-pdfs/Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf",
    reportType: "Board Update",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "horizon-care-network",
    companyName: "Horizon Care Network",
    reportPeriod: "Q2 2026",
    fileName: "Horizon_Care_Network_Q2_2026_Operating_Review.pdf",
    publicPath: "/sample-portfolio-pdfs/Horizon_Care_Network_Q2_2026_Operating_Review.pdf",
    reportType: "Operating Review",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "stonegate-properties",
    companyName: "Stonegate Properties",
    reportPeriod: "Q2 2026",
    fileName: "Stonegate_Properties_Q2_2026_Portfolio_Report.pdf",
    publicPath: "/sample-portfolio-pdfs/Stonegate_Properties_Q2_2026_Portfolio_Report.pdf",
    reportType: "Portfolio Report",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "stonegate-properties",
    companyName: "Stonegate Properties",
    reportPeriod: "Q1 2026",
    fileName: "Stonegate_Properties_Q1_2026_Operating_Review.pdf",
    publicPath:
      "/demo-reports/company-formatted/Stonegate-Properties/Stonegate_Properties_Q1_2026_Operating_Review.pdf",
    reportType: "Operating Review",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "veridian-cloud-systems",
    companyName: "Veridian Cloud Systems",
    reportPeriod: "Q1 2026",
    fileName: "Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf",
    publicPath: "/sample-portfolio-pdfs/Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf",
    reportType: "Board Update",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "northwind-logistics",
    companyName: "Northwind Logistics",
    reportPeriod: "Q1 2026",
    fileName: "Northwind Logistics - Q1 2026 Operations Pack.pdf",
    publicPath: "/sample-portfolio-pdfs/Northwind Logistics - Q1 2026 Operations Pack.pdf",
    reportType: "Operations Pack",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "cyberdyne-systems",
    companyName: "Cyberdyne Systems",
    reportPeriod: "Q1 2026",
    fileName: "Cyberdyne Systems - Q1 2026 Investor Memo.pdf",
    publicPath: "/sample-portfolio-pdfs/Cyberdyne Systems - Q1 2026 Investor Memo.pdf",
    reportType: "Investor Memo",
    sourceFormat: "Company-formatted PDF",
  },
  {
    companyId: "lumos-health",
    companyName: "Lumos Health",
    reportPeriod: "Q1 2026",
    fileName: "Lumos Health - Q1 2026 Clinical & Finance Review.pdf",
    publicPath: "/sample-portfolio-pdfs/Lumos Health - Q1 2026 Clinical & Finance Review.pdf",
    reportType: "Clinical & Finance Review",
    sourceFormat: "Company-formatted PDF",
  },
];

export const TEMPLATE_PDF_CATALOG: SamplePdfEntry[] = [
  ...TEMPLATE_COMPANY_SPECS,
  ...TEMPLATE_COMPANY_SPECS.map(toQ1TemplateSpec),
].map((spec) => {
  const fileName = `ICReady_Template_${spec.slug}_${spec.reportPeriod.replace(/\s+/g, "_")}.pdf`;
  return {
    companyId: spec.id.replace(/-q1$/, ""),
    companyName: spec.name,
    reportPeriod: spec.reportPeriod,
    fileName,
    publicPath: `/sample-portfolio-pdfs/icready-template/${fileName}`,
    reportType: "ICReady Portfolio Report",
    sourceFormat: "ICReady template" as const,
  };
});

/** @deprecated Use COMPANY_FORMATTED_PDF_CATALOG */
export const MESSY_PDF_CATALOG = COMPANY_FORMATTED_PDF_CATALOG;

/** @deprecated Use COMPANY_FORMATTED_PDF_CATALOG */
export const SAMPLE_PDF_CATALOG = COMPANY_FORMATTED_PDF_CATALOG;

/** Find a sample PDF entry for a company, optionally for a specific period. */
export function getSamplePdfForCompany(
  companyId: string,
  source: SamplePdfSource = "company-formatted",
  reportPeriod?: string
): SamplePdfEntry | undefined {
  const catalog = source === "template" ? TEMPLATE_PDF_CATALOG : COMPANY_FORMATTED_PDF_CATALOG;
  if (reportPeriod) {
    const match = catalog.find(
      (e) => e.companyId === companyId && e.reportPeriod === reportPeriod
    );
    if (match) return match;
  }
  return catalog.find((e) => e.companyId === companyId);
}

/** Guess source format from filename patterns (ICReady template vs company PDF). */
export function inferSourceFormatFromFileName(fileName: string): SamplePdfEntry["sourceFormat"] {
  if (fileName.includes("ICReady_Template") || fileName.includes("ICReady Template")) {
    return "ICReady template";
  }
  return "Company-formatted PDF";
}
