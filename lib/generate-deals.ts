import { categories } from "@/lib/categories";
import type { DealStage, PipelineDeal, ReadinessStatus } from "@/lib/deal-types";

const OWNERS = ["Alex Rivera", "Jordan Lee", "Sam Chen", "Priya Nair", "Marcus Webb"];
const STAGES: DealStage[] = ["screening", "diligence", "ic_prep", "passed"];
const STAGE_WEIGHTS = [0.38, 0.28, 0.22, 0.12];
const PREFIXES = [
  "North", "Blue", "Clear", "Peak", "Arc", "Nova", "Vertex", "Summit", "Bridge", "Core",
  "Swift", "Bright", "Atlas", "Pulse", "Forge", "Grid", "Layer", "Scale", "Flow", "Signal",
];
const SUFFIXES = [
  "Systems", "Labs", "Health", "Pay", "Ops", "Cloud", "Data", "Works", "Logic", "Stack",
  "Hub", "AI", "Bio", "Capital", "Retail", "Fleet", "Sense", "Link", "Base", "Wave",
];
const TAGLINES = [
  "Vertical SaaS for mid-market operators",
  "AI-native workflow automation",
  "Embedded finance infrastructure",
  "Clinical ops optimization platform",
  "PropTech asset management layer",
  "Consumer subscription brand",
  "Data governance for analytics teams",
  "Last-mile logistics intelligence",
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function weightedStage(rand: () => number): DealStage {
  const r = rand();
  let acc = 0;
  for (let i = 0; i < STAGES.length; i++) {
    acc += STAGE_WEIGHTS[i]!;
    if (r <= acc) return STAGES[i]!;
  }
  return "screening";
}

function formatArr(millions: number): string {
  return `$${millions.toFixed(1)}M`;
}

function formatAsk(millions: number, stage: DealStage): string {
  const round =
    stage === "screening" ? "Series A" : stage === "diligence" ? "Series B" : stage === "ic_prep" ? "Growth" : "Series A";
  return `$${Math.round(millions)}M ${round}`;
}

function daysAgoLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/** Stage drives score and status so "Passed on" never looks IC-ready. */
function metricsForStage(stage: DealStage, rand: () => number) {
  let readinessScore: number;
  let conflictCount: number;
  let openItems: number;
  let readinessStatus: ReadinessStatus;

  switch (stage) {
    case "passed":
      // Firm passed on the deal (declined to invest). Low scores are expected.
      readinessScore = Math.max(1, Math.min(5, Math.round(1 + rand() * 4)));
      conflictCount = rand() > 0.65 ? 1 : 0;
      openItems = Math.floor(rand() * 3);
      readinessStatus = "in_review";
      break;
    case "screening":
      readinessScore = Math.max(2, Math.min(6, Math.round(2 + rand() * 4)));
      conflictCount = rand() > 0.75 ? 1 : 0;
      openItems = Math.floor(rand() * 5) + 2;
      readinessStatus = "in_review";
      break;
    case "diligence":
      readinessScore = Math.max(3, Math.min(7, Math.round(3 + rand() * 4)));
      conflictCount = rand() > 0.5 ? Math.floor(rand() * 2) + 1 : 0;
      openItems = Math.floor(rand() * 6) + 3;
      readinessStatus = conflictCount > 0 ? "blocked" : "in_review";
      break;
    case "ic_prep":
    default:
      readinessScore = Math.max(5, Math.min(10, Math.round(5 + rand() * 5)));
      conflictCount =
        readinessScore < 7 ? Math.floor(rand() * 2) + 1 : rand() > 0.7 ? 1 : 0;
      openItems = Math.floor(rand() * 5) + 1;
      if (conflictCount > 0) readinessStatus = "blocked";
      else if (readinessScore >= 7) readinessStatus = "ready";
      else readinessStatus = "in_review";
      break;
  }

  return { readinessScore, conflictCount, openItems, readinessStatus };
}

export function generateDeals(count: number, seed = 42): PipelineDeal[] {
  const rand = mulberry32(seed);
  const sectorCats = categories.filter((c) => c.id !== "all");
  const deals: PipelineDeal[] = [];

  for (let i = 0; i < count; i++) {
    const cat = pick(rand, sectorCats);
    const stage = weightedStage(rand);
    const arrM = 2 + rand() * 48;
    const { readinessScore, conflictCount, openItems, readinessStatus } = metricsForStage(stage, rand);
    const daysAgo = Math.floor(rand() * 90);
    const name = `${pick(rand, PREFIXES)} ${pick(rand, SUFFIXES)} ${i + 1}`;

    deals.push({
      id: `gen-${i + 1}`,
      name,
      tagline: pick(rand, TAGLINES),
      description: `${name} operates in ${cat.label.toLowerCase()} with a focus on scalable unit economics and enterprise adoption.`,
      categoryId: cat.id,
      sector: cat.label,
      stage,
      owner: pick(rand, OWNERS),
      arr: formatArr(arrM),
      growth: `+${Math.round(12 + rand() * 45)}% YoY`,
      askAmount: formatAsk(arrM * (2.5 + rand() * 2), stage),
      location: pick(rand, ["New York, NY", "San Francisco, CA", "Austin, TX", "Boston, MA", "Toronto, ON"]),
      founded: String(2015 + Math.floor(rand() * 9)),
      employees: String(20 + Math.floor(rand() * 280)),
      readinessScore,
      readinessStatus,
      conflictCount,
      openItems,
      documentsReviewed: Math.floor(rand() * 8) + 1,
      lastUpdated: daysAgoLabel(daysAgo),
      dateAdded: daysAgo,
      tags: [cat.label, pick(rand, ["North America", "Europe", "Series B", "Growth Equity"])],
      highlights: ["Strong retention in core segment", "Expanding go-to-market motion"],
      hasFullWorkflow: true,
    });
  }

  return deals;
}
