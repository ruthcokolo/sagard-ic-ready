/**
 * Default starting data for a new portfolio: empty companies and reports,
 * plus built-in extraction rules and communication templates.
 */

import { DEFAULT_EXTRACTION_RULES } from "./extraction-rules-default";
import { createDefaultCommunicationTemplates } from "./communication-templates";
import { buildSectorDefaultExpectations } from "./metric-expectations";
import type { PortfolioSettings, PortfolioState } from "./types";

/** Default app settings for a fresh portfolio (validation required, PDF-only uploads). */
export const DEFAULT_PORTFOLIO_SETTINGS: PortfolioSettings = {
  requireHumanValidation: true,
  defaultConfidenceThreshold: "Medium",
  allowedFileType: "PDF",
  assumeSelectableText: true,
  defaultExportFormat: "CSV",
};

/** Empty portfolio — companies and packages appear only after PDF upload. */
export function createSeedPortfolioState(): PortfolioState {
  const sectors = [
    "Enterprise Software",
    "Real Estate",
    "Healthcare Services",
    "Financial Services",
    "Industrial",
    "Consumer",
  ];
  return {
    companies: [],
    packages: [],
    metrics: [],
    metricAuditLog: [],
    assignmentAuditLog: [],
    companyAuditLog: [],
    reviewWaitlist: [],
    companyNotes: [],
    companyFollowUps: [],
    extractionRules: DEFAULT_EXTRACTION_RULES.map((r) => ({ ...r, aliases: [...r.aliases] })),
    exportHistory: [],
    settings: { ...DEFAULT_PORTFOLIO_SETTINGS },
    metricExpectations: sectors.flatMap((s) => buildSectorDefaultExpectations(s)),
    companyContacts: [],
    companyCommunications: [],
    communicationTemplates: createDefaultCommunicationTemplates(),
    companyAliases: [],
    portfolioAuditEvents: [],
  };
}

export const SEED_PACKAGE_IDS = new Set<string>();
