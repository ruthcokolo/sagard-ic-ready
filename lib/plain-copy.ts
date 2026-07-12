/** Plain-language strings for non-technical users. */

export const conflictLabels = {
  whyItMatters: "Why this matters",
  whyBlocksReview: "Why it's not committee-ready yet",
  suggestedAction: "What to do next",
  sectionTitle: "Numbers that don't match",
  viewSource: "See original document →",
} as const;

export const WHY_IT_MATTERS: Record<string, string> = {
  "ARR (2024)": "Annual revenue drives how we value the company and its growth story.",
  "Customer concentration": "Too much revenue from a few customers increases risk if one leaves.",
  "Gross margin": "Profit margin shows how efficiently the business makes money.",
  Headcount: "Team size affects how much the company spends and whether it can execute its plan.",
  "Burn rate / runway": "Cash runway affects how urgently the company needs funding and how big a round should be.",
  "Net revenue retention": "Retention shows whether existing customers stay and spend more over time.",
};

export const WHY_BLOCKS_REVIEW: Record<string, string> = {
  "ARR (2024)": "The committee needs one agreed annual revenue number before recommending the deal.",
  "Customer concentration": "The committee needs a clear picture of top customers before sizing the investment.",
  "Gross margin": "The committee needs one agreed profit margin before trusting the financial story.",
  Headcount: "The committee needs a confirmed team size before judging execution capacity.",
  "Burn rate / runway": "The committee needs one agreed cash runway before recommending the round size.",
  "Net revenue retention": "The committee needs one agreed retention number before trusting growth claims.",
};

export const SUGGESTED_ACTION_TIGHT: Record<string, string> = {
  "Reconcile cash balance and monthly burn with bank statements":
    "Compare cash and monthly spending against bank statements.",
  "Reconcile cash balance and monthly burn using bank statements":
    "Compare cash and monthly spending against bank statements.",
};

/** Rewrites stiff AI-suggested actions into shorter, plainer language. */
export function tightenSuggestedAction(action: string): string {
  if (SUGGESTED_ACTION_TIGHT[action]) return SUGGESTED_ACTION_TIGHT[action];
  return action
    .replace(/\bReconcile\b/g, "Compare and align")
    .replace(/\bwith bank statements\b/i, "using bank statements")
    .replace(/\bwith the CFO\b/i, "with the finance team")
    .replace(/\bvalidated\b/gi, "confirmed")
    .replace(/\breconciled\b/gi, "aligned");
}

/** Plain-English message when financial numbers still conflict across sources. */
export function verdictBlockerFinancial(count: number): string {
  return `${count} financial number${count > 1 ? "s" : ""} still don't match`;
}

/** Plain-English message when important mismatches are still open. */
export function verdictBlockerHighSeverity(count: number): string {
  return `${count} important mismatch${count > 1 ? "es" : ""} still open`;
}

/** Plain-English message when diligence checklist items are still undone. */
export function verdictBlockerOpenItems(count: number): string {
  return `${count} research task${count > 1 ? "s" : ""} still open`;
}

/** Plain-English message when claims in the analysis still lack proof. */
export function verdictBlockerUnsupported(count: number): string {
  return `${count} claim${count > 1 ? "s" : ""} still lack proof`;
}

export const exportCopy = {
  decisionMissing: "You haven't chosen a decision yet",
  rationaleMissing: "Add a short explanation (at least 20 characters)",
  recommendationLocked:
    "Recommendation locked while material conflicts remain. You can still request more review or stop pursuing the deal.",
  readinessLow: "Ready score is low — check the box to recommend anyway",
  passedDeal: "This deal was declined — download is disabled",
  readyForDecision: (decision: string) => {
    if (decision === "proceed") {
      return "Submitting will record your decision and download the committee IC package.";
    }
    if (decision === "more_diligence") {
      return "Submitting will record your decision and return this deal to Resolve blockers.";
    }
    return "Submitting will record your decision and remove this deal from your active queue.";
  },
  lockedHeader: "Not ready until",
  exportButton: "Download IC package (PDF)",
  submitDecision: "Submit decision",
  returnToBlockers: "Return to resolve blockers",
  archiveDecision: "Record & archive decision",
  submitLocked: "Complete your decision first",
  exportHint: "Opens a print-ready document — save as PDF or send to Word.",
} as const;

export const decisionOptions = {
  proceed: { label: "Recommend to committee", sub: "Ready to move forward" },
  more_diligence: { label: "Need more research", sub: "More work before deciding" },
  pass: { label: "Don't invest", sub: "Stop pursuing this deal" },
} as const;

export const evidenceStatusLabels = {
  supported: "Has proof",
  partially_supported: "Some proof",
  not_supported: "No proof yet",
  needs_source: "Needs a source",
} as const;

export const packageStatusLabels = {
  ready: "Ready",
  needs_support: "Needs proof",
  blocked: "Blocked",
  draft_ready: "Draft ready",
  not_started: "Not started",
} as const;

export const auditLabels = {
  analysisDone: "AI finished reviewing the documents",
  conflictDetected: (field: string) => `Mismatch found: ${field}`,
  draftGenerated: "Draft summary created",
  awaitingDecision: "Waiting for your decision",
} as const;
