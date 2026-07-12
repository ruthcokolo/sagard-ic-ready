/**
 * Fills in missing analysis details — plain-English conflict explanations,
 * unsupported claims, package section status, and audit trail events.
 */

import type { PipelineDeal } from "@/lib/deal-types";
import type {
  AnalysisResult,
  AuditEvent,
  ChecklistItem,
  Contradiction,
  ICPackageSection,
  KeyFact,
  UnsupportedClaim,
} from "@/lib/types";
import {
  auditLabels,
  tightenSuggestedAction,
  verdictBlockerFinancial,
  verdictBlockerHighSeverity,
  verdictBlockerOpenItems,
  verdictBlockerUnsupported,
  WHY_BLOCKS_REVIEW,
  WHY_IT_MATTERS,
} from "@/lib/plain-copy";

/** Adds plain-English "why it matters" text and tightens the suggested fix for a conflict. */
export function enrichContradiction(
  c: Omit<Contradiction, "whyItMatters" | "whyItBlocksIC" | "status"> &
    Partial<Pick<Contradiction, "whyItMatters" | "whyItBlocksIC" | "status">>,
): Contradiction {
  return {
    ...c,
    whyItMatters: c.whyItMatters ?? WHY_IT_MATTERS[c.field] ?? "The documents disagree on an important number.",
    whyItBlocksIC:
      c.whyItBlocksIC ?? WHY_BLOCKS_REVIEW[c.field] ?? "The committee needs one confirmed number before review.",
    suggestedAction: tightenSuggestedAction(c.suggestedAction),
    status: c.status ?? "unresolved",
  };
}

/** Builds the list of claims that still need supporting evidence for a deal. */
function buildUnsupportedClaims(deal: PipelineDeal, contradictions: Contradiction[]): UnsupportedClaim[] {
  const claims: UnsupportedClaim[] = [
    {
      id: `${deal.id}-uc1`,
      claim: "Strong retention in core enterprise segment",
      source: "AI draft / memo",
      evidenceStatus: contradictions.some((c) => c.field.includes("retention")) ? "partially_supported" : "not_supported",
      requiredProof: "NDR cohort table or audited retention export",
    },
    {
      id: `${deal.id}-uc2`,
      claim: "Expanding go-to-market motion with improving unit economics",
      source: "Founder notes",
      evidenceStatus: "partially_supported",
      requiredProof: "Sales pipeline report or CAC trend by quarter",
    },
    {
      id: `${deal.id}-uc3`,
      claim: `${deal.sector} spend is shifting toward automation at scale`,
      source: "AI draft",
      evidenceStatus: "needs_source",
      requiredProof: "Third-party market report or customer budget evidence",
    },
  ];

  if (deal.conflictCount === 0) {
    return claims.slice(0, 1).map((c) => ({ ...c, evidenceStatus: "partially_supported" as const }));
  }
  return claims.slice(0, Math.min(3, 1 + deal.conflictCount));
}

/** Builds the key facts row (ARR, growth, headcount) with confidence levels. */
function buildKeyFacts(deal: PipelineDeal, contradictions: Contradiction[]): KeyFact[] {
  const arrConflict = contradictions.some((c) => c.field.includes("ARR"));
  const growthConflict = contradictions.some((c) => c.field.includes("growth") || c.field.includes("ARR"));

  return [
    {
      label: "Annual revenue",
      value: `${deal.arr} (claimed)`,
      confidence: arrConflict ? "low" : "medium",
      sources: arrConflict ? "Spreadsheet only — numbers conflict" : "Spreadsheet",
    },
    {
      label: "Growth",
      value: `${deal.growth} (claimed)`,
      confidence: growthConflict ? "low" : "medium",
      sources: growthConflict ? "Files disagree" : "Spreadsheet + memo",
    },
    {
      label: "Employees",
      value: deal.employees,
      confidence: contradictions.some((c) => c.field === "Headcount") ? "medium" : "high",
      sources: "Memo + company info",
    },
  ];
}

/** Decides whether each IC package section is ready, blocked, or needs more proof. */
function buildPackageSections(
  deal: PipelineDeal,
  contradictions: Contradiction[],
  unsupported: UnsupportedClaim[],
): ICPackageSection[] {
  const financialBlocked = contradictions.some(
    (c) => c.severity === "high" && /ARR|margin|revenue|burn/i.test(c.field),
  );
  const customerBlocked = contradictions.some((c) => /customer|concentration/i.test(c.field));
  const marketNeedsSupport = unsupported.some((u) => u.evidenceStatus === "needs_source");

  return [
    { id: "overview", section: "Company overview", status: "ready" },
    {
      id: "market",
      section: "Market thesis",
      status: marketNeedsSupport ? "needs_support" : "draft_ready",
      blocker: marketNeedsSupport ? "Missing market research" : undefined,
    },
    {
      id: "financial",
      section: "Financial summary",
      status: financialBlocked ? "blocked" : "draft_ready",
      blocker: financialBlocked ? "Financial numbers don't match" : undefined,
    },
    {
      id: "customer",
      section: "Customer research",
      status: customerBlocked ? "blocked" : deal.openItems > 3 ? "needs_support" : "draft_ready",
      blocker: customerBlocked ? "Customer numbers don't match" : deal.openItems > 3 ? "Customer calls not done" : undefined,
    },
    { id: "risks", section: "Risks & responses", status: "draft_ready", blocker: "Check sources" },
    { id: "recommendation", section: "Your recommendation", status: "not_started", blocker: "Decision needed" },
  ];
}

/** Lists plain-English reasons the deal is not committee-ready yet. */
function buildVerdictBlockers(
  contradictions: Contradiction[],
  checklist: ChecklistItem[],
  unsupported: UnsupportedClaim[],
): string[] {
  const blockers: string[] = [];
  const unresolvedFinancial = contradictions.filter(
    (c) => c.status === "unresolved" && /ARR|margin|revenue|financial/i.test(c.field),
  ).length;
  const openItems = checklist.filter((i) => !i.done).length;
  const unsupportedCount = unsupported.filter(
    (u) => u.evidenceStatus === "not_supported" || u.evidenceStatus === "needs_source",
  ).length;

  if (unresolvedFinancial > 0) {
    blockers.push(verdictBlockerFinancial(unresolvedFinancial));
  } else if (contradictions.filter((c) => c.status === "unresolved" && c.severity === "high").length > 0) {
    blockers.push(
      verdictBlockerHighSeverity(
        contradictions.filter((c) => c.status === "unresolved" && c.severity === "high").length,
      ),
    );
  }
  if (openItems > 0) blockers.push(verdictBlockerOpenItems(openItems));
  if (unsupportedCount > 0) blockers.push(verdictBlockerUnsupported(unsupportedCount));

  return blockers;
}

/** Creates the timeline of AI and human events shown in the audit trail. */
function buildAuditTrail(deal: PipelineDeal, contradictions: Contradiction[], analyzedAt: string): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: "a1",
      timestamp: analyzedAt,
      label: auditLabels.analysisDone,
      type: "ai",
    },
  ];

  contradictions.slice(0, 2).forEach((c, i) => {
    events.push({
      id: `a${i + 2}`,
      timestamp: analyzedAt,
      label: auditLabels.conflictDetected(c.field),
      type: "warning",
    });
  });

  events.push(
    {
      id: "a-draft",
      timestamp: analyzedAt,
      label: auditLabels.draftGenerated,
      type: "ai",
    },
    {
      id: "a-wait",
      timestamp: analyzedAt,
      label: auditLabels.awaitingDecision,
      type: "human",
    },
  );

  return events;
}

/** Fills in default owners and linked issues on checklist items. */
function enrichChecklist(items: ChecklistItem[], deal: PipelineDeal): ChecklistItem[] {
  return items.map((item) => ({
    ...item,
    owner: item.owner ?? (item.priority === "low" ? "Legal" : deal.owner),
    linkedIssue: item.linkedIssue ?? item.linkedRisk,
  }));
}

/** Fills in any missing pieces of an analysis result so the UI always has complete data. */
export function enrichAnalysis(deal: PipelineDeal, base: AnalysisResult): AnalysisResult {
  const contradictions = base.contradictions.map((c) => enrichContradiction(c));
  const unsupportedClaims = base.unsupportedClaims?.length
    ? base.unsupportedClaims
    : buildUnsupportedClaims(deal, contradictions);
  const checklist = enrichChecklist(base.checklist, deal);
  const keyFacts = base.keyFacts?.length ? base.keyFacts : buildKeyFacts(deal, contradictions);
  const packageSections = base.packageSections?.length
    ? base.packageSections
    : buildPackageSections(deal, contradictions, unsupportedClaims);
  const verdictBlockers = base.verdictBlockers?.length
    ? base.verdictBlockers
    : buildVerdictBlockers(contradictions, checklist, unsupportedClaims);
  const auditTrail = base.auditTrail?.length
    ? base.auditTrail
    : buildAuditTrail(deal, contradictions, base.analyzedAt);
  const sourcesReviewed = base.sourcesReviewed?.length
    ? base.sourcesReviewed
    : ["Google Sheet", "Investor memo", "Founder notes", "Uploaded PDF"];

  return {
    ...base,
    contradictions,
    checklist,
    unsupportedClaims,
    keyFacts,
    packageSections,
    verdictBlockers,
    auditTrail,
    sourcesReviewed,
    sourceCount: base.sourceCount || sourcesReviewed.length,
  };
}

/** Turns a deal's stage into a short label like "Series B" or "Committee prep". */
export function formatStageLabel(deal: PipelineDeal): string {
  const match = deal.askAmount.match(/Series [A-D]|Seed|Growth/i);
  if (match) return match[0];
  const labels: Record<string, string> = {
    screening: "Screening",
    diligence: "Diligence",
    ic_prep: "IC prep",
    passed: "Passed on",
  };
  return labels[deal.stage] ?? deal.stage;
}

/** Converts an ISO timestamp into a friendly "2 min ago" style string. */
export function formatAnalyzedAgo(iso: string, fallback = "2 min ago"): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return fallback;
  } catch {
    return fallback;
  }
}
