/**
 * Alex Rivera's assigned review queue — 73 deals with fixed step counts
 * and showcase entries pinned to specific workflow stages.
 */

import type { PipelineDeal } from "@/lib/deal-types";
import type { DealFilters, SortField, SortDir, WorkflowStep } from "@/lib/deal-query";
import { matchesQuery, sortDeals } from "@/lib/deal-query";
import { pipelineDeals } from "@/lib/deals-pipeline";

const ASSIGNED_OWNER = "Alex Rivera";

/** Alex's assigned queue — each deal has exactly one next action. */
export const ASSIGNED_STEP_COUNTS = {
  total: 73,
  conflicts: 42,
  draft: 19,
  decision: 12,
} as const;

const SHOWCASE_IDS: Record<WorkflowStep, string[]> = {
  conflicts: ["northwind-logistics", "meridian-analytics"],
  draft: ["helix-health", "cascade-payments"],
  decision: ["brightcart", "lumen-home"],
};

const SYNTHETIC_NAMES = [
  "Apex Fleet Systems",
  "Summit Ledger",
  "ClearPath Health",
  "NovaBridge Capital",
  "Gridline Ops",
  "Pulse Retail",
  "ForgeStack AI",
  "Riverstone Pay",
  "Atlas Compliance",
  "Vertex Home",
  "SignalWave Bio",
  "CoreLedger",
  "BrightField Energy",
  "Northgate Analytics",
  "SwiftLedger",
  "LayerNine Cloud",
  "HarborPoint RE",
  "ScaleForge",
  "TrueNorth SaaS",
  "OpenCircuit",
  "BluePeak Logistics",
  "CedarLine Health",
  "Ironclad Security",
  "MarketMesh",
  "Prism Data",
  "Relay Commerce",
  "StoneRiver Fintech",
  "TerraGrid",
  "UnionStack",
  "Vantage Ops",
  "Westline Capital",
  "YieldPath",
  "Zenith Retail",
  "Arcadia Systems",
  "BeaconPay",
  "Catalyst Health",
  "DeltaForge",
  "EchoStream",
  "Frontier Ledger",
  "GraniteStack",
  "Horizon Bio",
  "InsightRail",
  "Juniper Cloud",
  "Keystone RE",
  "LumenPay",
  "Mosaic Data",
  "Nimbus Ops",
  "Orbit Commerce",
  "Pioneer Health",
  "Quartz AI",
  "Redwood Capital",
  "Sterling Fleet",
  "Trident SaaS",
  "Uplift Energy",
  "VioletStack",
  "Waypoint Fintech",
  "XenoLogic",
  "Yellowstone RE",
  "Zephyr Health",
  "AnchorGrid",
  "Baseline Ops",
  "CopperLine",
  "Driftwood Pay",
  "Evergreen SaaS",
  "Fireside Analytics",
  "Glasshouse Retail",
  "Highline Bio",
  "Inertia Cloud",
  "Jade Capital",
  "KiteLine",
  "Lockstep Ops",
  "Monarch Ledger",
  "Nettle Health",
  "Oakstream Fintech",
  "Parallel Systems",
  "Quarry Data",
  "Ridgeline RE",
  "Slate Commerce",
  "TimberStack",
  "Umber Analytics",
  "ValleyForge",
  "Wildcat Pay",
];

const stepByDealId = new Map<string, WorkflowStep>();

/** Picks readiness scores and conflict counts that match each workflow step. */
function metricsForStep(step: WorkflowStep, index: number) {
  const mod = index % 5;
  switch (step) {
    case "conflicts":
      return {
        readinessScore: mod === 0 ? 4 : mod === 1 ? 5 : 6,
        readinessStatus: "blocked" as const,
        conflictCount: mod === 0 ? 2 : 1,
        openItems: 4 + (index % 4),
      };
    case "draft":
      return {
        readinessScore: 5 + (index % 3),
        readinessStatus: "in_review" as const,
        conflictCount: 0,
        openItems: 2 + (index % 3),
      };
    case "decision":
      return {
        readinessScore: 7 + (index % 4),
        readinessStatus: "ready" as const,
        conflictCount: 0,
        openItems: index % 2,
      };
  }
}

/** Creates a fake deal entry for Alex's queue when showcase deals run out. */
function buildSyntheticDeal(name: string, step: WorkflowStep, index: number): PipelineDeal {
  const id = `assigned-${step}-${index + 1}`;
  const m = metricsForStep(step, index);
  const sectorPool = [
    { id: "enterprise-software", label: "Enterprise Software" },
    { id: "healthcare", label: "Healthcare IT" },
    { id: "fintech", label: "Fintech" },
    { id: "real-estate", label: "PropTech" },
    { id: "consumer", label: "Retail Tech" },
  ];
  const sector = sectorPool[index % sectorPool.length]!;
  const arrM = 2.5 + (index % 12) * 1.1;

  return {
    id,
    name,
    tagline: "Vertical SaaS for mid-market operators",
    description: `${name} operates in ${sector.label.toLowerCase()} with scalable unit economics.`,
    categoryId: sector.id,
    sector: sector.label,
    stage: step === "decision" ? "ic_prep" : step === "draft" ? "diligence" : "ic_prep",
    owner: ASSIGNED_OWNER,
    arr: `$${arrM.toFixed(1)}M`,
    growth: `+${22 + (index % 30)}% YoY`,
    askAmount: `$${Math.round(arrM * 3)}M Series B`,
    location: "New York, NY",
    founded: String(2017 + (index % 6)),
    employees: String(40 + (index % 80)),
    readinessScore: m.readinessScore,
    readinessStatus: m.readinessStatus,
    conflictCount: m.conflictCount,
    openItems: m.openItems,
    documentsReviewed: 4 + (index % 5),
    lastUpdated: index === 0 ? "2 min ago" : `${1 + (index % 12)} hr ago`,
    dateAdded: index,
    tags: [sector.label, "North America"],
    highlights: ["Strong retention in core segment", "Expanding go-to-market motion"],
    hasFullWorkflow: true,
  };
}

/** Copies a pipeline deal into Alex's assigned queue with the right owner. */
function cloneForQueue(source: PipelineDeal): PipelineDeal {
  return { ...source, owner: ASSIGNED_OWNER };
}

/** Assembles Alex's 73-deal queue with fixed step counts and Northwind pinned first. */
function buildAssignedQueue(): PipelineDeal[] {
  stepByDealId.clear();
  const pipelineById = new Map(pipelineDeals.map((d) => [d.id, d]));
  const usedIds = new Set<string>();
  const result: PipelineDeal[] = [];
  let nameIndex = 0;

  function addDeal(deal: PipelineDeal, step: WorkflowStep) {
    if (usedIds.has(deal.id)) return false;
    usedIds.add(deal.id);
    stepByDealId.set(deal.id, step);
    result.push(cloneForQueue(deal));
    return true;
  }

  (["conflicts", "draft", "decision"] as WorkflowStep[]).forEach((step) => {
    for (const id of SHOWCASE_IDS[step]) {
      const source = pipelineById.get(id);
      if (source && result.filter((d) => stepByDealId.get(d.id) === step).length < ASSIGNED_STEP_COUNTS[step]) {
        addDeal(source, step);
      }
    }
  });

  (["conflicts", "draft", "decision"] as WorkflowStep[]).forEach((step) => {
    let stepCount = result.filter((d) => stepByDealId.get(d.id) === step).length;
    while (stepCount < ASSIGNED_STEP_COUNTS[step]) {
      const name = SYNTHETIC_NAMES[nameIndex % SYNTHETIC_NAMES.length]!;
      nameIndex += 1;
      const deal = buildSyntheticDeal(name, step, stepCount);
      addDeal(deal, step);
      stepCount += 1;
    }
  });

  // Northwind always first; remaining sorted by step order then readiness
  const stepOrder: Record<WorkflowStep, number> = { conflicts: 0, draft: 1, decision: 2 };
  return result.sort((a, b) => {
    if (a.id === "northwind-logistics") return -1;
    if (b.id === "northwind-logistics") return 1;
    const sa = stepOrder[stepByDealId.get(a.id)!];
    const sb = stepOrder[stepByDealId.get(b.id)!];
    if (sa !== sb) return sa - sb;
    return a.readinessScore - b.readinessScore;
  });
}

export const assignedQueueDeals = buildAssignedQueue();

/** Returns the assigned workflow step for a deal in Alex's queue. */
export function getAssignedStep(dealId: string): WorkflowStep | undefined {
  return stepByDealId.get(dealId);
}

/** Whether a deal id belongs to the pre-built assigned queue. */
export function isAssignedQueueDeal(dealId: string): boolean {
  return stepByDealId.has(dealId);
}

/** Filters assigned deals using the shared filter shape and step override map. */
export function filterAssignedDeals(
  deals: PipelineDeal[],
  f: DealFilters,
  currentUser?: string,
): PipelineDeal[] {
  return deals.filter((d) => {
    if (!matchesQuery(d, f.q)) return false;
    if (f.stages.length > 0 && !f.stages.includes(d.stage)) return false;
    if (f.categoryId !== "all" && d.categoryId !== f.categoryId) return false;
    if (f.owner !== "all" && d.owner !== f.owner) return false;
    if (d.readinessScore < f.readinessMin || d.readinessScore > f.readinessMax) return false;
    if (f.status !== "all" && d.readinessStatus !== f.status) return false;
    if (f.mineOnly && currentUser && d.owner !== currentUser) return false;
    if (f.workflowStep !== "all") {
      const step = stepByDealId.get(d.id);
      if (step !== f.workflowStep) return false;
    }
    return true;
  });
}

/** Sorts assigned deals, keeping Northwind pinned to the top. */
export function sortAssignedDeals(deals: PipelineDeal[], field: SortField, dir: SortDir): PipelineDeal[] {
  const sorted = sortDeals(deals, field, dir);
  const northwind = sorted.find((d) => d.id === "northwind-logistics");
  if (northwind) {
    return [northwind, ...sorted.filter((d) => d.id !== "northwind-logistics")];
  }
  return sorted;
}

/** Fixed step counts for Alex's assigned workload badges. */
export function countAssignedByStep(): Record<WorkflowStep, number> {
  return {
    conflicts: ASSIGNED_STEP_COUNTS.conflicts,
    draft: ASSIGNED_STEP_COUNTS.draft,
    decision: ASSIGNED_STEP_COUNTS.decision,
  };
}
