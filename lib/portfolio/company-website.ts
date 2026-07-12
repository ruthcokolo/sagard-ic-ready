import type {
  CompanyWebsiteConfidence,
  CompanyWebsiteSource,
  PageText,
  PortfolioCompany,
} from "./types";
import { normalizeCompanyDomain } from "./company-normalize";

const URL_RE =
  /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[^\s<>"']*)?/gi;

const DISALLOWED = /^(javascript|data|file|ftp):/i;

export type NormalizedWebsite = {
  displayUrl: string;
  domain: string;
};

/** Validate and normalize a user-entered or extracted website. */
export function normalizeWebsiteInput(raw: string): {
  ok: true;
  value: NormalizedWebsite;
} | { ok: false; error: string } {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return { ok: false, error: "Website is empty" };
  if (DISALLOWED.test(trimmed)) return { ok: false, error: "Unsupported URL protocol" };
  if (/\s/.test(raw.trim())) return { ok: false, error: "Website must not contain spaces" };

  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { ok: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http(s) websites are allowed" };
  }

  const domain = normalizeCompanyDomain(parsed.href);
  if (!domain || !domain.includes(".")) {
    return { ok: false, error: "Invalid domain" };
  }

  // Preserve a clean display URL (no trailing slash on bare origins).
  const displayUrl =
    parsed.pathname === "/" && !parsed.search && !parsed.hash
      ? `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "")
      : parsed.href.replace(/\/$/, "");

  return { ok: true, value: { displayUrl, domain } };
}

export type ExtractedWebsiteCandidate = {
  url: string;
  domain: string;
  sourcePage: number;
  evidenceText: string;
  confidence: CompanyWebsiteConfidence;
};

/**
 * Attempt to find an explicit company website in PDF page text.
 * Does not invent a website from the company name alone.
 */
export function extractWebsiteFromPages(
  pages: PageText[],
  companyName?: string
): ExtractedWebsiteCandidate | null {
  const contactCue =
    /\b(website|web site|www\.|visit us|contact|investor relations|ir@|about us)\b/i;
  const candidates: ExtractedWebsiteCandidate[] = [];

  for (const page of pages.slice(0, 8)) {
    const text = page.text ?? "";
    if (!text.trim()) continue;
    const matches = text.match(URL_RE) ?? [];
    for (const match of matches) {
      const normalized = normalizeWebsiteInput(match);
      if (!normalized.ok) continue;
      const { displayUrl, domain } = normalized.value;
      // Skip common non-company hosts
      if (
        /^(bit\.ly|t\.co|linkedin\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|youtube\.com|maps\.google\.com|docs\.google\.com)$/i.test(
          domain
        )
      ) {
        continue;
      }

      const nearContact = contactCue.test(text);
      const nameToken = companyName
        ?.toLowerCase()
        .split(/\s+/)
        .find((t) => t.length >= 4);
      const domainMentionsName = nameToken
        ? domain.includes(nameToken.replace(/[^a-z0-9]/g, ""))
        : false;

      let confidence: CompanyWebsiteConfidence = "low";
      if (nearContact && (domainMentionsName || page.page <= 2)) confidence = "high";
      else if (nearContact || page.page <= 2) confidence = "medium";

      const idx = text.toLowerCase().indexOf(match.toLowerCase());
      const evidenceText = text
        .slice(Math.max(0, idx - 40), Math.min(text.length, idx + match.length + 40))
        .replace(/\s+/g, " ")
        .trim();

      candidates.push({
        url: displayUrl,
        domain,
        sourcePage: page.page,
        evidenceText,
        confidence,
      });
    }
  }

  if (candidates.length === 0) return null;
  const rank = { high: 0, medium: 1, low: 2 };
  candidates.sort((a, b) => rank[a.confidence] - rank[b.confidence]);
  return candidates[0];
}

/** Convenience when only concatenated document text is available. */
export function extractWebsiteFromDocumentText(
  documentText: string,
  companyName?: string
): ExtractedWebsiteCandidate | null {
  if (!documentText.trim()) return null;
  return extractWebsiteFromPages([{ page: 1, text: documentText }], companyName);
}

export function applyWebsiteToCompany(
  company: PortfolioCompany,
  input: {
    url: string;
    domain: string;
    source: CompanyWebsiteSource;
    confidence?: CompanyWebsiteConfidence;
    packageId?: string;
    page?: number;
    evidence?: string;
  }
): {
  company: PortfolioCompany;
  outcome: "saved" | "unchanged" | "conflict";
} {
  const existingDomain = company.websiteDomain;
  if (!existingDomain) {
    if (input.source === "pdf_extracted" && input.confidence === "low") {
      return {
        company: {
          ...company,
          pendingWebsiteUrl: input.url,
          pendingWebsiteDomain: input.domain,
          pendingWebsiteSourcePackageId: input.packageId,
          pendingWebsiteSourcePage: input.page,
          pendingWebsiteEvidence: input.evidence,
          updatedAt: new Date().toISOString(),
        },
        outcome: "conflict",
      };
    }
    return {
      company: {
        ...company,
        websiteUrl: input.url,
        websiteDomain: input.domain,
        websiteSource: input.source,
        websiteConfidence: input.confidence,
        websiteSourcePackageId: input.packageId,
        websiteSourcePage: input.page,
        pendingWebsiteUrl: undefined,
        pendingWebsiteDomain: undefined,
        pendingWebsiteSourcePackageId: undefined,
        pendingWebsiteSourcePage: undefined,
        pendingWebsiteEvidence: undefined,
        updatedAt: new Date().toISOString(),
      },
      outcome: "saved",
    };
  }

  if (existingDomain === input.domain) {
    return { company, outcome: "unchanged" };
  }

  // Conflict — never overwrite silently
  return {
    company: {
      ...company,
      pendingWebsiteUrl: input.url,
      pendingWebsiteDomain: input.domain,
      pendingWebsiteSourcePackageId: input.packageId,
      pendingWebsiteSourcePage: input.page,
      pendingWebsiteEvidence: input.evidence,
      updatedAt: new Date().toISOString(),
    },
    outcome: "conflict",
  };
}

export function formatWebsiteProvenance(company: PortfolioCompany): string | null {
  if (!company.websiteUrl) return null;
  if (company.websiteSource === "manual") return "Added manually";
  if (company.websiteSource === "imported") return "Imported";
  if (company.websiteSource === "pdf_extracted") {
    const page =
      company.websiteSourcePage != null ? ` · Page ${company.websiteSourcePage}` : "";
    return `Extracted from report${page}`;
  }
  return null;
}
