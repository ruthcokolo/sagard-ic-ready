import type { PortfolioCompany, ReportingPackage } from "./types";
import { normalizeCompanyName } from "./company-normalize";
import { resolveCompanySector } from "./sector-classification";
import {
  extractCompanyNameFromFileName,
  extractReportPeriodFromFileName,
} from "./pdf-filename";

export function companyIdFromName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "company"
  );
}

/** Parse company name and report period from a PDF filename. */
export function parsePdfFileName(fileName: string): {
  companyName: string;
  reportPeriod: string;
} {
  return {
    companyName: extractCompanyNameFromFileName(fileName),
    reportPeriod: extractReportPeriodFromFileName(fileName) ?? "",
  };
}

export function createPortfolioCompany(
  name: string,
  sector?: string,
  extras?: Partial<PortfolioCompany>
): PortfolioCompany {
  const now = new Date().toISOString();
  return {
    id: companyIdFromName(name),
    name,
    normalizedName: normalizeCompanyName(name),
    sector: sector ?? "Unclassified",
    status: "Active",
    latestReportDate: null,
    coverage: 0,
    metricsApproved: 0,
    metricsNeedsValidation: 0,
    metricsMissing: 0,
    createdAt: now,
    updatedAt: now,
    ...extras,
  };
}

export function applyCompanySector(
  company: PortfolioCompany,
  sector: string,
  force = false
): PortfolioCompany {
  if (!force && company.sector !== "Portfolio" && company.sector !== "Unclassified") {
    return company;
  }
  return { ...company, sector, updatedAt: new Date().toISOString() };
}

export function ensureCompanyInState(
  companies: PortfolioCompany[],
  name: string,
  sector?: string
): { companies: PortfolioCompany[]; company: PortfolioCompany } {
  const id = companyIdFromName(name);
  const existing = companies.find(
    (c) =>
      c.id === id ||
      c.name.toLowerCase() === name.toLowerCase() ||
      (c.normalizedName ?? normalizeCompanyName(c.name)) === normalizeCompanyName(name)
  );
  if (existing) {
    if (sector) {
      const updated = applyCompanySector(existing, sector, false);
      if (updated === existing) return { companies, company: existing };
      return {
        companies: companies.map((c) => (c.id === existing.id ? updated : c)),
        company: updated,
      };
    }
    return { companies, company: existing };
  }
  const company = createPortfolioCompany(name, sector);
  return { companies: [...companies, company], company };
}

/**
 * Ensure package companies exist. Never drop manually created companies
 * (or any existing company) just because they have zero packages.
 */
export function syncCompaniesWithPackages(
  companies: PortfolioCompany[],
  packages: Pick<ReportingPackage, "companyId" | "companyName">[]
): PortfolioCompany[] {
  const byId = new Map(companies.map((c) => [c.id, c]));

  for (const pkg of packages) {
    if (!byId.has(pkg.companyId)) {
      const created = createPortfolioCompany(pkg.companyName);
      byId.set(pkg.companyId, { ...created, id: pkg.companyId, name: pkg.companyName });
    }
  }

  return [...byId.values()].map((c) =>
    c.normalizedName ? c : { ...c, normalizedName: normalizeCompanyName(c.name) }
  );
}

/** Reclassify legacy placeholder sectors using company id/name heuristics. */
export function refreshLegacyCompanySectors(companies: PortfolioCompany[]): PortfolioCompany[] {
  return companies.map((company) => {
    if (company.sector !== "Portfolio" && company.sector !== "Unclassified") {
      return company;
    }
    return {
      ...company,
      sector: resolveCompanySector({
        companyId: company.id,
        companyName: company.name,
      }),
    };
  });
}
