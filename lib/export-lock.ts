import type { PipelineDeal } from "@/lib/deal-types";
import type { AnalysisResult, Decision } from "@/lib/types";
import { exportCopy } from "@/lib/plain-copy";

export type ExportLockState = {
  locks: string[];
  /** User can submit the selected decision (all three types when requirements met). */
  canSubmit: boolean;
  /** Committee-ready IC PDF — only for proceed with no material conflicts. */
  canExportCommitteePackage: boolean;
  proceedLocked: boolean;
  proceedLockReason: string | null;
  readyMessage: string | null;
  unresolvedBlockerCount: number;
  materialConflictCount: number;
  submitLabel: string;
};

export function hasMaterialConflicts(analysis: AnalysisResult): boolean {
  return analysis.contradictions.some(
    (c) => c.status === "unresolved" && c.severity === "high",
  );
}

export function canRecommendToCommittee(analysis: AnalysisResult): boolean {
  return !hasMaterialConflicts(analysis);
}

export function getMaterialConflictCount(analysis: AnalysisResult): number {
  return analysis.contradictions.filter(
    (c) => c.status === "unresolved" && c.severity === "high",
  ).length;
}

export function getExportLockState(
  analysis: AnalysisResult,
  deal: PipelineDeal,
  decision: Decision,
  rationale: string,
  proceedAnyway: boolean,
): ExportLockState {
  const locks: string[] = [];
  const rationaleOk = rationale.trim().length >= 20;
  const materialCount = getMaterialConflictCount(analysis);
  const unresolved = analysis.contradictions.filter((c) => c.status === "unresolved");
  const proceedLocked = hasMaterialConflicts(analysis);
  const proceedLockReason = proceedLocked ? exportCopy.recommendationLocked : null;

  if (deal.stage === "passed") {
    return {
      locks: [exportCopy.passedDeal],
      canSubmit: false,
      canExportCommitteePackage: false,
      proceedLocked: true,
      proceedLockReason: exportCopy.passedDeal,
      readyMessage: null,
      unresolvedBlockerCount: unresolved.length,
      materialConflictCount: materialCount,
      submitLabel: exportCopy.submitLocked,
    };
  }

  if (!decision) {
    locks.push(exportCopy.decisionMissing);
    return {
      locks,
      canSubmit: false,
      canExportCommitteePackage: false,
      proceedLocked,
      proceedLockReason,
      readyMessage: null,
      unresolvedBlockerCount: unresolved.length,
      materialConflictCount: materialCount,
      submitLabel: exportCopy.submitLocked,
    };
  }

  if (!rationaleOk) {
    locks.push(exportCopy.rationaleMissing);
  }

  if (decision === "proceed") {
    if (proceedLocked) {
      locks.push(exportCopy.recommendationLocked);
    } else if (analysis.readinessScore < 7 && !proceedAnyway) {
      locks.push(exportCopy.readinessLow);
    }
  }

  const canSubmit = locks.length === 0;
  const canExportCommitteePackage = canSubmit && decision === "proceed";

  let submitLabel: string = exportCopy.submitLocked;
  if (canSubmit) {
    submitLabel = exportCopy.submitDecision;
  }

  return {
    locks,
    canSubmit,
    canExportCommitteePackage,
    proceedLocked,
    proceedLockReason,
    readyMessage: canSubmit ? exportCopy.readyForDecision(decision) : null,
    unresolvedBlockerCount: unresolved.length,
    materialConflictCount: materialCount,
    submitLabel,
  };
}

/** @deprecated Proceed with open material conflicts is no longer allowed. */
export function needsBlockerAcknowledgement(): boolean {
  return false;
}
