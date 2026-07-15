import { DEFAULT_EXTRACTION_RULES } from "./extraction-rules-default";
import { createDefaultCommunicationTemplates } from "./communication-templates";
import { buildSectorDefaultExpectations } from "./metric-expectations";
import {
  PROCESSED_DEMO_SEED,
  PROCESSED_DEMO_SEED_PACKAGE_IDS,
} from "./seed-processed-portfolio.generated";
import type { PortfolioSettings, PortfolioState } from "./types";

export const DEFAULT_PORTFOLIO_SETTINGS: PortfolioSettings = {
  requireHumanValidation: true,
  defaultConfidenceThreshold: "Medium",
  allowedFileType: "PDF",
  assumeSelectableText: true,
  defaultExportFormat: "CSV",
};

/**
 * Default portfolio for first visit / empty state:
 * 6 companies with 12 already-processed PDFs and extracted metrics ready for Metric Review.
 */
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
    companies: PROCESSED_DEMO_SEED.companies.map((c) => ({ ...c })),
    packages: PROCESSED_DEMO_SEED.packages.map((p) => ({ ...p })),
    metrics: PROCESSED_DEMO_SEED.metrics.map((m) => ({ ...m })),
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

export const SEED_PACKAGE_IDS = PROCESSED_DEMO_SEED_PACKAGE_IDS;
