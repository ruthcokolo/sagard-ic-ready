/**
 * Display helpers for the assigned review queue — curated headlines,
 * priority badges, and step labels for each deal row.
 */

import type { PipelineDeal } from "@/lib/deal-types";
import type { WorkflowStep } from "@/lib/deal-query";
import { ASSIGNED_STEP_COUNTS, getAssignedStep } from "@/lib/assigned-queue";
import { DEMO_METRICS } from "@/lib/insights";

export type QueuePriority = "critical" | "high" | "medium";

export const ASSIGNED_WORKLOAD = {
  total: ASSIGNED_STEP_COUNTS.total,
  conflicts: ASSIGNED_STEP_COUNTS.conflicts,
  draft: ASSIGNED_STEP_COUNTS.draft,
  decision: ASSIGNED_STEP_COUNTS.decision,
  portfolioFlagged: DEMO_METRICS.blockedBeforeIc,
} as const;

type CuratedDisplay = {
  headline: string;
  detail: string;
  priority: QueuePriority;
  readiness?: number;
};

const CURATED_DISPLAY: Record<string, CuratedDisplay> = {
  "northwind-logistics": {
    headline: "ARR differs by $3M",
    detail: "CRM vs. data room",
    priority: "critical",
    readiness: 4,
  },
  "helix-health": {
    headline: "NRR claim unverified",
    detail: "Needs customer cohort data",
    priority: "high",
  },
  "meridian-analytics": {
    headline: "Customer concentration mismatch",
    detail: "Top 3 customers: 41% vs 62%",
    priority: "critical",
    readiness: 5,
  },
  "cascade-payments": {
    headline: "Gross margin inconsistent across sources",
    detail: "Sheets vs. uploaded model",
    priority: "high",
  },
  "brightcart": {
    headline: "Ready for IC recommendation",
    detail: "All blockers resolved",
    priority: "medium",
    readiness: 9,
  },
  "lumen-home": {
    headline: "Awaiting your sign-off",
    detail: "Analysis complete",
    priority: "medium",
    readiness: 8,
  },
};

const ISSUE_TEMPLATES = {
  conflicts: [
    { headline: "ARR differs across sources", detail: "Sheet vs. investor memo" },
    { headline: "Customer concentration mismatch", detail: "CRM vs. data room" },
    { headline: "Burn rate not reconciled", detail: "Model vs. bank statements" },
    { headline: "Missing source evidence", detail: "Data room incomplete" },
  ],
  draft: [
    { headline: "NRR claim unverified", detail: "Needs customer cohort data" },
    { headline: "Thesis needs validation", detail: "AI summary awaiting review" },
    { headline: "Risk mitigants incomplete", detail: "Checklist items open" },
    { headline: "Citations need spot-check", detail: "IC package draft ready" },
  ],
  decision: [
    { headline: "Ready for IC recommendation", detail: "All blockers resolved" },
    { headline: "Awaiting your sign-off", detail: "Analysis complete" },
    { headline: "Choose an outcome", detail: "Proceed, research, or pass" },
  ],
} as const;

/** Turns a deal id into a stable index for picking issue headline templates. */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = h * 31 + id.charCodeAt(i);
  return Math.abs(h);
}

/** Mutually exclusive next action — assigned queue deals always resolve from the assignment map. */
export function getQueueStep(deal: PipelineDeal): WorkflowStep {
  return getAssignedStep(deal.id) ?? "draft";
}

/** Readiness score for queue display, preferring curated overrides when set. */
export function getQueueReadiness(deal: PipelineDeal): number {
  return CURATED_DISPLAY[deal.id]?.readiness ?? deal.readinessScore;
}

/** Headline and detail text for the key issue column in the review queue. */
export function getQueueKeyIssue(deal: PipelineDeal): { headline: string; detail: string } {
  const curated = CURATED_DISPLAY[deal.id];
  if (curated) return { headline: curated.headline, detail: curated.detail };

  const step = getQueueStep(deal);
  const templates = ISSUE_TEMPLATES[step];
  const pick = templates[seedFromId(deal.id) % templates.length];
  return pick;
}

/** Priority tier for queue row styling based on step and readiness. */
export function getQueuePriority(deal: PipelineDeal): QueuePriority {
  const curated = CURATED_DISPLAY[deal.id];
  if (curated) return curated.priority;

  const step = getQueueStep(deal);
  const score = getQueueReadiness(deal);
  if (step === "conflicts" && score <= 5) return "critical";
  if (step === "conflicts" || score <= 6) return "high";
  return "medium";
}

/** Short label for a workflow step badge. */
export function queueStepLabel(step: WorkflowStep): string {
  const map: Record<WorkflowStep, string> = {
    conflicts: "Resolve blockers",
    draft: "Verify analysis",
    decision: "Record decision",
  };
  return map[step];
}

/** Longer hint text explaining what the user should do at each step. */
export function queueStepHint(step: WorkflowStep): string {
  const map: Record<WorkflowStep, string> = {
    conflicts: "Fix conflicts and missing evidence",
    draft: "Review the AI's findings and IC package",
    decision: "Choose an outcome and explain why",
  };
  return map[step];
}

/** Verb for the primary action button on a queue row. */
export function queueActionLabel(step: WorkflowStep): string {
  const map: Record<WorkflowStep, string> = {
    conflicts: "Resolve",
    draft: "Verify",
    decision: "Decide",
  };
  return map[step];
}

/** Tailwind classes for priority badge styling. */
export function priorityClass(priority: QueuePriority): string {
  const map: Record<QueuePriority, string> = {
    critical: "bg-red-50 text-red-700 ring-red-100",
    high: "bg-amber-50 text-amber-800 ring-amber-100",
    medium: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
  return map[priority];
}

/** Display label for a priority tier. */
export function priorityLabel(priority: QueuePriority): string {
  const map: Record<QueuePriority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
  };
  return map[priority];
}

/** Tailwind classes for workflow step badge styling. */
export function stepBadgeClass(step: WorkflowStep): string {
  const map: Record<WorkflowStep, string> = {
    conflicts: "bg-red-50 text-red-700",
    draft: "bg-amber-50 text-amber-800",
    decision: "bg-emerald-50 text-emerald-700",
  };
  return map[step];
}
