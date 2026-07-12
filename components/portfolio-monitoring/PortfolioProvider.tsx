"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";
import { getSamplePdfForCompany, inferSourceFormatFromFileName } from "@/lib/portfolio/sample-pdf-catalog";
import { downloadCsv, metricsToCsv } from "@/lib/portfolio/csv-export";
import {
  getCompanyPerformanceRows,
  getCoverageByCompany,
  getExtractionTrend,
  getExtractionQualityBySourceFormat,
  getExtractionQualitySummary,
  getPortfolioKpis,
  getRecentPackages,
  getTopMetricsNeedingValidation,
  getValidationSummary,
  needsValidationBadgeCount,
  recomputeCompanies,
  recomputePackages,
} from "@/lib/portfolio/selectors";
import { createSeedPortfolioState } from "@/lib/portfolio/seed-data";
import { createSagardAutoDemoPackage } from "@/lib/portfolio/demo-seed-packages";
import { isDemoReportsEnabled } from "@/lib/portfolio/demo-report-catalog";
import { hashFile } from "@/lib/portfolio/file-hashing";
import { buildDocumentFingerprint } from "@/lib/portfolio/document-fingerprint";
import { createDefaultCommunicationTemplates } from "@/lib/portfolio/communication-templates";
import {
  buildSectorDefaultExpectations,
  mapPortfolioSectorToExpectationKey,
} from "@/lib/portfolio/metric-expectations";
import { normalizeExtractionRules, getMetricUsage } from "@/lib/portfolio/metric-definition-utils";
import type { MetricDataType, MetricValueContext } from "@/lib/portfolio/types";
import { resolveAssignmentPackages } from "@/lib/portfolio/bulk-assignment";
import { buildMetricsFromExtraction, metricRecordId } from "@/lib/portfolio/metric-records";
import {
  collectPdfFilesFromUpload,
  uniquePdfFiles,
} from "@/lib/portfolio/bulk-upload";
import { extractMetricsFromPdfFile } from "@/lib/portfolio/client-extract";
import {
  applyCompanySector,
  createPortfolioCompany,
  ensureCompanyInState,
  parsePdfFileName,
  syncCompaniesWithPackages,
} from "@/lib/portfolio/company-from-upload";
import { normalizeCompanyName } from "@/lib/portfolio/company-normalize";
import {
  applyWebsiteToCompany,
  extractWebsiteFromDocumentText,
  normalizeWebsiteInput,
} from "@/lib/portfolio/company-website";
import { resolveCompanySector } from "@/lib/portfolio/sector-classification";
import { extractContactSuggestions } from "@/lib/portfolio/contact-extraction";
import {
  dedupeMetrics,
  findPackageByCompanyPeriod,
  findPackageByKey,
  migratePortfolioState,
  packageKey,
  periodPackageKey,
  sampleFileName,
} from "@/lib/portfolio/store-utils";
import {
  resolveSourceDownload,
  triggerBlobDownload,
  triggerSourceDownload,
} from "@/lib/portfolio/source-download";
import {
  clearPackagePdfStore,
  deletePackagePdf,
  getPackagePdf,
  putPackagePdf,
} from "@/lib/portfolio/pdf-file-store";
import type {
  AssignmentAuditEntry,
  CompanyAuditEntry,
  CompanyFollowUp,
  CompanyNote,
  ExtractedMetric,
  ExtractionRule,
  MetricAuditAction,
  MetricAuditEntry,
  MetricName,
  PortfolioCompany,
  PortfolioSettings,
  PortfolioState,
  ReportingPackage,
  ReviewPriority,
  ReviewWaitlistItem,
} from "@/lib/portfolio/types";
import { ALL_METRICS } from "@/lib/portfolio/types";

const STORAGE_KEY = "icready-portfolio-state";
const REVIEWER = "Alex Rivera";

type EditMetricInput = {
  extractedValue: string;
  normalizedValue: number | null;
  unit: string;
  evidenceText: string;
  approve?: boolean;
};

function createAuditEntry(
  metric: ExtractedMetric,
  action: MetricAuditAction,
  previousStatus: ExtractedMetric["status"],
  newStatus: ExtractedMetric["status"],
  patch: Partial<MetricAuditEntry> = {}
): MetricAuditEntry {
  return {
    id: uid("audit"),
    metricId: metric.id,
    packageId: metric.packageId,
    companyId: metric.companyId,
    metricName: metric.metricName,
    action,
    previousStatus,
    newStatus,
    originalValue: metric.originalExtractedValue ?? metric.extractedValue,
    finalValue: patch.finalValue ?? metric.extractedValue,
    unit: patch.unit ?? metric.unit,
    reviewer: REVIEWER,
    timestamp: new Date().toISOString(),
    sourcePage: metric.sourcePage,
    ...patch,
  };
}

type PortfolioContextValue = {
  hydrated: boolean;
  state: PortfolioState;
  kpis: ReturnType<typeof getPortfolioKpis>;
  validationSummary: ReturnType<typeof getValidationSummary>;
  extractionTrend: ReturnType<typeof getExtractionTrend>;
  companyPerformance: ReturnType<typeof getCompanyPerformanceRows>;
  topMetricsNeedingValidation: ReturnType<typeof getTopMetricsNeedingValidation>;
  coverageByCompany: ReturnType<typeof getCoverageByCompany>;
  recentPackages: ReturnType<typeof getRecentPackages>;
  extractionQualityBySourceFormat: ReturnType<typeof getExtractionQualityBySourceFormat>;
  extractionQualitySummary: ReturnType<typeof getExtractionQualitySummary>;
  needsValidationCount: number;
  uploadAndProcessPdf: (input: {
    file: File | null;
    companyId?: string;
    reportPeriod?: string;
    useSample?: boolean;
    sampleSource?: "company-formatted" | "template";
    sourceFormatOverride?: "Company-formatted PDF" | "ICReady template";
    fileHash?: string;
    asVersion?: boolean;
    replacePackageId?: string;
    previousPackageId?: string;
  }) => Promise<{ success: boolean; message: string; packageId?: string; reprocessed?: boolean }>;
  processBulkUpload: (files: File[]) => Promise<{
    success: boolean;
    message: string;
    processed: number;
    failed: number;
    total: number;
  }>;
  /** Demo-only: seed Sagard Auto package so re-upload of sagard auto report.pdf duplicates. */
  ensureDemoSagardAutoPackage: () => Promise<ReportingPackage[]>;
  upsertMetricExpectation: (
    expectation: import("@/lib/portfolio/monitoring-phase-types").MetricExpectation,
    options?: {
      previousRequirement?: string;
      eventType?: string;
    }
  ) => void;
  removeCompanyMetricOverride: (input: {
    companyId: string;
    metricName: string;
    actorName: string;
    previousRequirement?: string;
    previousRationale?: string;
    sectorDefaultRequirement?: string;
  }) => void;
  saveCommunicationTemplate: (
    template: import("@/lib/portfolio/monitoring-phase-types").CommunicationTemplate
  ) => void;
  saveCompanyCommunication: (
    communication: import("@/lib/portfolio/monitoring-phase-types").CompanyCommunication
  ) => void;
  upsertCompanyContact: (
    contact: import("@/lib/portfolio/monitoring-phase-types").CompanyContact
  ) => void;
  approveMetric: (id: string) => void;
  editMetric: (id: string, input: EditMetricInput) => void;
  rejectMetric: (id: string, reason?: string) => void;
  markMetricMissing: (id: string, reason?: string) => void;
  bulkApproveMetrics: (ids: string[]) => void;
  bulkRejectMetrics: (ids: string[], reason?: string) => void;
  bulkMarkMetricsMissing: (ids: string[], reason?: string) => void;
  updateExtractionRule: (metricName: string, patch: Partial<ExtractionRule>) => void;
  addAlias: (metricName: string, alias: string) => void;
  removeAlias: (metricName: string, alias: string) => void;
  upsertMetricDefinition: (input: {
    originalName?: string;
    metricName: string;
    description?: string;
    type: MetricDataType;
    expectedUnit: string;
    enabled: boolean;
    aliases: string[];
    matchingGuidance?: string;
    supportedContexts: MetricValueContext[];
    actorName: string;
  }) => { success: boolean; message: string };
  setMetricDefinitionEnabled: (input: {
    metricName: string;
    enabled: boolean;
    actorName: string;
  }) => { success: boolean; message: string };
  deleteMetricDefinition: (input: {
    metricName: string;
    actorName: string;
  }) => { success: boolean; message: string };
  exportCsv: (options?: {
    metricIds?: string[];
    includeNeedsValidation?: boolean;
    exportName?: string;
  }) => { success: boolean; message: string };
  updateSettings: (patch: Partial<PortfolioSettings>) => void;
  resetDemoData: () => void;
  clearUploadedPackages: () => void;
  deletePackage: (packageId: string) => void;
  assignPackageToReviewer: (
    packageId: string,
    reviewerId: string,
    reviewerName: string
  ) => void;
  updatePackageReviewMeta: (
    packageId: string,
    patch: {
      dueDate?: string | null;
      reviewPriority?: ReviewPriority;
      assignedReviewerId?: string | null;
      assignedReviewerName?: string | null;
    }
  ) => void;
  assignReviewPackagesBatch: (payload: {
    companyIds: string[];
    packageScope: "latest_active" | "all_active";
    reviewerId: string | null;
    reviewerName: string | null;
    dueDate?: string | null;
    priority?: ReviewPriority | "keep_existing";
    note?: string;
    assignedById: string;
    assignedByName: string;
    canAssign: boolean;
  }) => {
    success: boolean;
    message: string;
    batchId: string | null;
    assignedCount: number;
    failed: { companyId: string; reason: string }[];
  };
  restoreAssignmentBatch: (batchId: string) => { success: boolean; message: string };
  addToReviewWaitlist: (input: {
    packageId: string;
    companyId: string;
    scheduledDate: string;
    priority: ReviewPriority;
    assignedReviewerId: string;
    assignedReviewerName: string;
    note?: string;
    reminder: boolean;
    createdBy: string;
  }) => { success: boolean; message: string };
  updateReviewWaitlistItem: (
    id: string,
    patch: Partial<
      Pick<
        ReviewWaitlistItem,
        | "scheduledDate"
        | "priority"
        | "assignedReviewerId"
        | "assignedReviewerName"
        | "note"
        | "reminder"
      >
    >
  ) => void;
  removeFromReviewWaitlist: (packageId: string) => void;
  /** Instantly download the source PDF for a package. Returns false if unavailable. */
  downloadPackagePdf: (packageId: string) => boolean;
  /** Resolve a temporary object URL or catalog path for preview/download UI. */
  resolvePackagePdfUrl: (packageId: string) => string | null;
  addCompanyNote: (input: {
    companyId: string;
    authorId: string;
    authorName: string;
    body: string;
    linkedPackageId?: string;
  }) => void;
  updateCompanyNote: (id: string, body: string) => void;
  deleteCompanyNote: (id: string) => void;
  addCompanyFollowUp: (input: {
    companyId: string;
    title: string;
    category: string;
    source: string;
    sourcePage?: number;
    priority: ReviewPriority;
    ownerId?: string;
    ownerName?: string;
    dueDate?: string;
    linkedPackageId?: string;
    notes?: string;
    createdBy: string;
  }) => void;
  updateCompanyFollowUp: (
    id: string,
    patch: Partial<
      Pick<
        CompanyFollowUp,
        | "title"
        | "priority"
        | "ownerId"
        | "ownerName"
        | "dueDate"
        | "status"
        | "notes"
        | "resolvedAt"
      >
    >
  ) => void;
  updateCompanyProfile: (
    companyId: string,
    patch: Partial<
      Pick<
        PortfolioCompany,
        | "investmentDate"
        | "reportingFrequency"
        | "assignedAssociateId"
        | "assignedAssociateName"
        | "nextExpectedReportDate"
        | "status"
        | "sector"
        | "websiteUrl"
        | "websiteDomain"
        | "websiteSource"
        | "websiteConfidence"
        | "descriptor"
        | "name"
      >
    >
  ) => void;
  addCompany: (input: {
    name: string;
    sector: string;
    websiteUrl?: string;
    status?: PortfolioCompany["status"];
    reportingFrequency?: PortfolioCompany["reportingFrequency"];
    assignedAssociateId?: string;
    assignedAssociateName?: string;
    notes?: string;
    duplicateOverride?: boolean;
    matchedCompanyIds?: string[];
  }) => { success: boolean; message: string; companyId?: string };
  resolveWebsiteConflict: (
    companyId: string,
    decision: "keep" | "replace"
  ) => void;
  getCompanyById: (id: string) => PortfolioState["companies"][number] | undefined;
  getMetricsForCompany: (companyId: string) => ExtractedMetric[];
  getPackagesForCompany: (companyId: string) => ReportingPackage[];
};

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function withPhaseDefaults(state: PortfolioState): PortfolioState {
  const seed = createSeedPortfolioState();
  return {
    ...state,
    extractionRules: normalizeExtractionRules(
      state.extractionRules?.length ? state.extractionRules : seed.extractionRules
    ),
    metricExpectations: state.metricExpectations?.length
      ? state.metricExpectations
      : seed.metricExpectations,
    companyContacts: state.companyContacts ?? [],
    companyCommunications: state.companyCommunications ?? [],
    communicationTemplates: state.communicationTemplates?.length
      ? state.communicationTemplates
      : seed.communicationTemplates,
    companyAliases: state.companyAliases ?? [],
    portfolioAuditEvents: state.portfolioAuditEvents ?? [],
  };
}

function loadState(): PortfolioState {
  if (typeof window === "undefined") return createSeedPortfolioState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedPortfolioState();
    const parsed = JSON.parse(raw) as PortfolioState;
    const merged: PortfolioState = {
      companies: parsed.companies ?? createSeedPortfolioState().companies,
      packages: parsed.packages ?? createSeedPortfolioState().packages,
      metrics: parsed.metrics ?? createSeedPortfolioState().metrics,
      metricAuditLog: parsed.metricAuditLog ?? [],
      assignmentAuditLog: parsed.assignmentAuditLog ?? [],
      companyAuditLog: parsed.companyAuditLog ?? [],
      reviewWaitlist: parsed.reviewWaitlist ?? [],
      companyNotes: parsed.companyNotes ?? [],
      companyFollowUps: parsed.companyFollowUps ?? [],
      extractionRules: parsed.extractionRules ?? createSeedPortfolioState().extractionRules,
      exportHistory: parsed.exportHistory ?? [],
      settings: { ...createSeedPortfolioState().settings, ...parsed.settings },
      metricExpectations: parsed.metricExpectations,
      companyContacts: parsed.companyContacts,
      companyCommunications: parsed.companyCommunications,
      communicationTemplates: parsed.communicationTemplates,
      companyAliases: parsed.companyAliases,
      portfolioAuditEvents: parsed.portfolioAuditEvents,
    };
    return withPhaseDefaults(migratePortfolioState(merged));
  } catch {
    return createSeedPortfolioState();
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyDerived(state: PortfolioState): PortfolioState {
  const migrated = withPhaseDefaults(migratePortfolioState(state));
  migrated.packages = recomputePackages(migrated);
  const synced = syncCompaniesWithPackages(migrated.companies, migrated.packages);
  migrated.companies = recomputeCompanies({ ...migrated, companies: synced });
  return migrated;
}

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<PortfolioState>(createSeedPortfolioState);
  const [hydrated, setHydrated] = useState(false);
  const processingKeysRef = useRef(new Set<string>());
  const pdfFilesByKeyRef = useRef(new Map<string, File>());
  const extractionRulesRef = useRef(state.extractionRules);
  const metricExpectationsRef = useRef(state.metricExpectations);
  const stateRef = useRef(state);
  const companiesRef = useRef(state.companies);
  extractionRulesRef.current = state.extractionRules;
  metricExpectationsRef.current = state.metricExpectations;
  stateRef.current = state;
  companiesRef.current = state.companies;

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      const next = loadState();
      if (cancelled) return;
      setState(next);

      // Restore package PDFs from IndexedDB (and warm catalog copies into memory).
      await Promise.all(
        next.packages.map(async (pkg) => {
          const key = packageKey(pkg);
          const stored = await getPackagePdf(key);
          if (stored) {
            pdfFilesByKeyRef.current.set(key, stored);
            return;
          }
          const resolved = resolveSourceDownload({
            sourceFile: pkg.fileName,
            companyId: pkg.companyId,
          });
          if (!resolved.url) return;
          try {
            const res = await fetch(resolved.url);
            if (!res.ok) return;
            const blob = await res.blob();
            const file = new File([blob], pkg.fileName || resolved.fileName, {
              type: "application/pdf",
            });
            pdfFilesByKeyRef.current.set(key, file);
            await putPackagePdf(key, file);
          } catch {
            /* catalog fetch optional */
          }
        })
      );

      if (!cancelled) setHydrated(true);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const setDerived = useCallback((updater: (prev: PortfolioState) => PortfolioState) => {
    setState((prev) => applyDerived(updater(prev)));
  }, []);

  const uploadAndProcessPdf = useCallback(
    async (input: {
      file: File | null;
      companyId?: string;
      reportPeriod?: string;
      useSample?: boolean;
      sampleSource?: "company-formatted" | "template";
      sourceFormatOverride?: "Company-formatted PDF" | "ICReady template";
      fileHash?: string;
      asVersion?: boolean;
      replacePackageId?: string;
      previousPackageId?: string;
    }) => {
      const sampleSource = input.sampleSource ?? "company-formatted";
      const catalogForSample = input.useSample
        ? getSamplePdfForCompany(input.companyId ?? "", sampleSource)
        : undefined;

      if (input.useSample && !catalogForSample) {
        return {
          success: false,
          message: "Select a sample company with a bundled PDF catalog entry.",
        };
      }

      const parsedFromFile =
        !input.useSample && input.file ? parsePdfFileName(input.file.name) : null;

      const selectedCompany =
        !input.useSample && input.companyId
          ? companiesRef.current.find((c) => c.id === input.companyId)
          : undefined;

      const companyName = input.useSample
        ? catalogForSample!.companyName
        : selectedCompany?.name ?? parsedFromFile?.companyName ?? "Unknown Company";

      const effectivePeriod = input.useSample
        ? catalogForSample!.reportPeriod
        : input.reportPeriod || parsedFromFile?.reportPeriod || "Q2 2026";

      const ensured = selectedCompany
        ? { company: selectedCompany, companies: companiesRef.current }
        : ensureCompanyInState(companiesRef.current, companyName);
      const company = ensured.company;

      if (!selectedCompany && ensured.companies.length !== companiesRef.current.length) {
        companiesRef.current = ensured.companies;
        setDerived((prev) => ({
          ...prev,
          companies: ensureCompanyInState(prev.companies, companyName).companies,
        }));
      }

      const companyId = input.useSample
        ? catalogForSample!.companyId
        : selectedCompany?.id ?? input.companyId ?? company.id;

      const fileName = input.useSample
        ? catalogForSample!.fileName
        : (input.file?.name ?? sampleFileName(company.name, effectivePeriod));

      const initialSourceFormat =
        catalogForSample?.sourceFormat ?? inferSourceFormatFromFileName(fileName);

      const key = packageKey({
        companyId,
        reportPeriod: effectivePeriod,
        fileName,
      });
      const periodKey = periodPackageKey({
        companyId,
        reportPeriod: effectivePeriod,
      });

      if (
        processingKeysRef.current.has(key) ||
        processingKeysRef.current.has(periodKey)
      ) {
        return { success: false, message: "This package is already processing. Please wait." };
      }
      processingKeysRef.current.add(key);
      processingKeysRef.current.add(periodKey);

      let packageId = "";
      let isReprocess = false;

      try {
        const now = new Date().toISOString();

        setDerived((prev) => {
          const existing =
            findPackageByKey(prev.packages, key) ??
            findPackageByCompanyPeriod(prev.packages, companyId, effectivePeriod);
          const forceNewVersion = Boolean(input.asVersion || input.replacePackageId);
          isReprocess = !!existing && !forceNewVersion;
          packageId = isReprocess ? existing!.id : uid("pkg");

          if (isReprocess) {
            return {
              ...prev,
              packages: prev.packages.map((p) =>
                p.id === packageId
                  ? {
                      ...p,
                      status: "Processing" as const,
                      errorMessage: undefined,
                      pagesProcessed: 0,
                      fileName,
                      fileHash: input.fileHash ?? p.fileHash,
                      fileSize: input.file?.size ?? p.fileSize,
                    }
                  : p
              ),
            };
          }

          return {
            ...prev,
            packages: [
              {
                id: packageId,
                companyId,
                companyName: company.name,
                fileName,
                reportPeriod: effectivePeriod,
                uploadedAt: now,
                processedAt: undefined,
                runCount: 1,
                status: "Processing",
                pagesProcessed: 0,
                metricsExtracted: 0,
                needsValidation: 0,
                missingMetrics: 0,
                coverage: 0,
                sourceFormat: initialSourceFormat,
                fileHash: input.fileHash,
                fileSize: input.file?.size,
                versionNumber: input.asVersion || input.previousPackageId ? 2 : 1,
                previousPackageId: input.previousPackageId ?? input.replacePackageId,
                relationship: input.replacePackageId
                  ? ("replacement" as const)
                  : input.asVersion || input.previousPackageId
                    ? ("revision" as const)
                    : ("original" as const),
                activeVersion: true,
                versionGroupId:
                  input.previousPackageId ?? input.replacePackageId ?? packageId,
              },
              ...prev.packages.map((p) =>
                p.id === input.previousPackageId || p.id === input.replacePackageId
                  ? {
                      ...p,
                      activeVersion: false,
                      relationship: "superseded" as const,
                    }
                  : p
              ),
            ],
          };
        });

        let pdfFile = input.file;

        if (input.useSample) {
          const catalog = catalogForSample!;
          const res = await fetch(catalog.publicPath);
          if (!res.ok) {
            setDerived((prev) => ({
              ...prev,
              packages: prev.packages.map((p) =>
                p.id === packageId
                  ? {
                      ...p,
                      status: "Failed" as const,
                      errorMessage: "Sample PDF not found.",
                    }
                  : p
              ),
            }));
            return {
              success: false,
              message: "Sample PDF not found. Run npm run generate:sample-pdfs first.",
            };
          }
          const blob = await res.blob();
          pdfFile = new File([blob], catalog.fileName, { type: "application/pdf" });
        } else if (!pdfFile) {
          pdfFile = pdfFilesByKeyRef.current.get(key) ?? null;
        }

        if (!pdfFile) {
          setDerived((prev) => ({
            ...prev,
            packages: prev.packages.map((p) =>
              p.id === packageId
                ? {
                    ...p,
                    status: "Failed" as const,
                    errorMessage: "Upload a PDF or load a sample PDF.",
                  }
                : p
            ),
          }));
          return { success: false, message: "Upload a PDF or load a sample PDF." };
        }

        let resolvedHash = input.fileHash;
        if (!resolvedHash) {
          try {
            resolvedHash = await hashFile(pdfFile);
          } catch {
            /* hash optional for legacy paths */
          }
        }

        const extraction = await extractMetricsFromPdfFile(
          pdfFile,
          extractionRulesRef.current,
          company.name
        );
        pdfFilesByKeyRef.current.set(key, pdfFile);
        void putPackagePdf(key, pdfFile);

        const documentFingerprint = extraction.documentText
          ? buildDocumentFingerprint(extraction.documentText)
          : undefined;

        const candidates = extraction.candidates;
        const missing = extraction.missingMetrics;
        const pagesProcessed = extraction.pagesProcessed;
        const sourceFormat = input.sourceFormatOverride ?? extraction.sourceFormat;
        const classifiedSector = resolveCompanySector({
          companyId,
          companyName: company.name,
          documentText: extraction.documentText ?? "",
        });
        // Only hard-fail when the PDF itself could not be read.
        // A readable PDF with no matched metrics should still Process so
        // missing metrics appear in Metric Review (demo goal: packages pass).
        const readFailed =
          pagesProcessed === 0 &&
          !(extraction.documentText && extraction.documentText.trim().length > 0);
        const extractionFailed = readFailed;
        const failureMessage = "PDF could not be read. Try re-uploading the file.";
        const noMetricsWarning =
          candidates.length === 0
            ? "No metrics were matched in this PDF. Missing expected metrics were queued for review."
            : undefined;
        const warning = input.useSample
          ? sourceFormat === "ICReady template"
            ? "Extracted from ICReady template PDF with standardized fields."
            : "Extracted from bundled sample PDF with selectable text."
          : extraction.warning ?? noMetricsWarning;

        const expectationSector = mapPortfolioSectorToExpectationKey(
          classifiedSector || company.sector || "Enterprise Software"
        );
        const newMetrics = buildMetricsFromExtraction(
          packageId,
          companyId,
          company.name,
          effectivePeriod,
          fileName,
          candidates,
          missing,
          {
            expectations: metricExpectationsRef.current ?? [],
            sector: expectationSector,
            knownMetrics: (extractionRulesRef.current ?? []).map((r) => r.metricName),
          }
        );

        const processedAt = new Date().toISOString();
        const finalStatus = extractionFailed ? ("Failed" as const) : ("Processed" as const);

        setDerived((prev) => {
          const survivor =
            findPackageByKey(prev.packages, key) ??
            prev.packages.find((p) => p.id === packageId);
          const targetId = survivor?.id ?? packageId;

          const metricsForPackage = newMetrics.map((metric) => ({
            ...metric,
            packageId: targetId,
            companyId,
            companyName: company.name,
            id: metricRecordId(targetId, metric.metricName),
          }));

          const extractedWebsite = extractWebsiteFromDocumentText(
            extraction.documentText ?? "",
            company.name
          );
          const companyAudits: CompanyAuditEntry[] = [];
          const companies = prev.companies.map((c) => {
            if (c.id !== companyId) return c;
            let next = applyCompanySector(c, classifiedSector, true);
            if (extractedWebsite) {
              const applied = applyWebsiteToCompany(next, {
                url: extractedWebsite.url,
                domain: extractedWebsite.domain,
                source: "pdf_extracted",
                confidence: extractedWebsite.confidence,
                packageId: targetId,
                page: extractedWebsite.sourcePage,
                evidence: extractedWebsite.evidenceText,
              });
              next = applied.company;
              if (applied.outcome === "saved") {
                companyAudits.push({
                  id: uid("caudit"),
                  companyId,
                  action: "website_extracted",
                  timestamp: processedAt,
                  actorName: REVIEWER,
                  details: {
                    websiteUrl: extractedWebsite.url,
                    packageId: targetId,
                    page: extractedWebsite.sourcePage,
                  },
                });
              } else if (applied.outcome === "conflict") {
                companyAudits.push({
                  id: uid("caudit"),
                  companyId,
                  action: "website_conflict",
                  timestamp: processedAt,
                  actorName: REVIEWER,
                  details: {
                    pendingWebsiteUrl: extractedWebsite.url,
                    packageId: targetId,
                  },
                });
              }
            }
            return next;
          });

          const existingContacts = prev.companyContacts ?? [];
          const contactSuggestions = extractContactSuggestions(
            extraction.documentText ?? "",
            1
          );
          const newContacts = [...existingContacts];
          for (const suggestion of contactSuggestions.slice(0, 3)) {
            const email = suggestion.email.toLowerCase();
            if (newContacts.some((c) => c.companyId === companyId && c.email.toLowerCase() === email)) {
              continue;
            }
            const nowIso = processedAt;
            newContacts.push({
              id: uid("contact"),
              companyId,
              name: suggestion.name ?? suggestion.email.split("@")[0],
              email: suggestion.email,
              role: suggestion.role,
              contactType: "primary_reporting",
              isPrimary: false,
              source: "pdf_extracted",
              sourcePackageId: targetId,
              sourcePage: suggestion.page,
              sourceEvidence: suggestion.evidenceText,
              verified: false,
              createdAt: nowIso,
              updatedAt: nowIso,
            });
          }

          return {
            ...prev,
            companies,
            companyContacts: newContacts,
            companyAuditLog: [...(prev.companyAuditLog ?? []), ...companyAudits],
            packages: prev.packages.map((p) =>
              p.id === targetId
                ? {
                    ...p,
                    status: finalStatus,
                    processedAt,
                    pagesProcessed,
                    sourceFormat,
                    fileHash: resolvedHash ?? p.fileHash,
                    fileSize: pdfFile?.size ?? p.fileSize,
                    documentFingerprint: documentFingerprint ?? p.documentFingerprint,
                    errorMessage: extractionFailed
                      ? (warning ?? failureMessage)
                      : undefined,
                    runCount: isReprocess ? (p.runCount ?? 1) + 1 : 1,
                  }
                : p
            ),
            metrics: dedupeMetrics([
              ...prev.metrics.filter((m) => m.packageId !== targetId),
              ...metricsForPackage,
            ]),
          };
        });

        if (extractionFailed) {
          return {
            success: false,
            message: warning ?? failureMessage,
            packageId,
          };
        }

        if (isReprocess) {
          return {
            success: true,
            reprocessed: true,
            message: warning ?? "Package reprocessed. Existing extraction results were refreshed.",
            packageId,
          };
        }

        return {
          success: true,
          message:
            warning ??
            `Extracted ${candidates.length} metric${candidates.length === 1 ? "" : "s"}. Review suggested values in Metric Review.`,
          packageId,
        };
      } catch (error) {
        const fallbackMessage =
          error instanceof Error ? error.message : "Processing encountered an issue";

        if (packageId) {
          setDerived((prev) => ({
            ...prev,
            packages: prev.packages.map((p) =>
              p.id === packageId
                ? {
                    ...p,
                    status: "Failed" as const,
                    processedAt: new Date().toISOString(),
                    pagesProcessed: 0,
                    errorMessage: fallbackMessage,
                  }
                : p
            ),
          }));

          return { success: false, message: fallbackMessage, packageId };
        }

        return { success: false, message: fallbackMessage };
      } finally {
        processingKeysRef.current.delete(key);
        processingKeysRef.current.delete(periodKey);
      }
    },
    [setDerived]
  );

  const ensureDemoSagardAutoPackage = useCallback(async () => {
    if (!isDemoReportsEnabled()) {
      return state.packages;
    }
    let packages = state.packages;
    const existing = packages.find((p) => p.id === "pkg-sagard-auto-q2-2026");
    if (existing?.fileHash) {
      return packages;
    }

    const seeded = createSagardAutoDemoPackage(REVIEWER);
    let fileHash = existing?.fileHash;
    try {
      const res = await fetch(
        "/demo-reports/company-formatted/Sagard-Auto/sagard auto report.pdf"
      );
      if (res.ok) {
        const blob = await res.blob();
        fileHash = await hashFile(blob);
      }
    } catch {
      /* demo PDF may not be generated yet */
    }

    const pkg = {
      ...seeded.package,
      ...existing,
      fileHash: fileHash ?? existing?.fileHash,
    };

    setDerived((prev) => {
      const hasCompany = prev.companies.some((c) => c.id === seeded.company.id);
      const hasPkg = prev.packages.some((p) => p.id === pkg.id);
      return {
        ...prev,
        companies: hasCompany ? prev.companies : [seeded.company, ...prev.companies],
        packages: hasPkg
          ? prev.packages.map((p) => (p.id === pkg.id ? { ...p, ...pkg } : p))
          : [pkg, ...prev.packages],
        communicationTemplates:
          prev.communicationTemplates?.length
            ? prev.communicationTemplates
            : createDefaultCommunicationTemplates(),
        metricExpectations:
          prev.metricExpectations?.length
            ? prev.metricExpectations
            : buildSectorDefaultExpectations("Industrial"),
      };
    });

    packages = [pkg, ...packages.filter((p) => p.id !== pkg.id)];
    return packages;
  }, [setDerived, state.packages]);

  const upsertMetricExpectation = useCallback(
    (
      expectation: import("@/lib/portfolio/monitoring-phase-types").MetricExpectation,
      options?: { previousRequirement?: string; eventType?: string }
    ) => {
      if (expectation.companyId) {
        if (!hasPortfolioPermission(user?.role, "canEditCompanyOverrides")) return;
      } else if (!hasPortfolioPermission(user?.role, "canEditMetricExpectations")) {
        return;
      }
      setDerived((prev) => {
        const list = prev.metricExpectations ?? [];
        const idx = list.findIndex((e) => {
          if (expectation.companyId) {
            return (
              e.companyId === expectation.companyId &&
              e.metricName.toLowerCase() === expectation.metricName.toLowerCase()
            );
          }
          return (
            !e.companyId &&
            e.sector === expectation.sector &&
            e.metricName.toLowerCase() === expectation.metricName.toLowerCase()
          );
        });
        const previous = idx >= 0 ? list[idx] : undefined;
        const next =
          idx >= 0
            ? list.map((e, i) => (i === idx ? expectation : e))
            : [...list, expectation];
        const eventType =
          options?.eventType ??
          (expectation.companyId
            ? previous
              ? "company_override_updated"
              : "company_override_created"
            : "sector_requirement_updated");
        return {
          ...prev,
          metricExpectations: next,
          portfolioAuditEvents: [
            {
              id: uid("aud"),
              entityType: "expectation",
              entityId: expectation.id,
              eventType,
              actorId: user?.id ?? "user",
              actorName: expectation.configuredBy ?? user?.name,
              timestamp: new Date().toISOString(),
              metadata: {
                metricName: expectation.metricName,
                companyId: expectation.companyId,
                sector: expectation.sector,
                requirement: expectation.requirement,
                previousRequirement:
                  options?.previousRequirement ?? previous?.requirement,
                rationale: expectation.reason,
                previousRationale: previous?.reason,
                reasonSource: expectation.reasonSource,
              },
            },
            ...(prev.portfolioAuditEvents ?? []),
          ],
        };
      });
    },
    [setDerived, user?.id, user?.name, user?.role]
  );

  const removeCompanyMetricOverride = useCallback(
    (input: {
      companyId: string;
      metricName: string;
      actorName: string;
      previousRequirement?: string;
      previousRationale?: string;
      sectorDefaultRequirement?: string;
    }) => {
      if (!hasPortfolioPermission(user?.role, "canResetCompanyOverrides")) return;
      setDerived((prev) => {
        const list = prev.metricExpectations ?? [];
        const existing = list.find(
          (e) =>
            e.companyId === input.companyId &&
            e.metricName.toLowerCase() === input.metricName.toLowerCase()
        );
        if (!existing) return prev;
        return {
          ...prev,
          metricExpectations: list.filter((e) => e.id !== existing.id),
          portfolioAuditEvents: [
            {
              id: uid("aud"),
              entityType: "expectation",
              entityId: existing.id,
              eventType: "company_override_removed",
              actorId: user?.id ?? "user",
              actorName: input.actorName,
              timestamp: new Date().toISOString(),
              metadata: {
                metricName: input.metricName,
                companyId: input.companyId,
                previousRequirement: input.previousRequirement ?? existing.requirement,
                previousRationale: input.previousRationale ?? existing.reason,
                newRequirement: input.sectorDefaultRequirement,
                requirement: input.sectorDefaultRequirement,
              },
            },
            ...(prev.portfolioAuditEvents ?? []),
          ],
        };
      });
    },
    [setDerived, user?.id, user?.role]
  );

  const saveCommunicationTemplate = useCallback(
    (template: import("@/lib/portfolio/monitoring-phase-types").CommunicationTemplate) => {
      setDerived((prev) => {
        const list = prev.communicationTemplates ?? createDefaultCommunicationTemplates();
        const idx = list.findIndex((t) => t.id === template.id || t.category === template.category);
        const next =
          idx >= 0 ? list.map((t, i) => (i === idx ? template : t)) : [...list, template];
        return {
          ...prev,
          communicationTemplates: next,
          portfolioAuditEvents: [
            {
              id: uid("aud"),
              entityType: "template",
              entityId: template.id,
              eventType: "template_edited",
              actorId: "user",
              actorName: template.updatedBy,
              timestamp: new Date().toISOString(),
            },
            ...(prev.portfolioAuditEvents ?? []),
          ],
        };
      });
    },
    [setDerived]
  );

  const saveCompanyCommunication = useCallback(
    (communication: import("@/lib/portfolio/monitoring-phase-types").CompanyCommunication) => {
      setDerived((prev) => {
        const list = prev.companyCommunications ?? [];
        const idx = list.findIndex((c) => c.id === communication.id);
        const next =
          idx >= 0
            ? list.map((c, i) => (i === idx ? communication : c))
            : [communication, ...list];
        return { ...prev, companyCommunications: next };
      });
    },
    [setDerived]
  );

  const upsertCompanyContact = useCallback(
    (contact: import("@/lib/portfolio/monitoring-phase-types").CompanyContact) => {
      setDerived((prev) => {
        const list = prev.companyContacts ?? [];
        const idx = list.findIndex((c) => c.id === contact.id);
        const next =
          idx >= 0 ? list.map((c, i) => (i === idx ? contact : c)) : [...list, contact];
        return { ...prev, companyContacts: next };
      });
    },
    [setDerived]
  );

  const processBulkUpload = useCallback(
    async (files: File[]) => {
      let pdfs: File[];
      try {
        pdfs = uniquePdfFiles(await collectPdfFilesFromUpload(files));
      } catch {
        return {
          success: false,
          message: "Could not read one or more ZIP archives.",
          processed: 0,
          failed: files.length,
          total: 0,
        };
      }

      if (pdfs.length === 0) {
        return {
          success: false,
          message: "No PDF files found. Upload PDFs, a ZIP of PDFs, or a folder of PDFs.",
          processed: 0,
          failed: 0,
          total: 0,
        };
      }

      let processed = 0;
      let failed = 0;

      for (const file of pdfs) {
        const { companyName, reportPeriod } = parsePdfFileName(file.name);
        const result = await uploadAndProcessPdf({
          file,
          reportPeriod,
          useSample: false,
        });
        if (result.success) processed += 1;
        else failed += 1;
      }

      const allSucceeded = failed === 0;
      return {
        success: processed > 0,
        processed,
        failed,
        total: pdfs.length,
        message: allSucceeded
          ? `Processed ${processed} package${processed === 1 ? "" : "s"}. Metrics need validation.`
          : `Processed ${processed} of ${pdfs.length} package${pdfs.length === 1 ? "" : "s"}.${failed > 0 ? ` ${failed} could not be queued.` : ""}`,
      };
    },
    [uploadAndProcessPdf]
  );

  const approveMetric = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setDerived((prev) => {
        const metric = prev.metrics.find((m) => m.id === id);
        if (!metric) return prev;
        const audit = createAuditEntry(
          metric,
          "approved",
          metric.status,
          "Approved for reporting",
          { finalValue: metric.extractedValue, timestamp: now }
        );
        return {
          ...prev,
          metrics: prev.metrics.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: "Approved for reporting" as const,
                  reviewedBy: REVIEWER,
                  reviewedAt: now,
                }
              : m
          ),
          metricAuditLog: [audit, ...prev.metricAuditLog],
        };
      });
    },
    [setDerived]
  );

  const editMetric = useCallback(
    (id: string, input: EditMetricInput) => {
      const now = new Date().toISOString();
      setDerived((prev) => {
        const metric = prev.metrics.find((m) => m.id === id);
        if (!metric) return prev;
        const newStatus = input.approve
          ? ("Approved for reporting" as const)
          : ("Needs validation" as const);
        const audit = createAuditEntry(metric, "edited", metric.status, newStatus, {
          finalValue: input.extractedValue,
          unit: input.unit,
          timestamp: now,
        });
        return {
          ...prev,
          metrics: prev.metrics.map((m) =>
            m.id === id
              ? {
                  ...m,
                  extractedValue: input.extractedValue,
                  normalizedValue: input.normalizedValue,
                  unit: input.unit,
                  evidenceText: input.evidenceText,
                  status: newStatus,
                  originalExtractedValue:
                    m.originalExtractedValue ?? m.extractedValue,
                  originalNormalizedValue:
                    m.originalNormalizedValue ?? m.normalizedValue,
                  reviewedBy: input.approve ? REVIEWER : m.reviewedBy,
                  reviewedAt: input.approve ? now : m.reviewedAt,
                }
              : m
          ),
          metricAuditLog: [audit, ...prev.metricAuditLog],
        };
      });
    },
    [setDerived]
  );

  const rejectMetric = useCallback(
    (id: string, reason?: string) => {
      const now = new Date().toISOString();
      setDerived((prev) => {
        const metric = prev.metrics.find((m) => m.id === id);
        if (!metric) return prev;
        const audit = createAuditEntry(metric, "rejected", metric.status, "Rejected", {
          reason,
          timestamp: now,
        });
        return {
          ...prev,
          metrics: prev.metrics.map((m) =>
            m.id === id
              ? { ...m, status: "Rejected" as const, reviewedBy: REVIEWER, reviewedAt: now }
              : m
          ),
          metricAuditLog: [audit, ...prev.metricAuditLog],
        };
      });
    },
    [setDerived]
  );

  const markMetricMissing = useCallback(
    (id: string, reason?: string) => {
      const now = new Date().toISOString();
      setDerived((prev) => {
        const metric = prev.metrics.find((m) => m.id === id);
        if (!metric) return prev;
        const audit = createAuditEntry(
          metric,
          "marked_missing",
          metric.status,
          "Missing from report",
          { reason, finalValue: "", timestamp: now }
        );
        return {
          ...prev,
          metrics: prev.metrics.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: "Missing from report" as const,
                  extractedValue: "",
                  normalizedValue: null,
                  evidenceText: `${m.metricName} marked as missing from report.`,
                  reviewedBy: REVIEWER,
                  reviewedAt: now,
                }
              : m
          ),
          metricAuditLog: [audit, ...prev.metricAuditLog],
        };
      });
    },
    [setDerived]
  );

  const bulkApproveMetrics = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => approveMetric(id));
    },
    [approveMetric]
  );

  const bulkRejectMetrics = useCallback(
    (ids: string[], reason?: string) => {
      ids.forEach((id) => rejectMetric(id, reason));
    },
    [rejectMetric]
  );

  const bulkMarkMetricsMissing = useCallback(
    (ids: string[], reason?: string) => {
      ids.forEach((id) => markMetricMissing(id, reason));
    },
    [markMetricMissing]
  );

  const updateExtractionRule = useCallback(
    (metricName: string, patch: Partial<ExtractionRule>) => {
      setDerived((prev) => ({
        ...prev,
        extractionRules: prev.extractionRules.map((r) =>
          r.metricName === metricName ? { ...r, ...patch } : r
        ),
      }));
    },
    [setDerived]
  );

  const addAlias = useCallback(
    (metricName: string, alias: string) => {
      const trimmed = alias.trim().toLowerCase();
      if (!trimmed) return;
      setDerived((prev) => ({
        ...prev,
        extractionRules: prev.extractionRules.map((r) =>
          r.metricName === metricName && !r.aliases.includes(trimmed)
            ? { ...r, aliases: [...r.aliases, trimmed] }
            : r
        ),
        portfolioAuditEvents: [
          {
            id: uid("aud"),
            entityType: "extraction_rule" as const,
            entityId: metricName.toLowerCase().replace(/\s+/g, "-"),
            eventType: "alias_added",
            actorId: "user",
            actorName: REVIEWER,
            timestamp: new Date().toISOString(),
            metadata: { metricName, alias: trimmed },
          },
          ...(prev.portfolioAuditEvents ?? []),
        ],
      }));
    },
    [setDerived]
  );

  const removeAlias = useCallback(
    (metricName: string, alias: string) => {
      setDerived((prev) => ({
        ...prev,
        extractionRules: prev.extractionRules.map((r) =>
          r.metricName === metricName
            ? { ...r, aliases: r.aliases.filter((a) => a !== alias) }
            : r
        ),
        portfolioAuditEvents: [
          {
            id: uid("aud"),
            entityType: "extraction_rule" as const,
            entityId: metricName.toLowerCase().replace(/\s+/g, "-"),
            eventType: "alias_removed",
            actorId: "user",
            actorName: REVIEWER,
            timestamp: new Date().toISOString(),
            metadata: { metricName, alias },
          },
          ...(prev.portfolioAuditEvents ?? []),
        ],
      }));
    },
    [setDerived]
  );

  const upsertMetricDefinition = useCallback(
    (input: {
      originalName?: string;
      metricName: string;
      description?: string;
      type: MetricDataType;
      expectedUnit: string;
      enabled: boolean;
      aliases: string[];
      matchingGuidance?: string;
      supportedContexts: MetricValueContext[];
      actorName: string;
    }) => {
      const name = input.metricName.trim();
      if (!name) return { success: false, message: "Enter a metric name." };
      if (!input.supportedContexts.length) {
        return { success: false, message: "Select at least one supported context." };
      }

      const prev = stateRef.current;
      const original = (input.originalName ?? "").trim();
      const isCreate = !original;
      const duplicate = prev.extractionRules.some(
        (r) =>
          r.metricName.toLowerCase() === name.toLowerCase() &&
          r.metricName.toLowerCase() !== original.toLowerCase()
      );
      if (duplicate) {
        return { success: false, message: `A metric named “${name}” already exists.` };
      }

      const aliases = Array.from(
        new Set(
          input.aliases
            .map((a) => a.trim().toLowerCase())
            .filter(Boolean)
        )
      );
      const now = new Date().toISOString();
      const existing = original
        ? prev.extractionRules.find(
            (r) => r.metricName.toLowerCase() === original.toLowerCase()
          )
        : undefined;

      const nextRule: ExtractionRule = {
        metricName: name,
        aliases,
        expectedUnit: input.expectedUnit.trim() || "USD",
        enabled: input.enabled,
        description: input.description?.trim() || undefined,
        type: input.type,
        matchingGuidance: input.matchingGuidance?.trim() || undefined,
        supportedContexts: input.supportedContexts,
        isCustom: existing?.isCustom ?? isCreate,
        createdBy: existing?.createdBy ?? input.actorName,
        createdAt: existing?.createdAt ?? now,
        updatedBy: input.actorName,
        updatedAt: now,
        rationale: existing?.rationale,
      };

      setDerived((current) => {
        const rules = isCreate
          ? [...current.extractionRules, nextRule]
          : current.extractionRules.map((r) =>
              r.metricName.toLowerCase() === original.toLowerCase() ? nextRule : r
            );

        const renamed =
          !isCreate && original.toLowerCase() !== name.toLowerCase()
            ? (current.metricExpectations ?? []).map((e) =>
                e.metricName.toLowerCase() === original.toLowerCase()
                  ? { ...e, metricName: name, metricDefinitionId: name.toLowerCase() }
                  : e
              )
            : current.metricExpectations;

        return {
          ...current,
          extractionRules: rules,
          metricExpectations: renamed,
          portfolioAuditEvents: [
            {
              id: uid("aud"),
              entityType: "extraction_rule" as const,
              entityId: name.toLowerCase().replace(/\s+/g, "-"),
              eventType: isCreate ? "metric_created" : "metric_edited",
              actorId: "user",
              actorName: input.actorName,
              timestamp: now,
              metadata: {
                metricName: name,
                previousName: original || undefined,
                enabled: nextRule.enabled,
                type: nextRule.type,
                expectedUnit: nextRule.expectedUnit,
                aliases: nextRule.aliases,
              },
            },
            ...(current.portfolioAuditEvents ?? []),
          ],
        };
      });

      return {
        success: true,
        message: isCreate
          ? "Metric definition created. Configure reporting requirements separately when needed."
          : `${name} definition updated.`,
      };
    },
    [setDerived]
  );

  const setMetricDefinitionEnabled = useCallback(
    (input: { metricName: string; enabled: boolean; actorName: string }) => {
      const prev = stateRef.current;
      const rule = prev.extractionRules.find(
        (r) => r.metricName.toLowerCase() === input.metricName.toLowerCase()
      );
      if (!rule) return { success: false, message: "Metric definition not found." };
      if (rule.enabled === input.enabled) {
        return { success: true, message: "No changes." };
      }

      setDerived((current) => ({
        ...current,
        extractionRules: current.extractionRules.map((r) =>
          r.metricName.toLowerCase() === input.metricName.toLowerCase()
            ? {
                ...r,
                enabled: input.enabled,
                updatedBy: input.actorName,
                updatedAt: new Date().toISOString(),
              }
            : r
        ),
        portfolioAuditEvents: [
          {
            id: uid("aud"),
            entityType: "extraction_rule" as const,
            entityId: input.metricName.toLowerCase().replace(/\s+/g, "-"),
            eventType: input.enabled ? "metric_enabled" : "metric_disabled",
            actorId: "user",
            actorName: input.actorName,
            timestamp: new Date().toISOString(),
            metadata: {
              metricName: input.metricName,
              previousEnabled: rule.enabled,
              enabled: input.enabled,
            },
          },
          ...(current.portfolioAuditEvents ?? []),
        ],
      }));

      return {
        success: true,
        message: input.enabled
          ? `${input.metricName} is active and will be used in future extraction attempts.`
          : `${input.metricName} is inactive and will not be used for new extraction.`,
      };
    },
    [setDerived]
  );

  const deleteMetricDefinition = useCallback(
    (input: { metricName: string; actorName: string }) => {
      const prev = stateRef.current;
      const usage = getMetricUsage(prev, input.metricName);
      if (!usage.canDelete) {
        return {
          success: false,
          message: usage.blockReason ?? "This definition cannot be deleted.",
        };
      }

      setDerived((current) => ({
        ...current,
        extractionRules: current.extractionRules.filter(
          (r) => r.metricName.toLowerCase() !== input.metricName.toLowerCase()
        ),
        metricExpectations: (current.metricExpectations ?? []).filter(
          (e) => e.metricName.toLowerCase() !== input.metricName.toLowerCase()
        ),
        portfolioAuditEvents: [
          {
            id: uid("aud"),
            entityType: "extraction_rule" as const,
            entityId: input.metricName.toLowerCase().replace(/\s+/g, "-"),
            eventType: "metric_deleted",
            actorId: "user",
            actorName: input.actorName,
            timestamp: new Date().toISOString(),
            metadata: { metricName: input.metricName },
          },
          ...(current.portfolioAuditEvents ?? []),
        ],
      }));

      return { success: true, message: `${input.metricName} definition deleted.` };
    },
    [setDerived]
  );

  const exportCsv = useCallback(
    (options?: {
      metricIds?: string[];
      includeNeedsValidation?: boolean;
      exportName?: string;
    }) => {
      let rows = state.metrics;
      if (options?.metricIds) {
        rows = rows.filter((m) => options.metricIds!.includes(m.id));
      }

      const includeNeedsValidation = options?.includeNeedsValidation ?? false;
      const approved = rows.filter((m) => m.status === "Approved for reporting");
      const needsValidation = rows.filter((m) => m.status === "Needs validation");

      if (!includeNeedsValidation && needsValidation.length > 0 && !options?.metricIds) {
        return {
          success: false,
          message: `${needsValidation.length} metrics still need validation. Approve them first or enable include needs validation.`,
        };
      }

      const exportRows = includeNeedsValidation
        ? rows.filter(
            (m) =>
              m.status === "Approved for reporting" || m.status === "Needs validation"
          )
        : approved;

      if (exportRows.length === 0) {
        return { success: false, message: "No approved metrics available to export." };
      }

      const csv = metricsToCsv(exportRows, state);
      const name =
        options?.exportName ??
        `portfolio-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCsv(csv, name);

      const companies = new Set(exportRows.map((m) => m.companyName)).size;
      const entry = {
        id: uid("export"),
        exportName: name,
        createdAt: new Date().toISOString(),
        createdBy: REVIEWER,
        metricsIncluded: exportRows.length,
        companiesIncluded: companies,
        format: "CSV" as const,
        csvContent: csv,
      };

      setDerived((prev) => ({
        ...prev,
        exportHistory: [entry, ...prev.exportHistory],
      }));

      return { success: true, message: `Exported ${exportRows.length} metrics.` };
    },
    [setDerived, state.metrics]
  );

  const updateSettings = useCallback(
    (patch: Partial<PortfolioSettings>) => {
      setDerived((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
    },
    [setDerived]
  );

  const resetDemoData = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    pdfFilesByKeyRef.current.clear();
    void clearPackagePdfStore();
    setState(createSeedPortfolioState());
  }, []);

  const clearUploadedPackages = useCallback(() => {
    pdfFilesByKeyRef.current.clear();
    void clearPackagePdfStore();
    setDerived((prev) => ({
      ...prev,
      companies: [],
      packages: [],
      metrics: [],
      metricAuditLog: [],
      reviewWaitlist: [],
      companyNotes: [],
      companyFollowUps: [],
      assignmentAuditLog: [],
      exportHistory: [],
    }));
  }, [setDerived]);

  const deletePackage = useCallback(
    (packageId: string) => {
      setDerived((prev) => {
        const pkg = prev.packages.find((p) => p.id === packageId);
        if (pkg) {
          const key = packageKey(pkg);
          pdfFilesByKeyRef.current.delete(key);
          void deletePackagePdf(key);
        }
        return {
          ...prev,
          packages: prev.packages.filter((p) => p.id !== packageId),
          metrics: prev.metrics.filter((m) => m.packageId !== packageId),
          reviewWaitlist: (prev.reviewWaitlist ?? []).filter(
            (w) => w.packageId !== packageId
          ),
        };
      });
    },
    [setDerived]
  );

  const assignPackageToReviewer = useCallback(
    (packageId: string, reviewerId: string, reviewerName: string) => {
      setDerived((prev) => ({
        ...prev,
        packages: prev.packages.map((p) =>
          p.id === packageId
            ? {
                ...p,
                assignedReviewerId: reviewerId,
                assignedReviewerName: reviewerName,
                assignedAt: new Date().toISOString(),
              }
            : p
        ),
      }));
    },
    [setDerived]
  );

  const assignReviewPackagesBatch = useCallback(
    (payload: {
      companyIds: string[];
      packageScope: "latest_active" | "all_active";
      reviewerId: string | null;
      reviewerName: string | null;
      dueDate?: string | null;
      priority?: ReviewPriority | "keep_existing";
      note?: string;
      assignedById: string;
      assignedByName: string;
      canAssign: boolean;
    }) => {
      if (!payload.canAssign) {
        return {
          success: false,
          message: "You do not have permission to assign portfolio reviews.",
          batchId: null as string | null,
          assignedCount: 0,
          failed: payload.companyIds.map((companyId) => ({
            companyId,
            reason: "Missing assignment permission",
          })),
        };
      }

      const stateNow = stateRef.current;
      const targets = resolveAssignmentPackages(
        stateNow,
        payload.companyIds,
        payload.packageScope
      );
      const batchId = uid("assign-batch");
      const failed: { companyId: string; reason: string }[] = [];
      const auditEntries: AssignmentAuditEntry[] = [];
      const timestamp = new Date().toISOString();
      const targetPackageIds = new Set(targets.map((t) => t.packageId));

      for (const companyId of payload.companyIds) {
        if (!targets.some((t) => t.companyId === companyId)) {
          failed.push({
            companyId,
            reason: "No assignable package found for this company",
          });
        }
      }

      setDerived((prev) => {
        const packages = prev.packages.map((pkg) => {
          if (!targetPackageIds.has(pkg.id)) return pkg;
          const entry: AssignmentAuditEntry = {
            id: uid("assign"),
            batchId,
            companyId: pkg.companyId,
            packageId: pkg.id,
            previousReviewerId: pkg.assignedReviewerId,
            previousReviewerName: pkg.assignedReviewerName,
            newReviewerId: payload.reviewerId,
            newReviewerName: payload.reviewerName,
            assignedBy: payload.assignedByName,
            assignedById: payload.assignedById,
            timestamp,
            dueDate: payload.dueDate,
            previousDueDate: pkg.dueDate ?? null,
            previousPriority: pkg.reviewPriority,
            newPriority: payload.priority ?? "keep_existing",
            note: payload.note,
            mode: "bulk",
          };
          auditEntries.push(entry);

          return {
            ...pkg,
            assignedReviewerId: payload.reviewerId ?? undefined,
            assignedReviewerName: payload.reviewerName ?? undefined,
            assignedAt: payload.reviewerId ? timestamp : undefined,
            dueDate:
              payload.dueDate === undefined
                ? pkg.dueDate
                : payload.dueDate ?? undefined,
            reviewPriority:
              payload.priority && payload.priority !== "keep_existing"
                ? payload.priority
                : pkg.reviewPriority,
          };
        });

        return {
          ...prev,
          packages,
          assignmentAuditLog: [...auditEntries, ...(prev.assignmentAuditLog ?? [])],
        };
      });

      const assignedCount = targets.length;
      return {
        success: assignedCount > 0,
        message:
          failed.length === 0
            ? `Assigned ${assignedCount} package${assignedCount === 1 ? "" : "s"}.`
            : `${assignedCount} assigned. ${failed.length} could not be updated.`,
        batchId: assignedCount > 0 ? batchId : null,
        assignedCount,
        failed,
      };
    },
    [setDerived]
  );

  const restoreAssignmentBatch = useCallback(
    (batchId: string) => {
      const entries = (stateRef.current.assignmentAuditLog ?? []).filter(
        (e) => e.batchId === batchId
      );
      if (entries.length === 0) {
        return { success: false, message: "Nothing to undo for this assignment." };
      }

      const byPackage = new Map(entries.map((e) => [e.packageId, e]));
      setDerived((prev) => ({
        ...prev,
        packages: prev.packages.map((pkg) => {
          const entry = byPackage.get(pkg.id);
          if (!entry) return pkg;
          return {
            ...pkg,
            assignedReviewerId: entry.previousReviewerId,
            assignedReviewerName: entry.previousReviewerName,
            assignedAt: entry.previousReviewerId
              ? new Date().toISOString()
              : undefined,
            dueDate:
              entry.dueDate !== undefined
                ? entry.previousDueDate ?? undefined
                : pkg.dueDate,
            reviewPriority:
              entry.newPriority && entry.newPriority !== "keep_existing"
                ? entry.previousPriority
                : pkg.reviewPriority,
          };
        }),
      }));

      return {
        success: true,
        message: `Restored previous assignees for ${entries.length} package${entries.length === 1 ? "" : "s"}.`,
      };
    },
    [setDerived]
  );

  const updatePackageReviewMeta = useCallback(
    (
      packageId: string,
      patch: {
        dueDate?: string | null;
        reviewPriority?: ReviewPriority;
        assignedReviewerId?: string | null;
        assignedReviewerName?: string | null;
      }
    ) => {
      setDerived((prev) => ({
        ...prev,
        packages: prev.packages.map((p) => {
          if (p.id !== packageId) return p;
          const next = { ...p };
          if (patch.dueDate !== undefined) {
            next.dueDate = patch.dueDate ?? undefined;
          }
          if (patch.reviewPriority !== undefined) {
            next.reviewPriority = patch.reviewPriority;
          }
          if (patch.assignedReviewerId !== undefined) {
            next.assignedReviewerId = patch.assignedReviewerId ?? undefined;
            if (patch.assignedReviewerId == null) {
              next.assignedReviewerName = undefined;
              next.assignedAt = undefined;
            } else if (patch.assignedReviewerName !== undefined) {
              next.assignedReviewerName = patch.assignedReviewerName ?? undefined;
              next.assignedAt = new Date().toISOString();
            }
          } else if (patch.assignedReviewerName !== undefined) {
            next.assignedReviewerName = patch.assignedReviewerName ?? undefined;
          }
          return next;
        }),
      }));
    },
    [setDerived]
  );

  const addToReviewWaitlist = useCallback(
    (input: {
      packageId: string;
      companyId: string;
      scheduledDate: string;
      priority: ReviewPriority;
      assignedReviewerId: string;
      assignedReviewerName: string;
      note?: string;
      reminder: boolean;
      createdBy: string;
    }): { success: boolean; message: string } => {
      const waitlist = stateRef.current.reviewWaitlist ?? [];
      if (waitlist.some((w) => w.packageId === input.packageId)) {
        return {
          success: false,
          message: "This package is already on the waitlist. Use Edit waitlist.",
        };
      }
      const item: ReviewWaitlistItem = {
        id: uid("wl"),
        packageId: input.packageId,
        companyId: input.companyId,
        scheduledDate: input.scheduledDate,
        priority: input.priority,
        assignedReviewerId: input.assignedReviewerId,
        assignedReviewerName: input.assignedReviewerName,
        note: input.note,
        reminder: input.reminder,
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      };
      setDerived((prev) => {
        if ((prev.reviewWaitlist ?? []).some((w) => w.packageId === input.packageId)) {
          return prev;
        }
        return {
          ...prev,
          reviewWaitlist: [...(prev.reviewWaitlist ?? []), item],
          packages: prev.packages.map((p) =>
            p.id === input.packageId
              ? {
                  ...p,
                  assignedReviewerId: input.assignedReviewerId,
                  assignedReviewerName: input.assignedReviewerName,
                  assignedAt: new Date().toISOString(),
                  reviewPriority: input.priority,
                  dueDate: input.scheduledDate,
                }
              : p
          ),
        };
      });
      return { success: true, message: "Added to review waitlist." };
    },
    [setDerived]
  );

  const updateReviewWaitlistItem = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          ReviewWaitlistItem,
          | "scheduledDate"
          | "priority"
          | "assignedReviewerId"
          | "assignedReviewerName"
          | "note"
          | "reminder"
        >
      >
    ) => {
      setDerived((prev) => {
        const waitlist = prev.reviewWaitlist ?? [];
        const item = waitlist.find((w) => w.id === id);
        if (!item) return prev;
        const updated = { ...item, ...patch };
        return {
          ...prev,
          reviewWaitlist: waitlist.map((w) => (w.id === id ? updated : w)),
          packages: prev.packages.map((p) =>
            p.id === updated.packageId
              ? {
                  ...p,
                  assignedReviewerId: updated.assignedReviewerId,
                  assignedReviewerName: updated.assignedReviewerName,
                  reviewPriority: updated.priority,
                  dueDate: updated.scheduledDate,
                }
              : p
          ),
        };
      });
    },
    [setDerived]
  );

  const removeFromReviewWaitlist = useCallback(
    (packageId: string) => {
      setDerived((prev) => ({
        ...prev,
        reviewWaitlist: (prev.reviewWaitlist ?? []).filter(
          (w) => w.packageId !== packageId
        ),
      }));
    },
    [setDerived]
  );

  const addCompanyNote = useCallback(
    (input: {
      companyId: string;
      authorId: string;
      authorName: string;
      body: string;
      linkedPackageId?: string;
    }) => {
      const note: CompanyNote = {
        id: uid("note"),
        companyId: input.companyId,
        authorId: input.authorId,
        authorName: input.authorName,
        body: input.body.trim(),
        createdAt: new Date().toISOString(),
        linkedPackageId: input.linkedPackageId,
      };
      setDerived((prev) => ({
        ...prev,
        companyNotes: [note, ...(prev.companyNotes ?? [])],
      }));
    },
    [setDerived]
  );

  const updateCompanyNote = useCallback(
    (id: string, body: string) => {
      setDerived((prev) => ({
        ...prev,
        companyNotes: (prev.companyNotes ?? []).map((n) =>
          n.id === id
            ? { ...n, body: body.trim(), updatedAt: new Date().toISOString() }
            : n
        ),
      }));
    },
    [setDerived]
  );

  const deleteCompanyNote = useCallback(
    (id: string) => {
      setDerived((prev) => ({
        ...prev,
        companyNotes: (prev.companyNotes ?? []).filter((n) => n.id !== id),
      }));
    },
    [setDerived]
  );

  const addCompanyFollowUp = useCallback(
    (input: {
      companyId: string;
      title: string;
      category: string;
      source: string;
      sourcePage?: number;
      priority: ReviewPriority;
      ownerId?: string;
      ownerName?: string;
      dueDate?: string;
      linkedPackageId?: string;
      notes?: string;
      createdBy: string;
    }) => {
      const item: CompanyFollowUp = {
        id: uid("fu"),
        companyId: input.companyId,
        title: input.title.trim(),
        category: input.category,
        source: input.source,
        sourcePage: input.sourcePage,
        priority: input.priority,
        ownerId: input.ownerId,
        ownerName: input.ownerName,
        dueDate: input.dueDate,
        status: "Open",
        linkedPackageId: input.linkedPackageId,
        notes: input.notes,
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
      };
      setDerived((prev) => ({
        ...prev,
        companyFollowUps: [item, ...(prev.companyFollowUps ?? [])],
      }));
    },
    [setDerived]
  );

  const updateCompanyFollowUp = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          CompanyFollowUp,
          | "title"
          | "priority"
          | "ownerId"
          | "ownerName"
          | "dueDate"
          | "status"
          | "notes"
          | "resolvedAt"
        >
      >
    ) => {
      setDerived((prev) => ({
        ...prev,
        companyFollowUps: (prev.companyFollowUps ?? []).map((f) =>
          f.id === id ? { ...f, ...patch } : f
        ),
      }));
    },
    [setDerived]
  );

  const updateCompanyProfile = useCallback(
    (
      companyId: string,
      patch: Partial<
        Pick<
          PortfolioCompany,
          | "investmentDate"
          | "reportingFrequency"
          | "assignedAssociateId"
          | "assignedAssociateName"
          | "nextExpectedReportDate"
          | "status"
          | "sector"
          | "websiteUrl"
          | "websiteDomain"
          | "websiteSource"
          | "websiteConfidence"
          | "descriptor"
          | "name"
        >
      >
    ) => {
      setDerived((prev) => {
        const audits: CompanyAuditEntry[] = [];
        const companies = prev.companies.map((c) => {
          if (c.id !== companyId) return c;
          const next = { ...c, ...patch, updatedAt: new Date().toISOString() };
          if (patch.name && patch.name !== c.name) {
            next.normalizedName = normalizeCompanyName(patch.name);
          }
          if (patch.websiteUrl !== undefined) {
            if (patch.websiteUrl) {
              const normalized = normalizeWebsiteInput(patch.websiteUrl);
              if (normalized.ok) {
                next.websiteUrl = normalized.value.displayUrl;
                next.websiteDomain = normalized.value.domain;
                next.websiteSource = patch.websiteSource ?? "manual";
                audits.push({
                  id: uid("caudit"),
                  companyId,
                  action: c.websiteUrl ? "website_replaced" : "website_added",
                  timestamp: new Date().toISOString(),
                  actorName: REVIEWER,
                  details: { websiteUrl: next.websiteUrl },
                });
              }
            } else {
              next.websiteUrl = undefined;
              next.websiteDomain = undefined;
            }
          }
          if (
            patch.assignedAssociateId !== undefined ||
            patch.assignedAssociateName !== undefined
          ) {
            audits.push({
              id: uid("caudit"),
              companyId,
              action: "owner_assigned",
              timestamp: new Date().toISOString(),
              actorName: REVIEWER,
              details: {
                ownerId: next.assignedAssociateId,
                ownerName: next.assignedAssociateName,
              },
            });
          }
          if (patch.sector && patch.sector !== c.sector) {
            audits.push({
              id: uid("caudit"),
              companyId,
              action: "sector_changed",
              timestamp: new Date().toISOString(),
              actorName: REVIEWER,
              details: { from: c.sector, to: patch.sector },
            });
          }
          return next;
        });
        return {
          ...prev,
          companies,
          companyAuditLog: [...(prev.companyAuditLog ?? []), ...audits],
        };
      });
    },
    [setDerived]
  );

  const addCompany = useCallback(
    (input: {
      name: string;
      sector: string;
      websiteUrl?: string;
      status?: PortfolioCompany["status"];
      reportingFrequency?: PortfolioCompany["reportingFrequency"];
      assignedAssociateId?: string;
      assignedAssociateName?: string;
      notes?: string;
      duplicateOverride?: boolean;
      matchedCompanyIds?: string[];
    }): { success: boolean; message: string; companyId?: string } => {
      const name = input.name.trim();
      if (!name) return { success: false, message: "Company name is required." };
      if (!input.sector.trim()) return { success: false, message: "Sector is required." };

      let websiteUrl: string | undefined;
      let websiteDomain: string | undefined;
      if (input.websiteUrl?.trim()) {
        const normalized = normalizeWebsiteInput(input.websiteUrl);
        if (!normalized.ok) return { success: false, message: normalized.error };
        websiteUrl = normalized.value.displayUrl;
        websiteDomain = normalized.value.domain;
      }

      const company = createPortfolioCompany(name, input.sector, {
        status: input.status ?? "Active",
        reportingFrequency: input.reportingFrequency,
        assignedAssociateId: input.assignedAssociateId,
        assignedAssociateName: input.assignedAssociateName,
        websiteUrl,
        websiteDomain,
        websiteSource: websiteUrl ? "manual" : undefined,
        websiteConfidence: websiteUrl ? "high" : undefined,
        createdManually: true,
      });

      // Ensure unique id if collision
      if (stateRef.current.companies.some((c) => c.id === company.id)) {
        company.id = `${company.id}-${Date.now().toString(36).slice(-4)}`;
      }

      const audits: CompanyAuditEntry[] = [
        {
          id: uid("caudit"),
          companyId: company.id,
          action: "company_created",
          timestamp: new Date().toISOString(),
          actorName: REVIEWER,
          details: { name, sector: input.sector },
        },
      ];
      if (input.duplicateOverride) {
        audits.push({
          id: uid("caudit"),
          companyId: company.id,
          action: "duplicate_override",
          timestamp: new Date().toISOString(),
          actorName: REVIEWER,
          details: { matchedCompanyIds: input.matchedCompanyIds ?? [] },
        });
      }
      if (websiteUrl) {
        audits.push({
          id: uid("caudit"),
          companyId: company.id,
          action: "website_added",
          timestamp: new Date().toISOString(),
          actorName: REVIEWER,
          details: { websiteUrl },
        });
      }

      setDerived((prev) => {
        let next = {
          ...prev,
          companies: [...prev.companies, company],
          companyAuditLog: [...(prev.companyAuditLog ?? []), ...audits],
        };
        if (input.notes?.trim()) {
          const note: CompanyNote = {
            id: uid("note"),
            companyId: company.id,
            authorId: "alex-rivera",
            authorName: REVIEWER,
            body: input.notes.trim(),
            createdAt: new Date().toISOString(),
          };
          next = { ...next, companyNotes: [...(next.companyNotes ?? []), note] };
        }
        return next;
      });

      return {
        success: true,
        message: "Company created.",
        companyId: company.id,
      };
    },
    [setDerived]
  );

  const resolveWebsiteConflict = useCallback(
    (companyId: string, decision: "keep" | "replace") => {
      setDerived((prev) => ({
        ...prev,
        companies: prev.companies.map((c) => {
          if (c.id !== companyId || !c.pendingWebsiteUrl) return c;
          if (decision === "keep") {
            return {
              ...c,
              pendingWebsiteUrl: undefined,
              pendingWebsiteDomain: undefined,
              pendingWebsiteSourcePackageId: undefined,
              pendingWebsiteSourcePage: undefined,
              pendingWebsiteEvidence: undefined,
              updatedAt: new Date().toISOString(),
            };
          }
          return {
            ...c,
            websiteUrl: c.pendingWebsiteUrl,
            websiteDomain: c.pendingWebsiteDomain,
            websiteSource: "pdf_extracted" as const,
            websiteSourcePackageId: c.pendingWebsiteSourcePackageId,
            websiteSourcePage: c.pendingWebsiteSourcePage,
            pendingWebsiteUrl: undefined,
            pendingWebsiteDomain: undefined,
            pendingWebsiteSourcePackageId: undefined,
            pendingWebsiteSourcePage: undefined,
            pendingWebsiteEvidence: undefined,
            updatedAt: new Date().toISOString(),
          };
        }),
        companyAuditLog: [
          ...(prev.companyAuditLog ?? []),
          {
            id: uid("caudit"),
            companyId,
            action: decision === "keep" ? ("website_kept" as const) : ("website_replaced" as const),
            timestamp: new Date().toISOString(),
            actorName: REVIEWER,
          },
        ],
      }));
    },
    [setDerived]
  );

  const downloadPackagePdf = useCallback((packageId: string): boolean => {
    const pkg = stateRef.current.packages.find((p) => p.id === packageId);
    if (!pkg) return false;

    const key = packageKey(pkg);
    const file = pdfFilesByKeyRef.current.get(key);
    if (file) {
      triggerBlobDownload(file, pkg.fileName);
      return true;
    }

    const resolved = resolveSourceDownload({
      sourceFile: pkg.fileName,
      companyId: pkg.companyId,
    });
    if (resolved.url) {
      void triggerSourceDownload(resolved.url, resolved.fileName);
      return true;
    }
    return false;
  }, []);

  const resolvePackagePdfUrl = useCallback((packageId: string): string | null => {
    const pkg = stateRef.current.packages.find((p) => p.id === packageId);
    if (!pkg) return null;

    // Prefer stable catalog / public paths for preview (blob URLs get revoked by React effects).
    const catalogUrl = resolveSourceDownload({
      sourceFile: pkg.fileName,
      companyId: pkg.companyId,
    }).url;
    if (catalogUrl) return catalogUrl;

    const key = packageKey(pkg);
    const file = pdfFilesByKeyRef.current.get(key);
    if (file) {
      return URL.createObjectURL(file);
    }

    return null;
  }, []);

  const value = useMemo<PortfolioContextValue>(() => {
    const derived = applyDerived(state);
    return {
      hydrated,
      state: derived,
      kpis: getPortfolioKpis(derived),
      validationSummary: getValidationSummary(derived),
      extractionTrend: getExtractionTrend(derived),
      companyPerformance: getCompanyPerformanceRows(derived),
      topMetricsNeedingValidation: getTopMetricsNeedingValidation(derived),
      coverageByCompany: getCoverageByCompany(derived),
      recentPackages: getRecentPackages(derived),
      extractionQualityBySourceFormat: getExtractionQualityBySourceFormat(derived),
      extractionQualitySummary: getExtractionQualitySummary(derived),
      needsValidationCount: needsValidationBadgeCount(derived),
      uploadAndProcessPdf,
      processBulkUpload,
      ensureDemoSagardAutoPackage,
      upsertMetricExpectation,
      removeCompanyMetricOverride,
      saveCommunicationTemplate,
      saveCompanyCommunication,
      upsertCompanyContact,
      approveMetric,
      editMetric,
      rejectMetric,
      markMetricMissing,
      bulkApproveMetrics,
      bulkRejectMetrics,
      bulkMarkMetricsMissing,
      updateExtractionRule,
      addAlias,
      removeAlias,
      upsertMetricDefinition,
      setMetricDefinitionEnabled,
      deleteMetricDefinition,
      exportCsv,
      updateSettings,
      resetDemoData,
      clearUploadedPackages,
      deletePackage,
      assignPackageToReviewer,
      assignReviewPackagesBatch,
      restoreAssignmentBatch,
      updatePackageReviewMeta,
      addToReviewWaitlist,
      updateReviewWaitlistItem,
      removeFromReviewWaitlist,
      downloadPackagePdf,
      resolvePackagePdfUrl,
      addCompanyNote,
      updateCompanyNote,
      deleteCompanyNote,
      addCompanyFollowUp,
      updateCompanyFollowUp,
      updateCompanyProfile,
      addCompany,
      resolveWebsiteConflict,
      getCompanyById: (id) => derived.companies.find((c) => c.id === id),
      getMetricsForCompany: (companyId) =>
        derived.metrics.filter((m) => m.companyId === companyId),
      getPackagesForCompany: (companyId) =>
        derived.packages.filter((p) => p.companyId === companyId),
    };
  }, [
    state,
    hydrated,
    uploadAndProcessPdf,
    processBulkUpload,
    ensureDemoSagardAutoPackage,
    upsertMetricExpectation,
    removeCompanyMetricOverride,
    saveCommunicationTemplate,
    saveCompanyCommunication,
    upsertCompanyContact,
    approveMetric,
    editMetric,
    rejectMetric,
    markMetricMissing,
    bulkApproveMetrics,
    bulkRejectMetrics,
    bulkMarkMetricsMissing,
      updateExtractionRule,
      addAlias,
      removeAlias,
      upsertMetricDefinition,
      setMetricDefinitionEnabled,
      deleteMetricDefinition,
      exportCsv,
    updateSettings,
    resetDemoData,
    clearUploadedPackages,
    deletePackage,
    assignPackageToReviewer,
    assignReviewPackagesBatch,
    restoreAssignmentBatch,
    updatePackageReviewMeta,
    addToReviewWaitlist,
    updateReviewWaitlistItem,
    removeFromReviewWaitlist,
    downloadPackagePdf,
    resolvePackagePdfUrl,
    addCompanyNote,
    updateCompanyNote,
    deleteCompanyNote,
    addCompanyFollowUp,
    updateCompanyFollowUp,
    updateCompanyProfile,
    addCompany,
    resolveWebsiteConflict,
  ]);

  return (
    <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}
