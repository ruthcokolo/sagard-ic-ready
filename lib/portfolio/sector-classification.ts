/** Canonical portfolio sector labels used in filters and company profiles. */
export const PORTFOLIO_SECTORS = [
  "Healthcare",
  "Real Estate",
  "Enterprise Software",
  "Fintech",
  "Consumer",
  "Industrial & Manufacturing",
  "Logistics & Transportation",
  "Energy & Climate",
] as const;

export type PortfolioSector = (typeof PORTFOLIO_SECTORS)[number];

const SECTOR_ALIASES: Record<string, PortfolioSector> = {
  healthcare: "Healthcare",
  "health care": "Healthcare",
  "healthcare it": "Healthcare",
  "digital health": "Healthcare",
  medical: "Healthcare",
  "real estate": "Real Estate",
  proptech: "Real Estate",
  "real estate technology": "Real Estate",
  "prop tech": "Real Estate",
  "enterprise software": "Enterprise Software",
  saas: "Enterprise Software",
  software: "Enterprise Software",
  "b2b saas": "Enterprise Software",
  fintech: "Fintech",
  payments: "Fintech",
  "embedded finance": "Fintech",
  consumer: "Consumer",
  retail: "Consumer",
  marketplace: "Consumer",
  "industrial & manufacturing": "Industrial & Manufacturing",
  manufacturing: "Industrial & Manufacturing",
  industrial: "Industrial & Manufacturing",
  "logistics & transportation": "Logistics & Transportation",
  logistics: "Logistics & Transportation",
  transportation: "Logistics & Transportation",
  "energy & climate": "Energy & Climate",
  energy: "Energy & Climate",
  climate: "Energy & Climate",
  cleantech: "Energy & Climate",
  portfolio: "Enterprise Software",
  unclassified: "Enterprise Software",
};

type SectorRule = {
  sector: PortfolioSector;
  /** Strong document-level signals */
  documentPatterns: RegExp[];
  /** Company-name signals (weighted higher) */
  namePatterns: RegExp[];
  weight: number;
};

const SECTOR_RULES: SectorRule[] = [
  {
    sector: "Real Estate",
    namePatterns: [
      /\b(?:realty|properties|property|estate|proptech|reit)\b/i,
      /\b(?:landlord|tenant|occupancy|multifamily|commercial property)\b/i,
    ],
    documentPatterns: [
      /\b(?:real estate|property portfolio|portfolio report|proptech)\b/i,
      /\b(?:noi|net operating income|occupancy rate|cap rate|rent roll)\b/i,
      /\b(?:square feet|sq\.?\s*ft|leased area|lease expir|tenant retention)\b/i,
      /\b(?:multifamily|industrial property|office portfolio|retail property)\b/i,
    ],
    weight: 3,
  },
  {
    sector: "Healthcare",
    namePatterns: [/\b(?:health|medical|medivion|vitals|clinical|pharma|bio)\b/i],
    documentPatterns: [
      /\b(?:healthcare|health care|hospital|patient|clinical|provider network)\b/i,
      /\b(?:hipaa|ehr|emr|telehealth|medical device|life sciences)\b/i,
      /\b(?:pharmaceutical|diagnostic|care delivery|health system)\b/i,
    ],
    weight: 3,
  },
  {
    sector: "Fintech",
    namePatterns: [/\b(?:bank|pay|ledger|fintech|capital|finance systems)\b/i],
    documentPatterns: [
      /\b(?:fintech|payments|payment processing|embedded finance|neobank)\b/i,
      /\b(?:transaction volume|card volume|loan origination|underwriting)\b/i,
      /\b(?:banking infrastructure|wallet|merchant acquiring)\b/i,
    ],
    weight: 3,
  },
  {
    sector: "Enterprise Software",
    namePatterns: [/\b(?:software|systems|logic|stack|metrics|cloud|saas)\b/i],
    documentPatterns: [
      /\b(?:saas|software platform|cloud platform|subscription revenue)\b/i,
      /\b(?:annual recurring revenue|\barr\b|logo churn|revenue churn)\b/i,
      /\b(?:enterprise customers|seat expansion|product-led growth)\b/i,
    ],
    weight: 2,
  },
  {
    sector: "Consumer",
    namePatterns: [/\b(?:shop|cart|brand|consumer|retail|marketplace)\b/i],
    documentPatterns: [
      /\b(?:consumer brand|direct-to-consumer|d2c|e-?commerce|marketplace gmv)\b/i,
      /\b(?:same-store sales|basket size|customer acquisition cost)\b/i,
    ],
    weight: 2,
  },
  {
    sector: "Industrial & Manufacturing",
    namePatterns: [/\b(?:manufacturing|forge|plant|industrial|apex)\b/i],
    documentPatterns: [
      /\b(?:manufacturing|factory|production volume|plant utilization)\b/i,
      /\b(?:industrial equipment|supply chain|work-in-process|throughput)\b/i,
    ],
    weight: 3,
  },
  {
    sector: "Logistics & Transportation",
    namePatterns: [/\b(?:logistics|freight|transit|route|northwind)\b/i],
    documentPatterns: [
      /\b(?:logistics|freight|transportation|shipping|fulfillment)\b/i,
      /\b(?:route optimization|last mile|fleet|carrier network)\b/i,
    ],
    weight: 3,
  },
  {
    sector: "Energy & Climate",
    namePatterns: [/\b(?:energy|helix|solar|carbon|climate|green)\b/i],
    documentPatterns: [
      /\b(?:renewable energy|power generation|carbon emissions|climate)\b/i,
      /\b(?:megawatt|utility-scale|energy storage|sustainability)\b/i,
    ],
    weight: 3,
  },
];

export function normalizePortfolioSector(value: string | undefined | null): PortfolioSector | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if ((PORTFOLIO_SECTORS as readonly string[]).includes(trimmed)) {
    return trimmed as PortfolioSector;
  }
  const alias = SECTOR_ALIASES[trimmed.toLowerCase()];
  return alias ?? null;
}

export function isDisplayablePortfolioSector(sector: string | undefined | null): sector is PortfolioSector {
  if (!sector?.trim()) return false;
  return sector !== "Portfolio" && sector !== "Unclassified";
}

export function getActivePortfolioSectors(
  companies: { sector: string }[]
): PortfolioSector[] {
  const seen = new Set<PortfolioSector>();
  for (const company of companies) {
    const normalized = normalizePortfolioSector(company.sector);
    if (normalized) seen.add(normalized);
  }
  return PORTFOLIO_SECTORS.filter((sector) => seen.has(sector));
}

function scoreSectorRules(
  companyName: string,
  documentText: string,
  rules: SectorRule[]
): Map<PortfolioSector, number> {
  const scores = new Map<PortfolioSector, number>();
  const name = companyName.toLowerCase();
  const doc = documentText.toLowerCase();
  const combined = `${name} ${doc}`;

  for (const rule of rules) {
    let score = 0;
    for (const pattern of rule.namePatterns) {
      if (pattern.test(name)) score += rule.weight * 2;
    }
    for (const pattern of rule.documentPatterns) {
      if (pattern.test(combined)) score += rule.weight;
    }
    if (score > 0) {
      scores.set(rule.sector, (scores.get(rule.sector) ?? 0) + score);
    }
  }

  return scores;
}

/**
 * Infer sector from company name and extracted PDF text.
 * Uses weighted keyword scoring — document content takes priority over name alone.
 */
export function classifyCompanySector(
  companyName: string,
  documentText = ""
): PortfolioSector {
  const scores = scoreSectorRules(companyName, documentText, SECTOR_RULES);
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0 || ranked[0][1] < 3) {
    return "Enterprise Software";
  }

  // Require a meaningful margin when multiple sectors score similarly
  if (ranked.length > 1 && ranked[0][1] - ranked[1][1] < 2) {
    const nameOnlyScores = scoreSectorRules(companyName, "", SECTOR_RULES);
    const nameRanked = [...nameOnlyScores.entries()].sort((a, b) => b[1] - a[1]);
    if (nameRanked.length > 0 && nameRanked[0][1] >= 4) {
      return nameRanked[0][0];
    }
  }

  return ranked[0][0];
}

/** Known sample / catalog company sectors for bundled PDFs. */
export const KNOWN_COMPANY_SECTORS: Record<string, PortfolioSector> = {
  "northwind-logistics": "Logistics & Transportation",
  "cyberdyne-systems": "Enterprise Software",
  "helix-energy": "Energy & Climate",
  "apex-manufacturing": "Industrial & Manufacturing",
  "lumos-health": "Healthcare",
  "stonegate-properties": "Real Estate",
};

export function resolveCompanySector(input: {
  companyId: string;
  companyName: string;
  documentText?: string;
}): PortfolioSector {
  const known = KNOWN_COMPANY_SECTORS[input.companyId];
  if (known) return known;
  return classifyCompanySector(input.companyName, input.documentText ?? "");
}
