import type { WorkflowStep } from "@/lib/deal-query";
import type { ExportDecision, ExportHistoryItem } from "@/lib/exports-mock";
import type { AnalysisResult, Decision } from "@/lib/types";

export type RecordedDecision = {
  id: string;
  dealId: string;
  dealName: string;
  categoryId: string;
  decision: Exclude<Decision, null>;
  rationale: string;
  submittedAt: string;
  owner: string;
  readinessScore: number;
  blockersAtExport: string;
};

export type StepOverride = WorkflowStep | "archived";

export function decisionToExportDecision(decision: Exclude<Decision, null>): ExportDecision {
  if (decision === "proceed") return "Proceed";
  if (decision === "more_diligence") return "Need more research";
  return "Don't invest";
}

export function formatBlockersAtExport(analysis: AnalysisResult): string {
  const unresolved = analysis.contradictions.filter((c) => c.status === "unresolved");
  if (unresolved.length === 0) return "None";
  const high = unresolved.filter((c) => c.severity === "high").length;
  if (high > 0) return `${high} material`;
  return `${unresolved.length} open`;
}

export function formatExportTimestamp(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${month} ${day}, ${h12}:${mins} ${ampm}`;
}

export function toExportHistoryItem(record: RecordedDecision): ExportHistoryItem {
  const preview =
    record.rationale.length > 96 ? `${record.rationale.slice(0, 96).trim()}…` : record.rationale;

  return {
    id: record.id,
    companyId: record.dealId,
    company: record.dealName,
    categoryId: record.categoryId,
    decision: decisionToExportDecision(record.decision),
    exportedAt: formatExportTimestamp(record.submittedAt),
    owner: record.owner,
    readiness: `${record.readinessScore}/10`,
    rationalePreview: preview,
    blockersAtExport: record.blockersAtExport,
  };
}

export function stepAfterDecision(decision: Exclude<Decision, null>): StepOverride {
  if (decision === "more_diligence") return "conflicts";
  return "archived";
}

export function createRecordedDecision(input: {
  dealId: string;
  dealName: string;
  categoryId: string;
  decision: Exclude<Decision, null>;
  rationale: string;
  owner: string;
  analysis: AnalysisResult;
}): RecordedDecision {
  return {
    id: `exp-user-${input.dealId}-${Date.now()}`,
    dealId: input.dealId,
    dealName: input.dealName,
    categoryId: input.categoryId,
    decision: input.decision,
    rationale: input.rationale.trim(),
    submittedAt: new Date().toISOString(),
    owner: input.owner,
    readinessScore: input.analysis.readinessScore,
    blockersAtExport: formatBlockersAtExport(input.analysis),
  };
}

/** Keep only the latest submission per deal (newest first). */
export function dedupeSubmissions(submissions: RecordedDecision[]): RecordedDecision[] {
  const byDeal = new Map<string, RecordedDecision>();
  for (const submission of submissions) {
    const existing = byDeal.get(submission.dealId);
    if (
      !existing ||
      new Date(submission.submittedAt).getTime() >= new Date(existing.submittedAt).getTime()
    ) {
      byDeal.set(submission.dealId, submission);
    }
  }
  return Array.from(byDeal.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}
