/** Curated Northwind source documents with known cross-source mismatches. */

export type SourceDocumentField = {
  label: string;
  value: string;
  /** Visually emphasize fields that may conflict across sources */
  highlight?: boolean;
};

export type SourceDocument = {
  id: string;
  name: string;
  subtitle: string;
  syncedAt: string;
  fields: SourceDocumentField[];
  excerpt: string;
};

export const NORTHWIND_SOURCE_DOCUMENTS: SourceDocument[] = [
  {
    id: "sheet",
    name: "Google Sheet",
    subtitle: "Deal Pipeline · Row 14",
    syncedAt: "2 min ago via n8n",
    fields: [
      { label: "ARR (2024)", value: "$12.0M", highlight: true },
      { label: "Growth YoY", value: "+28%", highlight: true },
      { label: "Top 3 concentration", value: "42%" },
    ],
    excerpt: "Row 14: ARR (2024) = $12.0M, growth +28% YoY",
  },
  {
    id: "memo",
    name: "Investor memo",
    subtitle: "Section 2 · Financial overview",
    syncedAt: "Uploaded May 28",
    fields: [
      { label: "ARR (2024)", value: "$9.0M", highlight: true },
      { label: "Growth YoY", value: "Flat", highlight: true },
      { label: "Gross margin", value: "72%" },
    ],
    excerpt: "Section 2: FY24 ARR approximately $9M, flat YoY",
  },
  {
    id: "cim",
    name: "CIM extract",
    subtitle: "Appendix B · Customer concentration",
    syncedAt: "Data room",
    fields: [
      { label: "Top 3 concentration", value: "68%", highlight: true },
    ],
    excerpt: "Appendix B: largest three customers represent 68% of FY24 revenue",
  },
  {
    id: "model",
    name: "Financial model",
    subtitle: "P&L tab · Base case",
    syncedAt: "Model v3.2",
    fields: [
      { label: "Gross margin", value: "64%", highlight: true },
    ],
    excerpt: "Model tab P&L: GM 64% in base case",
  },
];
