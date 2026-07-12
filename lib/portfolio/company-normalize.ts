import type { PortfolioCompany } from "./types";

const LEGAL_SUFFIXES =
  /\b(?:inc|incorporated|ltd|limited|llc|l\.l\.c|corp|corporation|holdings|group|co|company|plc|lp|llp)\b\.?/gi;

/** Normalize a company display name for duplicate matching. */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract and normalize a hostname from a URL or bare domain. */
export function normalizeCompanyDomain(urlOrDomain: string): string | null {
  const raw = urlOrDomain.trim();
  if (!raw) return null;
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(candidate)) {
      candidate = `https://${candidate}`;
    } else {
      return null;
    }
  }
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.hostname.replace(/^www\./i, "").toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

export type DuplicateMatchKind = "exact" | "fuzzy" | "domain";

export type PotentialDuplicate = {
  company: PortfolioCompany;
  kind: DuplicateMatchKind;
  confidence: "high" | "medium" | "low";
  reason: string;
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cur =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : 1 + Math.min(row[j - 1], prev, row[j]);
      row[j - 1] = prev;
      prev = cur;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

export function findPotentialDuplicateCompanies(
  input: { name: string; websiteUrl?: string },
  existingCompanies: PortfolioCompany[]
): PotentialDuplicate[] {
  const norm = normalizeCompanyName(input.name);
  const domain = input.websiteUrl ? normalizeCompanyDomain(input.websiteUrl) : null;
  if (!norm && !domain) return [];

  const matches: PotentialDuplicate[] = [];

  for (const company of existingCompanies) {
    const companyNorm = company.normalizedName ?? normalizeCompanyName(company.name);
    const companyDomain = company.websiteDomain ?? null;

    if (domain && companyDomain && domain === companyDomain) {
      matches.push({
        company,
        kind: "domain",
        confidence: "high",
        reason: `Website domain matches ${company.name}`,
      });
      continue;
    }

    if (norm && companyNorm === norm) {
      matches.push({
        company,
        kind: "exact",
        confidence: "high",
        reason: `${company.name} already exists in ${company.sector || "the portfolio"}`,
      });
      continue;
    }

    if (norm && companyNorm) {
      const dist = levenshtein(norm, companyNorm);
      const maxLen = Math.max(norm.length, companyNorm.length);
      const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;
      const contained =
        (norm.length >= 6 && companyNorm.includes(norm)) ||
        (companyNorm.length >= 6 && norm.includes(companyNorm));
      if (similarity >= 0.86 || contained) {
        matches.push({
          company,
          kind: "fuzzy",
          confidence: similarity >= 0.93 || contained ? "medium" : "low",
          reason: `Similar to ${company.name}`,
        });
      }
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return matches.sort((a, b) => rank[a.confidence] - rank[b.confidence]);
}

export type CompanyMatchResult = {
  companyId?: string;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  conflictingCompanyIds?: string[];
};

/** Match an uploaded package against existing companies. */
export function matchPackageToExistingCompany(input: {
  selectedCompanyId?: string | null;
  extractedCompanyName?: string | null;
  fileName?: string | null;
  extractedWebsiteDomain?: string | null;
  companies: PortfolioCompany[];
}): CompanyMatchResult {
  const { companies } = input;
  const reasons: string[] = [];

  if (input.selectedCompanyId) {
    const selected = companies.find((c) => c.id === input.selectedCompanyId);
    if (selected) {
      return {
        companyId: selected.id,
        confidence: "high",
        reasons: ["Selected company ID matches"],
      };
    }
  }

  const nameCandidates = [
    input.extractedCompanyName,
    input.fileName
      ? input.fileName.replace(/\.pdf$/i, "").replace(/_/g, " ").split(/\bQ[1-4]\b/i)[0]
      : null,
  ]
    .map((n) => (n ? normalizeCompanyName(n) : ""))
    .filter(Boolean);

  const extractedDomain = input.extractedWebsiteDomain?.toLowerCase() ?? null;
  const domainHits = extractedDomain
    ? companies.filter((c) => c.websiteDomain && c.websiteDomain === extractedDomain)
    : [];

  const nameHits = companies.filter((c) => {
    const cn = c.normalizedName ?? normalizeCompanyName(c.name);
    return nameCandidates.some((n) => n === cn);
  });

  const uniqueIds = new Set([
    ...domainHits.map((c) => c.id),
    ...nameHits.map((c) => c.id),
  ]);

  if (uniqueIds.size > 1) {
    return {
      confidence: "low",
      reasons: ["Multiple possible company matches found"],
      conflictingCompanyIds: [...uniqueIds],
    };
  }

  if (domainHits.length === 1) {
    reasons.push("Extracted website domain matches");
    return { companyId: domainHits[0].id, confidence: "high", reasons };
  }

  if (nameHits.length === 1) {
    reasons.push("Normalized company name matches exactly");
    return { companyId: nameHits[0].id, confidence: "high", reasons };
  }

  // Fuzzy single best match
  if (nameCandidates.length > 0) {
    const fuzzy = findPotentialDuplicateCompanies(
      { name: input.extractedCompanyName ?? nameCandidates[0] },
      companies
    ).filter((m) => m.kind === "fuzzy");
    if (fuzzy.length === 1 && fuzzy[0].confidence !== "low") {
      return {
        companyId: fuzzy[0].company.id,
        confidence: "medium",
        reasons: [fuzzy[0].reason],
      };
    }
    if (fuzzy.length > 1) {
      return {
        confidence: "low",
        reasons: ["Multiple similar company names found"],
        conflictingCompanyIds: fuzzy.map((f) => f.company.id),
      };
    }
  }

  return { confidence: "low", reasons: ["No confident company match"] };
}
