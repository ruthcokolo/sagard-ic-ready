import { categories } from "@/lib/categories";
import { ASSIGNED_STEP_COUNTS } from "@/lib/assigned-queue";
import { countByStage, icQueueDeals } from "@/lib/deal-query";
import { pipelineDeals, pipelineStats } from "@/lib/deals-pipeline";
import type { DealStage, PipelineDeal, ReadinessStatus } from "@/lib/deal-types";

export const CURRENT_USER = "Alex Rivera";

export type WorkflowStep = "conflicts" | "draft" | "decision";
export { getWorkflowStep } from "@/lib/deal-query";

export function getStageCounts() {
  return countByStage(pipelineDeals);
}

export function getSectorMix(limit = 6) {
  return categories
    .filter((c) => c.id !== "all")
    .map((cat) => ({
      id: cat.id,
      label: cat.label,
      count: pipelineDeals.filter((d) => d.categoryId === cat.id).length,
    }))
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getIcQueueCounts() {
  return {
    total: DEMO_METRICS.reviewTasksTotal,
    conflicts: ASSIGNED_STEP_COUNTS.conflicts,
    draft: ASSIGNED_STEP_COUNTS.draft,
    decision: ASSIGNED_STEP_COUNTS.decision,
    mine: DEMO_METRICS.assignedToUser,
  };
}

/**
 * Demo-friendly headline metrics — each number is a different unit or scope.
 * Portfolio-wide counts come from overnight batch #1842; "assigned to you" is Alex's queue.
 */
export const DEMO_METRICS = {
  totalDeals: 1000,
  /** Deals not committee-ready (portfolio). */
  blockedBeforeIc: 247,
  /** Individual cross-source conflicts across those deals — not a deal count. */
  crossSourceConflicts: 473,
  /** Deals awaiting human sign-off (portfolio). */
  awaitingSignOff: 118,
  /** Review tasks assigned to the signed-in associate. */
  assignedToUser: 73,
  /** All deals in the review queue (portfolio). */
  reviewTasksTotal: 370,
  batchId: 1842,
  dataRefreshTime: "6:12 AM",
  /** Demo stage counts for dashboard pipeline flow (sum = 1000). */
  stageCounts: {
    screening: 357,
    diligence: 260,
    ic_prep: 240,
    passed: 143,
  } as const,
  queueBreakdown: {
    /** Portfolio-wide tasks still in blocker resolution. */
    conflicts: 252,
    /** Portfolio-wide tasks awaiting analysis verification. */
    draft: 0,
    /** Portfolio-wide tasks awaiting human decision. */
    decision: 118,
  } as const,
  /** Alex's assigned queue — mutually exclusive next actions (sum = assignedToUser). */
  assignedBreakdown: {
    conflicts: 42,
    draft: 19,
    decision: 12,
  } as const,
} as const;

export const TOP_ALERT_ISSUES = [
  { label: "Mismatched financials", count: 252 },
  { label: "Missing or inconsistent metrics", count: 98 },
  { label: "Customer concentration conflicts", count: 61 },
  { label: "Owner / structure discrepancies", count: 27 },
] as const;

export const RECENT_DECISION = {
  company: "Meridian Analytics",
  decision: "Proceed" as const,
  exportedAt: "May 12, 9:17 AM",
};

export function getDashboardMetrics() {
  return {
    total: DEMO_METRICS.totalDeals,
    blocked: DEMO_METRICS.blockedBeforeIc,
    ready: DEMO_METRICS.awaitingSignOff,
    stages: DEMO_METRICS.stageCounts,
    dataRefreshTime: DEMO_METRICS.dataRefreshTime,
    queueBreakdown: DEMO_METRICS.queueBreakdown,
    ic: {
      total: DEMO_METRICS.reviewTasksTotal,
      mine: DEMO_METRICS.assignedToUser,
      conflicts: DEMO_METRICS.assignedBreakdown.conflicts,
      draft: DEMO_METRICS.assignedBreakdown.draft,
      decision: DEMO_METRICS.assignedBreakdown.decision,
    },
  };
}

/** Aggregated overnight AI batch stats for dashboard / IC queue banners. */
export function getAiFindings() {
  return {
    blockedByGaps: DEMO_METRICS.blockedBeforeIc,
    financialContradictions: 236,
    arrContradictions: DEMO_METRICS.crossSourceConflicts,
    portfolioDecisionsPending: DEMO_METRICS.awaitingSignOff,
    assignedToUser: DEMO_METRICS.assignedToUser,
    conflictsStep: DEMO_METRICS.blockedBeforeIc,
    reviewTasksTotal: DEMO_METRICS.reviewTasksTotal,
    queueTotal: icQueueDeals(pipelineDeals).length,
    batchId: DEMO_METRICS.batchId,
    topBlocker: "Financial numbers don't match",
    nextAction: "Fix mismatched numbers",
  };
}

export const DEMO_DEAL_ID = "northwind-logistics";

export type ActivityItem = {
  id: string;
  time: string;
  text: string;
  tone: "sync" | "alert" | "info";
};

export type SystemActivityEntry = {
  id: string;
  type: "sync" | "login" | "workflow" | "analysis";
  title: string;
  detail: string;
  timestamp: string;
};

/** Settings activity log — sheet syncs, sign-ins, overnight jobs. */
export const systemActivityLog: SystemActivityEntry[] = [
  {
    id: "log-1",
    type: "sync",
    title: "Google Sheets sync completed",
    detail: `${pipelineStats.total.toLocaleString()} companies imported · Deal Pipeline tab`,
    timestamp: `Today, ${DEMO_METRICS.dataRefreshTime}`,
  },
  {
    id: "log-2",
    type: "login",
    title: "Signed in",
    detail: `${CURRENT_USER} · Chrome on macOS`,
    timestamp: "Today, 7:28 AM",
  },
  {
    id: "log-3",
    type: "workflow",
    title: "n8n normalization finished",
    detail: "12 new rows processed · overnight job #1842",
    timestamp: "Today, 2:14 AM",
  },
  {
    id: "log-4",
    type: "analysis",
    title: "Overnight AI review completed",
    detail: `${DEMO_METRICS.blockedBeforeIc} deals flagged · batch #${DEMO_METRICS.batchId}`,
    timestamp: "Today, 2:00 AM",
  },
  {
    id: "log-5",
    type: "sync",
    title: "Google Sheets sync completed",
    detail: `${pipelineStats.total.toLocaleString()} companies imported · no new rows`,
    timestamp: "Yesterday, 6:12 AM",
  },
  {
    id: "log-6",
    type: "login",
    title: "Signed in",
    detail: `${CURRENT_USER} · Chrome on macOS`,
    timestamp: "Yesterday, 8:41 AM",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    time: "2 min ago",
    text: "Northwind Logistics: annual revenue numbers don't match (overnight review #1842)",
    tone: "alert",
  },
  {
    id: "a2",
    time: "14 min ago",
    text: `Google Sheets sync: ${pipelineStats.total} companies updated`,
    tone: "sync",
  },
  {
    id: "a3",
    time: "1 hr ago",
    text: "12 deals added to your review queue overnight",
    tone: "info",
  },
  {
    id: "a4",
    time: "3 hr ago",
    text: "Meridian Analytics ready for committee review (8/10)",
    tone: "info",
  },
];

export function getPipelineSummary() {
  return {
    total: DEMO_METRICS.totalDeals,
    needsReview: DEMO_METRICS.blockedBeforeIc,
    committeePrep: DEMO_METRICS.stageCounts.ic_prep,
    assignedToAlex: DEMO_METRICS.assignedToUser,
  };
}

export function stageLabel(stage: DealStage): string {
  const map: Record<DealStage, string> = {
    screening: "Early review",
    diligence: "Research",
    ic_prep: "Committee prep",
    passed: "Declined",
  };
  return map[stage];
}

export function statusLabel(status: ReadinessStatus): string {
  return status.replace("_", " ");
}

export { pipelineStats };
