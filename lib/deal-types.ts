export type DealStage = "screening" | "diligence" | "ic_prep" | "passed";
export type ReadinessStatus = "ready" | "blocked" | "in_review";

export interface PipelineDeal {
  id: string;
  name: string;
  tagline: string;
  description: string;
  categoryId: string;
  sector: string;
  stage: DealStage;
  owner: string;
  arr: string;
  growth: string;
  askAmount: string;
  location: string;
  founded: string;
  employees: string;
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  conflictCount: number;
  openItems: number;
  documentsReviewed: number;
  lastUpdated: string;
  /** Days since added — lower = newer. Used for sort at scale. */
  dateAdded: number;
  tags: string[];
  highlights: string[];
  hasFullWorkflow: boolean;
}
