import type { PipelineDeal } from "@/lib/deal-types";
import { NORTHWIND_SOURCE_DOCUMENTS, type SourceDocument } from "@/lib/northwind-sources";

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function parseArrM(arr: string): number {
  return parseFloat(arr.replace(/[^0-9.]/g, "")) || 0;
}

function rand(seed: number, n: number): number {
  const x = Math.sin(seed * 9999 + n * 7919) * 10000;
  return x - Math.floor(x);
}

/** Source evidence cards for any deal — Northwind uses curated docs. */
export function getCompanySourceDocuments(deal: PipelineDeal): SourceDocument[] {
  if (deal.id === "northwind-logistics") {
    return NORTHWIND_SOURCE_DOCUMENTS;
  }

  const seed = seedFromId(deal.id);
  const arr = deal.arr;
  const memoArr = `$${(parseArrM(arr) * (0.72 + rand(seed, 1) * 0.2)).toFixed(1)}M`;
  const growthAlt = deal.growth.includes("-") ? "Flat" : `+${Math.max(5, parseInt(deal.growth.replace(/\D/g, ""), 10) - 12)}%`;
  const top3Sheet = `${28 + Math.floor(rand(seed, 2) * 20)}%`;
  const top3Cim = `${parseInt(top3Sheet, 10) + 18 + Math.floor(rand(seed, 3) * 15)}%`;
  const gmMemo = `${62 + Math.floor(rand(seed, 4) * 12)}%`;
  const gmModel = `${parseInt(gmMemo, 10) - 4 - Math.floor(rand(seed, 5) * 5)}%`;

  return [
    {
      id: "sheet",
      name: "Google Sheet",
      subtitle: "Deal Pipeline · synced row",
      syncedAt: `${deal.lastUpdated} via n8n`,
      fields: [
        { label: "ARR (2024)", value: arr, highlight: deal.conflictCount > 0 },
        { label: "Growth YoY", value: deal.growth, highlight: deal.conflictCount > 0 },
        { label: "Top 3 concentration", value: top3Sheet },
      ],
      excerpt: `Pipeline row: ARR (2024) = ${arr}, growth ${deal.growth}`,
    },
    {
      id: "memo",
      name: "Investor memo",
      subtitle: "Section 2 · Financial overview",
      syncedAt: "Uploaded to data room",
      fields: [
        { label: "ARR (2024)", value: memoArr, highlight: true },
        { label: "Growth YoY", value: growthAlt, highlight: true },
        { label: "Gross margin", value: gmMemo },
      ],
      excerpt: `Section 2: FY24 ARR approximately ${memoArr}, ${growthAlt} YoY`,
    },
    {
      id: "cim",
      name: "CIM extract",
      subtitle: "Appendix B · Customer concentration",
      syncedAt: "Data room",
      fields: [{ label: "Top 3 concentration", value: top3Cim, highlight: true }],
      excerpt: `Appendix B: largest three customers represent ${top3Cim} of FY24 revenue`,
    },
    {
      id: "model",
      name: "Financial model",
      subtitle: "P&L tab · Base case",
      syncedAt: "Model v3.2",
      fields: [{ label: "Gross margin", value: gmModel, highlight: true }],
      excerpt: `Model tab P&L: GM ${gmModel} in base case`,
    },
  ];
}

export type SnapshotMetric = {
  label: string;
  value: string;
  sublabel: string;
  confidence: "verified" | "needs_verification" | "solid";
};

export function getDealSnapshotMetrics(
  deal: PipelineDeal,
  analysisPending: boolean,
): SnapshotMetric[] {
  const needsCheck = analysisPending || deal.conflictCount > 0;

  return [
    {
      label: "Annual revenue (ARR)",
      value: `${deal.arr} claimed`,
      sublabel: "See evidence →",
      confidence: needsCheck ? "needs_verification" : "verified",
    },
    {
      label: "Growth (YoY)",
      value: `${deal.growth} claimed`,
      sublabel: "See evidence →",
      confidence: needsCheck ? "needs_verification" : "verified",
    },
    {
      label: "Employees",
      value: deal.employees,
      sublabel: "See evidence →",
      confidence:
        deal.id === "northwind-logistics"
          ? "solid"
          : deal.conflictCount > 0
            ? "needs_verification"
            : "solid",
    },
  ];
}

export function formatAskStage(deal: PipelineDeal): string {
  if (deal.askAmount.toLowerCase().includes("series b")) return "Series B";
  if (deal.askAmount.toLowerCase().includes("series a")) return "Series A";
  if (deal.askAmount.toLowerCase().includes("series c")) return "Series C";
  return deal.stage === "ic_prep" ? "IC prep" : "Growth";
}
