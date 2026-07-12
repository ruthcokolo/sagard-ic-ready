/**
 * Extract reporting contacts (name, email, role) from PDF page text.
 */

import type { CompanyContact } from "./monitoring-phase-types";

export type ExtractedContactSuggestion = {
  name?: string;
  email: string;
  role?: string;
  page?: number;
  evidenceText: string;
  confidence: "high" | "medium" | "low";
};

/**
 * Suggest contacts from PDF text — never auto-email; require confirmation.
 */
export function extractContactSuggestions(
  text: string,
  page = 1
): ExtractedContactSuggestion[] {
  const emailRe = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  const suggestions: ExtractedContactSuggestion[] = [];
  let match: RegExpExecArray | null;
  while ((match = emailRe.exec(text))) {
    const email = match[1];
    const start = Math.max(0, match.index - 80);
    const snippet = text.slice(start, match.index + email.length + 40).replace(/\s+/g, " ");
    const nameGuess = snippet.match(
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s*(?:,|\||-|–)?\s*(?:CFO|VP|Finance|Controller|IR)?/ 
    );
    suggestions.push({
      email,
      name: nameGuess?.[1],
      role: /CFO|VP Finance|Controller|Investor Relations/i.test(snippet)
        ? snippet.match(/CFO|VP Finance|Controller|Investor Relations/i)?.[0]
        : undefined,
      page,
      evidenceText: snippet.trim(),
      confidence: nameGuess ? "medium" : "low",
    });
  }
  const byEmail = new Map<string, ExtractedContactSuggestion>();
  for (const s of suggestions) {
    if (!byEmail.has(s.email.toLowerCase())) byEmail.set(s.email.toLowerCase(), s);
  }
  return [...byEmail.values()];
}

/** Verified contacts for a company. */
export function getConfirmedCompanyContacts(
  contacts: CompanyContact[],
  companyId: string
): CompanyContact[] {
  return contacts.filter((c) => c.companyId === companyId && c.verified);
}

/** Unverified PDF-extracted contact suggestions. */
export function getSuggestedCompanyContacts(
  contacts: CompanyContact[],
  companyId: string
): CompanyContact[] {
  return contacts.filter((c) => c.companyId === companyId && !c.verified);
}

/** Primary reporting contact for a company, if set. */
export function getPrimaryReportingContact(
  contacts: CompanyContact[],
  companyId: string
): CompanyContact | null {
  const confirmed = getConfirmedCompanyContacts(contacts, companyId);
  return (
    confirmed.find((c) => c.isPrimary) ??
    confirmed.find((c) => c.contactType === "primary_reporting") ??
    confirmed[0] ??
    null
  );
}
