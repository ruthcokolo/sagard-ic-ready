/** Shared types for company-formatted PDF report generation. */

export type TextBlock =
  | { type: "paragraph"; text: string }
  | { type: "line"; text: string; muted?: boolean }
  | { type: "table-header"; cols: string[] }
  | { type: "table-row"; cols: string[]; muted?: boolean }
  | { type: "bullets"; items: string[] };

export type ReportSection = {
  heading: string;
  blocks: TextBlock[];
  pageBreakBefore?: boolean;
};

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
