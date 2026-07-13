export type MetricName =
  | "Revenue"
  | "ARR"
  | "EBITDA"
  | "Cash"
  | "Headcount"
  | "Churn";

export const ALL_METRICS: MetricName[] = [
  "Revenue",
  "ARR",
  "EBITDA",
  "Cash",
  "Headcount",
  "Churn",
];

export type MetricStatus =
  | "Needs validation"
  | "Approved for reporting"
  | "Missing from report"
  | "Rejected"
  | "Not applicable"
  | "Not configured"
  | "Optional metric not reported"
  | "Needs clarification"
  | "Extraction failed"
  | "Conflicting values found";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type PackageStatus = "Processed" | "Processing" | "Failed";

export type PackageSourceFormat =
  | "Company-formatted PDF"
  | "ICReady template"
  | "Scanned PDF"
  | "Mixed/selectable and scanned PDF";

export type ReviewPriority = "Urgent" | "High" | "Normal" | "Low";

export type CompanyReviewStatus =
  | "Awaiting assignment"
  | "In review"
  | "Needs attention"
  | "Completed"
  | "Awaiting report"
  | "Extraction failed"
  | "Waitlisted";

export type CompanyInvestmentStatus =
  | "Active"
  | "Watchlist"
  | "Inactive"
  | "Exited"
  | "On hold";

export type CompanyWebsiteSource = "manual" | "pdf_extracted" | "imported";

export type CompanyWebsiteConfidence = "high" | "medium" | "low";

export type PortfolioCompany = {
  id: string;
  name: string;
  /** Normalized name for duplicate matching. */
  normalizedName?: string;
  sector: string;
  /** Optional short descriptor under the company name (never fabricated). */
  descriptor?: string;
  status: CompanyInvestmentStatus;
  latestReportDate: string | null;
  coverage: number;
  metricsApproved: number;
  metricsNeedsValidation: number;
  metricsMissing: number;
  /** Optional investment profile metadata — never fabricated. */
  investmentDate?: string;
  reportingFrequency?: "Monthly" | "Quarterly" | "Semi-annual" | "Annual" | "Ad hoc";
  assignedAssociateId?: string;
  assignedAssociateName?: string;
  nextExpectedReportDate?: string;
  websiteUrl?: string;
  websiteDomain?: string;
  websiteSource?: CompanyWebsiteSource;
  websiteConfidence?: CompanyWebsiteConfidence;
  websiteSourcePackageId?: string;
  websiteSourcePage?: number;
  /** Conflicting website extracted from a report — never auto-overwrites. */
  pendingWebsiteUrl?: string;
  pendingWebsiteDomain?: string;
  pendingWebsiteSourcePackageId?: string;
  pendingWebsiteSourcePage?: number;
  pendingWebsiteEvidence?: string;
  createdAt?: string;
  updatedAt?: string;
  /** True when created via Add Company (kept even with zero packages). */
  createdManually?: boolean;
};

export type CompanyAuditAction =
  | "company_created"
  | "website_added"
  | "website_extracted"
  | "website_replaced"
  | "website_kept"
  | "website_conflict"
  | "report_linked"
  | "duplicate_override"
  | "owner_assigned"
  | "sector_changed";

export type CompanyAuditEntry = {
  id: string;
  companyId: string;
  action: CompanyAuditAction;
  timestamp: string;
  actorName: string;
  details?: Record<string, string | string[] | number | boolean | undefined | null>;
};

export type CompanyNote = {
  id: string;
  companyId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  linkedPackageId?: string;
  linkedMetricId?: string;
  linkedFollowUpId?: string;
};

export type CompanyFollowUpStatus =
  | "Open"
  | "Follow-up required"
  | "Monitoring"
  | "Pending management response"
  | "Resolved"
  | "Overdue";

export type CompanyFollowUp = {
  id: string;
  companyId: string;
  title: string;
  category: string;
  source: string;
  sourcePage?: number;
  priority: ReviewPriority;
  ownerId?: string;
  ownerName?: string;
  dueDate?: string;
  status: CompanyFollowUpStatus;
  linkedPackageId?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  resolvedAt?: string;
};

export type ReportingPackage = {
  id: string;
  companyId: string;
  companyName: string;
  fileName: string;
  reportPeriod: string;
  uploadedAt: string;
  /** Display name of who uploaded/processed this package. */
  uploadedBy?: string;
  processedAt?: string;
  runCount: number;
  status: PackageStatus;
  pagesProcessed: number;
  metricsExtracted: number;
  needsValidation: number;
  missingMetrics: number;
  coverage: number;
  sourceFormat: PackageSourceFormat;
  errorMessage?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  assignedAt?: string;
  dueDate?: string;
  reviewPriority?: ReviewPriority;
  /** SHA-256 of file bytes when available */
  fileHash?: string;
  fileSize?: number;
  documentFingerprint?: string;
  versionNumber?: number;
  versionGroupId?: string;
  previousPackageId?: string;
  relationship?: "original" | "revision" | "supplement" | "replacement" | "superseded";
  activeVersion?: boolean;
  /** Demo seed packages must stay out of production-looking data paths when demos are disabled. */
  isDemoSeed?: boolean;
};

export type ReviewWaitlistItem = {
  id: string;
  packageId: string;
  companyId: string;
  scheduledDate: string;
  priority: ReviewPriority;
  assignedReviewerId: string;
  assignedReviewerName: string;
  note?: string;
  reminder: boolean;
  createdAt: string;
  createdBy: string;
};

export type PdfEvidenceValueType = "actual" | "budget" | "forecast" | "prior_period";

export type PdfEvidenceRegion = {
  page: number;
  text: string;
  normalizedText?: string;
  boundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateSystem: "pdf" | "viewport";
  }>;
  textItemIndexes?: number[];
  sectionName?: string;
  tableContext?: {
    rowLabel?: string;
    columnLabel?: string;
    period?: string;
    valueType?: PdfEvidenceValueType;
  };
};

export type ExtractedMetric = {
  id: string;
  companyId: string;
  companyName: string;
  packageId: string;
  reportPeriod: string;
  metricName: string;
  extractedValue: string;
  normalizedValue: number | null;
  unit: string;
  sourceFile: string;
  sourcePage: number;
  evidenceText: string;
  /** Optional report section / heading near the evidence. */
  sourceSection?: string;
  status: MetricStatus;
  confidence: ConfidenceLevel;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Original extraction before any human edit */
  originalExtractedValue?: string;
  originalNormalizedValue?: number | null;
  valueType?: PdfEvidenceValueType;
  tableContext?: PdfEvidenceRegion["tableContext"];
  evidenceRegions?: PdfEvidenceRegion[];
};

export type MetricAuditAction =
  | "approved"
  | "rejected"
  | "edited"
  | "marked_missing";

export type MetricAuditEntry = {
  id: string;
  metricId: string;
  packageId: string;
  companyId: string;
  metricName: string;
  action: MetricAuditAction;
  previousStatus: MetricStatus;
  newStatus: MetricStatus;
  originalValue?: string;
  finalValue?: string;
  unit?: string;
  reviewer: string;
  timestamp: string;
  sourcePage?: number;
  reason?: string;
};

export type MetricDataType =
  | "currency"
  | "percentage"
  | "count"
  | "ratio"
  | "text";

export type MetricValueContext =
  | "actual"
  | "forecast"
  | "budget"
  | "prior_period";

export type ExtractionRule = {
  metricName: string;
  aliases: string[];
  expectedUnit: string;
  enabled: boolean;
  /** Short description shown in Reporting Requirements / Extraction Rules. */
  description?: string;
  /** Why the metric exists (legacy; prefer matchingGuidance). */
  rationale?: string;
  /** User-added metrics (vs seed defaults). */
  isCustom?: boolean;
  type?: MetricDataType;
  matchingGuidance?: string;
  supportedContexts?: MetricValueContext[];
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
};

export type ExportHistoryEntry = {
  id: string;
  exportName: string;
  createdAt: string;
  createdBy: string;
  metricsIncluded: number;
  companiesIncluded: number;
  format: "CSV";
  csvContent: string;
};

export type PortfolioSettings = {
  requireHumanValidation: boolean;
  defaultConfidenceThreshold: ConfidenceLevel;
  allowedFileType: "PDF";
  assumeSelectableText: boolean;
  defaultExportFormat: "CSV";
};

export type AssignmentAuditEntry = {
  id: string;
  batchId: string;
  companyId: string;
  packageId: string;
  previousReviewerId?: string;
  previousReviewerName?: string;
  newReviewerId?: string | null;
  newReviewerName?: string | null;
  assignedBy: string;
  assignedById: string;
  timestamp: string;
  dueDate?: string | null;
  previousDueDate?: string | null;
  previousPriority?: ReviewPriority;
  newPriority?: ReviewPriority | "keep_existing";
  note?: string;
  mode: "bulk" | "individual";
};

export type PortfolioState = {
  companies: PortfolioCompany[];
  packages: ReportingPackage[];
  metrics: ExtractedMetric[];
  metricAuditLog: MetricAuditEntry[];
  assignmentAuditLog: AssignmentAuditEntry[];
  companyAuditLog: CompanyAuditEntry[];
  reviewWaitlist: ReviewWaitlistItem[];
  companyNotes: CompanyNote[];
  companyFollowUps: CompanyFollowUp[];
  extractionRules: ExtractionRule[];
  exportHistory: ExportHistoryEntry[];
  settings: PortfolioSettings;
  /** Phase additions — optional for older localStorage snapshots */
  metricExpectations?: import("./monitoring-phase-types").MetricExpectation[];
  companyContacts?: import("./monitoring-phase-types").CompanyContact[];
  companyCommunications?: import("./monitoring-phase-types").CompanyCommunication[];
  communicationTemplates?: import("./monitoring-phase-types").CommunicationTemplate[];
  companyAliases?: import("./monitoring-phase-types").CompanyAlias[];
  portfolioAuditEvents?: import("./monitoring-phase-types").PortfolioAuditEvent[];
};

export type ExtractionCandidate = {
  metricName: string;
  extractedValue: string;
  normalizedValue: number | null;
  unit: string;
  sourcePage: number;
  evidenceText: string;
  confidence: ConfidenceLevel;
  matchedLabel?: string;
  valueType?: PdfEvidenceValueType;
  tableContext?: PdfEvidenceRegion["tableContext"];
  evidenceRegions?: PdfEvidenceRegion[];
};

export type PageText = {
  page: number;
  text: string;
};
