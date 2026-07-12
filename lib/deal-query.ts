import type { DealStage, PipelineDeal, ReadinessStatus } from "@/lib/deal-types";

export type SortField = "newest" | "name" | "readiness" | "arr" | "updated";
export type SortDir = "asc" | "desc";
export type WorkflowStep = "conflicts" | "draft" | "decision";

export interface DealFilters {
  q: string;
  stages: DealStage[];
  categoryId: string;
  owner: string;
  readinessMin: number;
  readinessMax: number;
  status: ReadinessStatus | "all";
  workflowStep: WorkflowStep | "all";
  mineOnly: boolean;
}

export const DEFAULT_FILTERS: DealFilters = {
  q: "",
  stages: [],
  categoryId: "all",
  owner: "all",
  readinessMin: 0,
  readinessMax: 10,
  status: "all",
  workflowStep: "all",
  mineOnly: false,
};

export const PAGE_SIZES = [25, 50, 100] as const;
export const DEMO_PAGE_SIZES = {
  pipeline: [8, 25, 50] as const,
  icQueue: [6, 25, 50] as const,
};

export function getWorkflowStep(deal: PipelineDeal): WorkflowStep {
  if (deal.conflictCount > 0 || deal.readinessStatus === "blocked") return "conflicts";
  if (deal.readinessStatus === "ready") return "decision";
  return "draft";
}

export function parseArr(arr: string): number {
  const n = parseFloat(arr.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function matchesQuery(deal: PipelineDeal, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    deal.name.toLowerCase().includes(query) ||
    deal.tagline.toLowerCase().includes(query) ||
    deal.sector.toLowerCase().includes(query) ||
    deal.owner.toLowerCase().includes(query) ||
    deal.tags.some((t) => t.toLowerCase().includes(query))
  );
}

export function filterDeals(deals: PipelineDeal[], f: DealFilters, currentUser?: string): PipelineDeal[] {
  return deals.filter((d) => {
    if (!matchesQuery(d, f.q)) return false;
    if (f.stages.length > 0 && !f.stages.includes(d.stage)) return false;
    if (f.categoryId !== "all" && d.categoryId !== f.categoryId) return false;
    if (f.owner !== "all" && d.owner !== f.owner) return false;
    if (d.readinessScore < f.readinessMin || d.readinessScore > f.readinessMax) return false;
    if (f.status !== "all" && d.readinessStatus !== f.status) return false;
    if (f.mineOnly && currentUser && d.owner !== currentUser) return false;
    if (f.workflowStep !== "all" && getWorkflowStep(d) !== f.workflowStep) return false;
    return true;
  });
}

export function sortDeals(deals: PipelineDeal[], field: SortField, dir: SortDir): PipelineDeal[] {
  const sorted = [...deals];
  const mul = dir === "asc" ? 1 : -1;
  sorted.sort((a, b) => {
    switch (field) {
      case "name":
        return mul * a.name.localeCompare(b.name);
      case "readiness":
        return mul * (a.readinessScore - b.readinessScore);
      case "arr":
        return mul * (parseArr(a.arr) - parseArr(b.arr));
      case "updated":
      case "newest":
        return mul * ((a.dateAdded ?? 999) - (b.dateAdded ?? 999));
      default:
        return 0;
    }
  });
  return sorted;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    start: total === 0 ? 0 : start + 1,
    end: Math.min(start + pageSize, total),
  };
}

export function countByStage(deals: PipelineDeal[]): Record<DealStage, number> {
  return {
    screening: deals.filter((d) => d.stage === "screening").length,
    diligence: deals.filter((d) => d.stage === "diligence").length,
    ic_prep: deals.filter((d) => d.stage === "ic_prep").length,
    passed: deals.filter((d) => d.stage === "passed").length,
  };
}

export function icQueueDeals(deals: PipelineDeal[]): PipelineDeal[] {
  return deals.filter(
    (d) =>
      d.stage !== "passed" &&
      (d.stage === "ic_prep" ||
        d.readinessStatus === "blocked" ||
        d.readinessStatus === "ready"),
  );
}
