/** Shared types for company-formatted PDF report generation. */

/** One block of text or table content inside a generated report section. */
export type TextBlock =
  | { type: "paragraph"; text: string }
  | { type: "line"; text: string; muted?: boolean }
  | { type: "table-header"; cols: string[] }
  | { type: "table-row"; cols: string[]; muted?: boolean }
  | { type: "bullets"; items: string[] };

/** A titled section (e.g. Executive Summary) inside a demo company report. */
export type ReportSection = {
  heading: string;
  blocks: TextBlock[];
  pageBreakBefore?: boolean;
};

/** Full spec for one company-formatted PDF: cover page info plus sections. */
export type CompanyFormattedReportSpec = {
  fileName: string;
  cover: {
    companyName: string;
    reportTitle: string;
    period: string;
    reportType: string;
    submittedDate: string;
    confidentiality: string;
  };
  sections: ReportSection[];
};
