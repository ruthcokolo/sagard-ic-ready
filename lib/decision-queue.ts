/**
 * Client-side decision state: merges assigned queue with user submissions,
 * step overrides, and export history for the review workflow.
 */

import {
  assignedQueueDeals,
  getAssignedStep,
  sortAssignedDeals,
} from "@/lib/assigned-queue";
import type { PipelineDeal } from "@/lib/deal-types";
import type { DealFilters, SortField, SortDir, WorkflowStep } from "@/lib/deal-query";
import { matchesQuery } from "@/lib/deal-query";
import { getDealById } from "@/lib/deals-pipeline";
import type { RecordedDecision, StepOverride } from "@/lib/decision-records";
import { dedupeSubmissions, toExportHistoryItem } from "@/lib/decision-records";
import { getBaseExportHistory } from "@/lib/exports-mock";
import type { ExportHistoryItem } from "@/lib/exports-mock";

export const DEMO_EXPORT_DEAL_ID = "northwind-logistics";

export type DecisionAppState = {
  submissions: RecordedDecision[];
  stepOverrides: Record<string, StepOverride>;
  queueAdditions: PipelineDeal[];
};

export const EMPTY_DECISION_STATE: DecisionAppState = {
  submissions: [],
  stepOverrides: {},
  queueAdditions: [],
};

/** Resolves the effective workflow step, accounting for overrides and archives. */
export function getEffectiveStep(
  dealId: string,
  state: DecisionAppState,
): WorkflowStep | "archived" | undefined {
  if (dealId in state.stepOverrides) {
    return state.stepOverrides[dealId];
  }
  const assigned = getAssignedStep(dealId);
  if (assigned) return assigned;
  const added = state.queueAdditions.find((d) => d.id === dealId);
  if (added) return "conflicts";
  return undefined;
}

/** Marks a deal as blocked and assigns it to Alex when added to the review queue. */
function applyConflictsReturn(deal: PipelineDeal): PipelineDeal {
  return {
    ...deal,
    owner: deal.owner || "Alex Rivera",
    readinessStatus: "blocked",
    conflictCount: Math.max(deal.conflictCount, 1),
    readinessScore: Math.min(deal.readinessScore, 5),
    lastUpdated: "Just now",
  };
}

/** Active queue deals after applying step overrides and filtering archived entries. */
export function getEffectiveQueueDeals(state: DecisionAppState): PipelineDeal[] {
  const byId = new Map<string, PipelineDeal>();

  for (const deal of assignedQueueDeals) {
    const step = getEffectiveStep(deal.id, state);
    if (!step || step === "archived") continue;
    const updated =
      step === "conflicts" && state.stepOverrides[deal.id] === "conflicts"
        ? applyConflictsReturn(deal)
        : deal;
    byId.set(deal.id, updated);
  }

  for (const deal of state.queueAdditions) {
    const step = getEffectiveStep(deal.id, state);
    if (!step || step === "archived") continue;
    if (!byId.has(deal.id)) {
      byId.set(deal.id, applyConflictsReturn(deal));
    }
  }

  const stepOrder: Record<WorkflowStep, number> = { conflicts: 0, draft: 1, decision: 2 };
  return Array.from(byId.values()).sort((a, b) => {
    if (a.id === "northwind-logistics") return -1;
    if (b.id === "northwind-logistics") return 1;
    const sa = stepOrder[getEffectiveStep(a.id, state) as WorkflowStep] ?? 9;
    const sb = stepOrder[getEffectiveStep(b.id, state) as WorkflowStep] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.readinessScore - b.readinessScore;
  });
}

/** Live workload counts by workflow step from the effective queue. */
export function countEffectiveWorkload(state: DecisionAppState) {
  const deals = getEffectiveQueueDeals(state);
  let conflicts = 0;
  let draft = 0;
  let decision = 0;

  for (const deal of deals) {
    const step = getEffectiveStep(deal.id, state);
    if (step === "conflicts") conflicts += 1;
    else if (step === "draft") draft += 1;
    else if (step === "decision") decision += 1;
  }

  return {
    total: deals.length,
    conflicts,
    draft,
    decision,
  };
}

/** Filters the effective queue with standard deal filter dimensions. */
export function filterEffectiveQueue(
  state: DecisionAppState,
  filters: DealFilters,
  currentUser?: string,
): PipelineDeal[] {
  const deals = getEffectiveQueueDeals(state);
  return deals.filter((d) => {
    if (!matchesQuery(d, filters.q)) return false;
    if (filters.stages.length > 0 && !filters.stages.includes(d.stage)) return false;
    if (filters.categoryId !== "all" && d.categoryId !== filters.categoryId) return false;
    if (filters.owner !== "all" && d.owner !== filters.owner) return false;
    if (d.readinessScore < filters.readinessMin || d.readinessScore > filters.readinessMax) {
      return false;
    }
    if (filters.status !== "all" && d.readinessStatus !== filters.status) return false;
    if (filters.mineOnly && currentUser && d.owner !== currentUser) return false;
    if (filters.workflowStep !== "all") {
      const step = getEffectiveStep(d.id, state);
      if (step !== filters.workflowStep) return false;
    }
    return true;
  });
}

/** Sorts the effective queue, preserving Northwind-first ordering. */
export function sortEffectiveQueue(
  state: DecisionAppState,
  deals: PipelineDeal[],
  field: SortField,
  dir: SortDir,
): PipelineDeal[] {
  return sortAssignedDeals(deals, field, dir);
}

/** Merges user-submitted exports with the static demo archive. */
export function getMergedExportHistory(state: DecisionAppState): ExportHistoryItem[] {
  const userExports = dedupeSubmissions(state.submissions).map(toExportHistoryItem);
  const base = getBaseExportHistory().filter(
    (item) => item.companyId !== DEMO_EXPORT_DEAL_ID && item.company !== "Northwind Logistics",
  );
  return [...userExports, ...base];
}

/** Decision breakdown counts from the merged export history. */
export function getExportSummaryFromState(state: DecisionAppState) {
  const history = getMergedExportHistory(state);
  return {
    total: history.length,
    proceed: history.filter((e) => e.decision === "Proceed").length,
    diligence: history.filter((e) => e.decision === "Need more research").length,
    pass: history.filter((e) => e.decision === "Don't invest").length,
  };
}

/** Latest recorded submission for a deal, if any. */
export function getSubmissionForDeal(
  state: DecisionAppState,
  dealId: string,
): RecordedDecision | undefined {
  return dedupeSubmissions(state.submissions).find((s) => s.dealId === dealId);
}

/** Whether a deal is still in the active (non-archived) review queue. */
export function isDealInActiveQueue(state: DecisionAppState, dealId: string): boolean {
  const step = getEffectiveStep(dealId, state);
  return !!step && step !== "archived";
}

/** Creates a blocked deal entry when a pipeline deal is added to the queue. */
export function buildQueueAddition(dealId: string): PipelineDeal | null {
  const deal = getDealById(dealId);
  if (!deal) return null;
  return applyConflictsReturn({ ...deal, owner: "Alex Rivera", hasFullWorkflow: true });
}

/** Id of the first deal in the effective queue, for "next up" navigation. */
export function getNextQueueDealId(state: DecisionAppState): string | null {
  const deals = getEffectiveQueueDeals(state);
  return deals[0]?.id ?? null;
}
