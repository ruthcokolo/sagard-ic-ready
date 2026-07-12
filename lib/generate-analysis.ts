import type { PipelineDeal } from "@/lib/deal-types";
import type { AnalysisResult, ChecklistItem, Contradiction } from "@/lib/types";
import { enrichAnalysis, enrichContradiction } from "@/lib/enrich-analysis";
import { northwindAnalysis } from "@/lib/mock-deal";

function parseArrM(arr: string): number {
  return parseFloat(arr.replace(/[^0-9.]/g, "")) || 0;
}

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function rand(seed: number, n: number): number {
  const x = Math.sin(seed * 9999 + n * 7919) * 10000;
  return x - Math.floor(x);
}

const CHECKLIST_TEMPLATES = [
  { label: "Reconcile revenue across sources", risk: "Revenue mismatch" },
  { label: "Customer reference calls", risk: "Concentration" },
  { label: "Legal review of customer contracts", risk: "Contract terms" },
  { label: "Technical product diligence", risk: "Product risk" },
  { label: "Retention and cohort analysis", risk: "Retention" },
  { label: "Cap table and option pool review", risk: "Governance" },
  { label: "Management references", risk: "Team" },
  { label: "Market sizing validation", risk: "TAM" },
  { label: "Competitive landscape mapping", risk: "Competition" },
  { label: "Security and compliance audit", risk: "Compliance" },
];

type ScenarioBuilder = (
  deal: PipelineDeal,
  index: number,
  seed: number,
) => Omit<Contradiction, "id" | "linkedChecklistId" | "whyItMatters" | "whyItBlocksIC" | "status">;

const CONFLICT_SCENARIOS: ScenarioBuilder[] = [
  (deal, i, seed) => {
    const sheet = parseArrM(deal.arr);
    const memo = sheet * (0.68 + rand(seed, i) * 0.22);
    return {
      field: "ARR (2024)",
      sourceA: {
        name: "Google Sheet",
        value: deal.arr,
        quote: `Row 14: ARR (2024) = ${deal.arr}, growth ${deal.growth}`,
      },
      sourceB: {
        name: "Management Memo",
        value: `$${memo.toFixed(1)}M`,
        quote: `Section 2: FY24 ARR approximately $${Math.round(memo)}M after churn adjustments`,
      },
      severity: deal.readinessScore < 5 ? "high" : "high",
      suggestedAction: "Request audited financials and align ARR definition with finance",
    };
  },
  (deal, i, seed) => {
    const sheetPct = 28 + Math.floor(rand(seed, i + 1) * 25);
    const cimPct = sheetPct + 18 + Math.floor(rand(seed, i + 2) * 20);
    return {
      field: "Customer concentration",
      sourceA: {
        name: "Google Sheet",
        value: `Top 3 = ${sheetPct}% revenue`,
        quote: `Pipeline tab: concentration flagged as moderate for ${deal.name}`,
      },
      sourceB: {
        name: "CIM Extract",
        value: `Top 3 = ${cimPct}% revenue`,
        quote: `Appendix B: largest three customers represent ${cimPct}% of FY24 revenue`,
      },
      severity: "high",
      suggestedAction: "Validate customer revenue split with data room cohort file",
    };
  },
  (deal, i, seed) => {
    const memoGm = 68 + Math.floor(rand(seed, i + 3) * 10);
    const modelGm = memoGm - 6 - Math.floor(rand(seed, i + 4) * 6);
    return {
      field: "Gross margin",
      sourceA: {
        name: "Management Memo",
        value: `${memoGm}%`,
        quote: `Blended gross margin of ${memoGm}% post hosting optimization`,
      },
      sourceB: {
        name: "Financial Model",
        value: `${modelGm}%`,
        quote: `Model tab P&L: GM ${modelGm}% in base case`,
      },
      severity: "medium",
      suggestedAction: "Align model assumptions with management bridge schedule",
    };
  },
  (deal, i, seed) => {
    const sheetHc = parseInt(deal.employees, 10) || 80;
    const memoHc = sheetHc + Math.floor(rand(seed, i + 5) * 40) - 10;
    return {
      field: "Headcount",
      sourceA: {
        name: "Google Sheet",
        value: `${sheetHc} FTE`,
        quote: `Pipeline row: employees = ${sheetHc} as of last sync`,
      },
      sourceB: {
        name: "LinkedIn / Pitch Deck",
        value: `${memoHc} FTE`,
        quote: `Team slide lists ${memoHc} full-time employees across ${deal.location}`,
      },
      severity: "medium",
      suggestedAction: "Confirm current org chart and contractor vs FTE split",
    };
  },
  (deal, i, seed) => {
    const burn = Math.round(parseArrM(deal.arr) * (0.4 + rand(seed, i + 6) * 0.35));
    const runway = 12 + Math.floor(rand(seed, i + 7) * 14);
    const altRunway = runway - 5 - Math.floor(rand(seed, i + 8) * 4);
    return {
      field: "Burn rate / runway",
      sourceA: {
        name: "Financial Model",
        value: `$${burn}M burn · ${runway}mo runway`,
        quote: `Base case: monthly burn $${(burn / 12).toFixed(1)}M, runway ${runway} months`,
      },
      sourceB: {
        name: "Management Memo",
        value: `$${Math.round(burn * 0.85)}M burn · ${altRunway}mo runway`,
        quote: `CFO note: normalized burn implies ${altRunway}-month runway pre-raise`,
      },
      severity: deal.readinessScore < 6 ? "high" : "medium",
      suggestedAction: "Reconcile cash balance and monthly burn using bank statements",
    };
  },
  (deal, i, seed) => {
    const nrrSheet = 108 + Math.floor(rand(seed, i + 9) * 12);
    const nrrDeck = nrrSheet - 8 - Math.floor(rand(seed, i + 10) * 10);
    return {
      field: "Net revenue retention",
      sourceA: {
        name: "Google Sheet",
        value: `${nrrSheet}% NRR`,
        quote: `Metrics tab: trailing NRR ${nrrSheet}% on ${deal.sector} cohort`,
      },
      sourceB: {
        name: "Pitch Deck",
        value: `${nrrDeck}% NRR`,
        quote: `Slide 18: net retention of ${nrrDeck}% across enterprise accounts`,
      },
      severity: "medium",
      suggestedAction: "Pull cohort export and validate NRR calculation methodology",
    };
  },
];

function pickScenarios(count: number, seed: number): ScenarioBuilder[] {
  const pool = [...CONFLICT_SCENARIOS];
  const picked: ScenarioBuilder[] = [];
  let s = seed;
  for (let i = 0; i < count && pool.length > 0; i++) {
    s = (s * 1103515245 + 12345) | 0;
    const idx = Math.abs(s) % pool.length;
    picked.push(pool.splice(idx, 1)[0]!);
  }
  return picked;
}

function buildContradictions(deal: PipelineDeal, seed: number): Contradiction[] {
  if (deal.conflictCount === 0) return [];

  return pickScenarios(deal.conflictCount, seed).map((build, i) => {
    const base = build(deal, i, seed + i * 97);
    return enrichContradiction({
      id: `${deal.id}-c${i + 1}`,
      linkedChecklistId: `${deal.id}-cl${i + 1}`,
      ...base,
    });
  });
}

function buildChecklist(deal: PipelineDeal, seed: number): ChecklistItem[] {
  const count = Math.max(3, Math.min(10, deal.openItems + 2));
  const pool = [...CHECKLIST_TEMPLATES];
  const items: ChecklistItem[] = [];
  let s = seed + 17;

  for (let i = 0; i < count && pool.length > 0; i++) {
    s = (s * 1103515245 + 12345) | 0;
    const idx = Math.abs(s) % pool.length;
    const t = pool.splice(idx, 1)[0]!;
    const priorities: Priority[] = ["high", "medium", "low"];
    items.push({
      id: `${deal.id}-cl${i + 1}`,
      label: t.label,
      priority: priorities[i % 3]!,
      linkedRisk: t.risk,
      done: i >= deal.openItems,
    });
  }

  return items;
}

type Priority = ChecklistItem["priority"];

/** Before live analysis — sources synced, conflicts not computed yet. */
export function buildPendingAnalysis(deal: PipelineDeal): AnalysisResult {
  return enrichAnalysis(deal, {
    deal: {
      id: deal.id,
      name: deal.name,
      description: deal.tagline,
      tags: deal.tags,
      owner: deal.owner,
      source: "Google Sheet · Deal Pipeline",
      lastUpdated: "Just synced",
    },
    sourcesReviewed: ["Google Sheet", "Investor memo", "CIM extract", "Financial model"],
    sourceCount: 4,
    onePager: {
      thesis: "",
      whyNow: "",
      keyRisks: [],
      mitigants: [],
    },
    readinessScore: 0,
    openQuestions: 0,
    documentsReviewed: 4,
    diligenceProgress: 0,
    blockingConflictCount: 0,
    analyzedAt: "",
    usedLiveAI: false,
    verdictBlockers: [],
    keyFacts: [],
    contradictions: [],
    unsupportedClaims: [],
    checklist: [],
    packageSections: [],
    auditTrail: [
      {
        id: `${deal.id}-pending-1`,
        timestamp: new Date().toISOString(),
        label: "4 sources synced from Google Sheets (n8n)",
        type: "system",
      },
      {
        id: `${deal.id}-pending-2`,
        timestamp: new Date().toISOString(),
        label: "Awaiting cross-source analysis",
        type: "human",
      },
    ],
  });
}

/** @deprecated Use buildPendingAnalysis */
export function buildPendingNorthwindAnalysis(deal: PipelineDeal): AnalysisResult {
  return buildPendingAnalysis(deal);
}

export function buildNorthwindAnalysisResult(deal: PipelineDeal): AnalysisResult {
  return enrichAnalysis(deal, {
    ...northwindAnalysis,
    readinessScore: deal.readinessScore,
    openQuestions: deal.openItems,
    documentsReviewed: deal.documentsReviewed,
    blockingConflictCount: deal.conflictCount,
    analyzedAt: new Date().toISOString(),
    usedLiveAI: true,
    deal: {
      id: deal.id,
      name: deal.name,
      description: deal.tagline,
      tags: deal.tags,
      owner: deal.owner,
      source: "Google Sheet · Deal Pipeline",
      lastUpdated: deal.lastUpdated,
    },
  });
}

export function buildCompletedAnalysis(deal: PipelineDeal): AnalysisResult {
  if (deal.id === "northwind-logistics") {
    return buildNorthwindAnalysisResult(deal);
  }

  const seed = seedFromId(deal.id);
  const contradictions = buildContradictions(deal, seed);
  const checklist = buildChecklist(deal, seed);
  const highCount = contradictions.filter((c) => c.severity === "high").length;
  const doneCount = checklist.filter((c) => c.done).length;

  return enrichAnalysis(deal, {
    deal: {
      id: deal.id,
      name: deal.name,
      description: deal.tagline,
      tags: deal.tags,
      owner: deal.owner,
      source: "Google Sheet · Deal Pipeline",
      lastUpdated: deal.lastUpdated,
    },
    onePager: {
      thesis: `${deal.name} targets ${deal.sector.toLowerCase()} with ${deal.arr} ARR and ${deal.growth} growth, raising ${deal.askAmount}.`,
      whyNow: `${deal.sector} spend is shifting toward automation; ${deal.name} shows early traction with ${deal.employees} employees since ${deal.founded}.`,
      keyRisks: [
        deal.conflictCount > 0 ? "Cross-source data mismatches on core metrics" : "Execution risk at current scale",
        `${deal.sector} competitive intensity`,
        "Integration and go-to-market capacity",
      ],
      mitigants: deal.highlights.length > 0 ? deal.highlights : ["Experienced team", "Clear product wedge"],
    },
    readinessScore: deal.readinessScore,
    openQuestions: deal.openItems,
    documentsReviewed: deal.documentsReviewed,
    sourceCount: 4,
    diligenceProgress: checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0,
    contradictions,
    checklist,
    blockingConflictCount: highCount,
    analyzedAt: new Date().toISOString(),
    usedLiveAI: false,
    unsupportedClaims: [],
    keyFacts: [],
    packageSections: [],
    auditTrail: [],
    verdictBlockers: [],
    sourcesReviewed: ["Google Sheet", "Investor memo", "CIM extract", "Financial model"],
  });
}

/** Initial page load — all deals start pending until Run analysis. */
export function buildAnalysisForDeal(deal: PipelineDeal): AnalysisResult {
  return buildPendingAnalysis(deal);
}
