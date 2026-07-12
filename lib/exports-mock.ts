import { getDealById } from "@/lib/deals-pipeline";

const companies: { name: string; id: string }[] = [
  { name: "Meridian Analytics", id: "meridian-analytics" },
  { name: "Helix Health Ops", id: "helix-health" },
  { name: "Stonegate Properties", id: "stonegate-properties" },
  { name: "Cascade Payments", id: "cascade-payments" },
  { name: "Lumen Home", id: "lumen-home" },
  { name: "Vault Realty Capital", id: "vault-realty-capital" },
  { name: "Clear Bank Systems", id: "clearbank-systems" },
  { name: "Bright Cart", id: "brightcart" },
  { name: "Atlas Logic", id: "atlas-logic" },
];

export type ExportDecision = "Proceed" | "Need more research" | "Don't invest";

export type ExportHistoryItem = {
  id: string;
  companyId: string;
  company: string;
  categoryId: string;
  decision: ExportDecision;
  exportedAt: string;
  owner: string;
  readiness: string;
  rationalePreview: string;
  blockersAtExport: string;
};

export const EXPORT_DECISION_LABELS: Record<ExportDecision, string> = {
  Proceed: "Recommend to committee",
  "Need more research": "Need more research",
  "Don't invest": "Don't invest",
};

export const exportHistory: ExportHistoryItem[] = Array.from({ length: 48 }, (_, i) => {
  const decisions: ExportDecision[] = ["Proceed", "Need more research", "Don't invest"];
  const decision = decisions[i % 3]!;
  const owners = ["Alex Rivera", "Jordan Lee", "Sam Chen"];
  const day = (i % 28) + 1;
  const blockers = i % 4 === 0 ? "2 acknowledged" : i % 3 === 0 ? "None" : "1 acknowledged";
  const company = companies[i % companies.length]!;

  return {
    id: `exp-${i + 1}`,
    companyId: company.id,
    company: company.name,
    categoryId: getDealById(company.id)?.categoryId ?? "enterprise-software",
    decision,
    exportedAt: `2026-05-${String(day).padStart(2, "0")} ${8 + (i % 10)}:${String((i * 7) % 60).padStart(2, "0")}`,
    owner: owners[i % owners.length]!,
    readiness: `${4 + (i % 6)}/10`,
    rationalePreview:
      decision === "Proceed"
        ? "Strong unit economics; numbers aligned."
        : decision === "Don't invest"
          ? "Thesis break on retention data."
          : "Revenue numbers still conflict; more customer calls needed.",
    blockersAtExport: blockers,
  };
});

/** Static archive entries — excludes demo deal until a decision is submitted. */
export function getBaseExportHistory(): ExportHistoryItem[] {
  return exportHistory.filter(
    (item) =>
      item.companyId !== "northwind-logistics" && item.company !== "Northwind Logistics",
  );
}

export function getExportSummary() {
  const history = getBaseExportHistory();
  return {
    total: history.length,
    proceed: history.filter((e) => e.decision === "Proceed").length,
    diligence: history.filter((e) => e.decision === "Need more research").length,
    pass: history.filter((e) => e.decision === "Don't invest").length,
  };
}
