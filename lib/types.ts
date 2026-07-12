/**
 * Shared TypeScript shapes for deal diligence: conflicts, checklists,
 * analysis results, and the human decision recorded at export time.
 */

export type Decision = "proceed" | "more_diligence" | "pass" | null;

export type Severity = "high" | "medium" | "low";

export type Priority = "high" | "medium" | "low";

export type ConflictStatus = "unresolved" | "resolved" | "acknowledged";

export type EvidenceStatus =
  | "supported"
  | "partially_supported"
  | "not_supported"
  | "needs_source";

export type ConfidenceLevel = "high" | "medium" | "low";

export type PackageSectionStatus =
  | "ready"
  | "needs_support"
  | "blocked"
  | "draft_ready"
  | "not_started";

export interface DealMeta {
  id: string;
  name: string;
  description: string;
  tags: string[];
  owner: string;
  source: string;
  lastUpdated: string;
}

export interface Contradiction {
  id: string;
  field: string;
  sourceA: { name: string; value: string; quote: string };
  sourceB: { name: string; value: string; quote: string };
  severity: Severity;
  suggestedAction: string;
  whyItMatters: string;
  whyItBlocksIC: string;
  status: ConflictStatus;
  linkedChecklistId?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  priority: Priority;
  linkedRisk?: string;
  linkedIssue?: string;
  owner?: string;
  done: boolean;
}

export interface OnePager {
  thesis: string;
  whyNow: string;
  keyRisks: string[];
  mitigants: string[];
}

export interface UnsupportedClaim {
  id: string;
  claim: string;
  source: string;
  evidenceStatus: EvidenceStatus;
  requiredProof: string;
}

export interface KeyFact {
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  sources: string;
  note?: string;
}

export interface ICPackageSection {
  id: string;
  section: string;
  status: PackageSectionStatus;
  blocker?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  label: string;
  type: "system" | "ai" | "warning" | "human";
}

export interface AnalysisResult {
  deal: DealMeta;
  onePager: OnePager;
  readinessScore: number;
  openQuestions: number;
  documentsReviewed: number;
  sourceCount: number;
  sourcesReviewed: string[];
  diligenceProgress: number;
  contradictions: Contradiction[];
  checklist: ChecklistItem[];
  unsupportedClaims: UnsupportedClaim[];
  keyFacts: KeyFact[];
  packageSections: ICPackageSection[];
  auditTrail: AuditEvent[];
  verdictBlockers: string[];
  blockingConflictCount: number;
  analyzedAt: string;
  usedLiveAI: boolean;
}

export interface HumanDecision {
  decision: Decision;
  rationale: string;
}
