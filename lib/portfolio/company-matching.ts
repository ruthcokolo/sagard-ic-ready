import type { CompanyAlias } from "./monitoring-phase-types";
import type { PortfolioCompany } from "./types";

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export type CompanyMatchCandidate = {
  companyId: string;
  companyName: string;
  score: number;
  reason: "exact" | "alias" | "fuzzy" | "filename";
};

export function getPossibleCompanyMatches(
  query: string,
  companies: PortfolioCompany[],
  aliases: CompanyAlias[] = []
): CompanyMatchCandidate[] {
  const q = normalizeKey(query);
  if (!q) return [];
  const out: CompanyMatchCandidate[] = [];

  for (const c of companies) {
    const name = normalizeKey(c.name);
    const normalized = normalizeKey(c.normalizedName ?? "");
    if (name === q || normalized === q) {
      out.push({ companyId: c.id, companyName: c.name, score: 1, reason: "exact" });
      continue;
    }
    if (name.includes(q) || q.includes(name)) {
      out.push({ companyId: c.id, companyName: c.name, score: 0.75, reason: "fuzzy" });
    }
  }

  for (const alias of aliases) {
    if (normalizeKey(alias.alias) === q) {
      const company = companies.find((c) => c.id === alias.companyId);
      if (company && !out.some((o) => o.companyId === company.id)) {
        out.push({
          companyId: company.id,
          companyName: company.name,
          score: 0.95,
          reason: "alias",
        });
      }
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}
