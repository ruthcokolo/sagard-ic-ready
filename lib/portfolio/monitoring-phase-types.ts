/**
 * Portfolio monitoring phase types: batch upload, expectations, communications.
 * Kept separate from legacy core types for incremental adoption.
 */

import type { ConfidenceLevel, MetricName, ReviewPriority } from "./types";

export type UploadFileState =
  | "queued"
  | "hashing"
  | "detecting_metadata"
  | "duplicate_found"
  | "awaiting_input"
  | "ready"
  | "processing"
  | "processed"
  | "failed"
  | "skipped";

export type UploadBatchState =
  | "draft"
  | "validating"
  | "partially_ready"
  | "processing"
  | "completed"
  | "completed_with_errors";

export type DuplicateMatchReason =
  | "same_file_hash"
  | "same_normalized_filename"
  | "same_company"
  | "same_reporting_period"
  | "same_file_size"
  | "high_content_similarity"
  | "same_document_fingerprint";

export type DuplicateDetectionType =
  | "none"
  | "exact_duplicate"
  | "possible_revision"
  | "same_period_related_document"
  | "metadata_conflict";

export type DuplicateDetectionResult = {
  type: DuplicateDetectionType;
  confidence: "high" | "medium" | "low";
  existingPackageIds: string[];
  reasons: DuplicateMatchReason[];
  existingFileName?: string;
  existingUploadedAt?: string;
  existingCompanyName?: string;
  existingReportPeriod?: string;
};

export type PackageRelationship =
  | "original"
  | "revision"
  | "supplement"
  | "replacement"
  | "superseded";

export type ReportingPackageVersion = {
  packageId: string;
  versionNumber: number;
  relationship: PackageRelationship;
  previousPackageId?: string;
  activeVersion: boolean;
  createdAt: string;
  createdBy: string;
  replaceReason?: string;
};

export type DetectedMetadataField<T> = {
  value?: T;
  confidence: "high" | "medium" | "low";
  evidenceText?: string;
  page?: number;
};

export type DetectedPackageMetadata = {
  companyName: DetectedMetadataField<string>;
  reportingPeriod: DetectedMetadataField<string>;
  currency: DetectedMetadataField<string>;
  website: DetectedMetadataField<string>;
  reportingContactEmail: DetectedMetadataField<string>;
  sourceFormat: DetectedMetadataField<string>;
};

export type MetricRequirement =
  | "required"
  | "optional"
  | "not_applicable"
  | "not_configured";

export type MetricExpectationReasonSource =
  | "sector_default"
  | "sector_policy"
  | "company_override"
  | "company_policy"
  | "investment_team_decision"
  | "confirmed_ai_suggestion"
  | "historical_reporting"
  | "ai_suggestion"
  | "manual"
  | "other";

export type MetricExpectation = {
  id: string;
  metricDefinitionId: string;
  metricName: MetricName | string;
  sector?: string;
  companyId?: string;
  reportingFrequency?: string;
  requirement: MetricRequirement;
  reason?: string;
  reasonSource: MetricExpectationReasonSource;
  configuredBy?: string;
  configuredAt?: string;
};

export type MetricResolutionState =
  | "Found"
  | "Found — needs validation"
  | "Approved"
  | "Missing from report"
  | "Optional metric not reported"
  | "Not applicable"
  | "Not configured"
  | "Needs clarification"
  | "Extraction failed"
  | "Conflicting values found";

export type CompanyContactType =
  | "primary_reporting"
  | "finance"
  | "executive"
  | "operations"
  | "other";

export type CompanyContact = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role?: string;
  contactType: CompanyContactType;
  isPrimary: boolean;
  source: "manual" | "pdf_extracted" | "imported";
  sourcePackageId?: string;
  sourcePage?: number;
  sourceEvidence?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationTemplateCategory =
  | "missing_required_metrics"
  | "report_overdue"
  | "revised_report_requested"
  | "metric_clarification"
  | "conflicting_values"
  | "unreadable_source"
  | "reporting_reminder"
  | "follow_up_reminder";

export type CommunicationTemplate = {
  id: string;
  name: string;
  category: CommunicationTemplateCategory;
  subject: string;
  body: string;
  active: boolean;
  version: number;
  updatedBy?: string;
  updatedAt: string;
  createdAt: string;
};

export type CompanyCommunicationType =
  | "missing_metrics_request"
  | "report_overdue"
  | "revision_request"
  | "clarification"
  | "reminder";

export type CompanyCommunicationStatus =
  | "draft"
  | "sent"
  | "copied"
  | "cancelled"
  | "response_received"
  | "closed";

export type CompanyCommunication = {
  id: string;
  companyId: string;
  packageId?: string;
  reportingPeriod?: string;
  contactId?: string;
  type: CompanyCommunicationType;
  subject: string;
  body: string;
  requestedMetricIds?: string[];
  requestedMetricNames?: string[];
  requestedDueDate?: string;
  status: CompanyCommunicationStatus;
  sentBy?: string;
  sentAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyAlias = {
  id: string;
  companyId: string;
  alias: string;
  aliasType: "former_name" | "legal_name" | "trade_name" | "abbreviation";
};

export type PortfolioAuditEntityType =
  | "company"
  | "package"
  | "metric"
  | "communication"
  | "template"
  | "contact"
  | "expectation"
  | "extraction_rule"
  | "upload_batch";

export type PortfolioAuditEvent = {
  id: string;
  entityType: PortfolioAuditEntityType;
  entityId: string;
  eventType: string;
  actorId: string;
  actorName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  batchOperationId?: string;
};

export type UploadFileDecision =
  | "process"
  | "skip"
  | "process_as_version"
  | "replace"
  | "supplement"
  | "awaiting";

export type UploadQueueFile = {
  id: string;
  fileName: string;
  fileSize: number;
  fileHash?: string;
  fingerprint?: string;
  state: UploadFileState;
  decision?: UploadFileDecision;
  detectedCompanyId?: string;
  detectedCompanyName?: string;
  detectedPeriod?: string;
  sourceFormat?: string;
  duplicate?: DuplicateDetectionResult;
  metadata?: DetectedPackageMetadata;
  readinessLabel: string;
  actionLabel: string;
  processingStage?: string;
  errorMessage?: string;
  packageId?: string;
  ocrRequired?: boolean;
  passwordProtected?: boolean;
  /** Client-only; not persisted. */
  file?: File;
};

export type UploadBatch = {
  id: string;
  state: UploadBatchState;
  createdAt: string;
  createdBy: string;
  files: UploadQueueFile[];
};

export type PortfolioPermission =
  | "canUploadReports"
  | "canReplacePackages"
  | "canOverrideDuplicates"
  | "canEditMetricExpectations"
  | "canViewMetricRequirements"
  | "canEditCompanyOverrides"
  | "canResetCompanyOverrides"
  | "canViewMetricAuditHistory"
  | "canConfirmMetricApplicability"
  | "canManageCompanyContacts"
  | "canSendCompanyMessages"
  | "canEditCommunicationTemplates"
  | "canEnterManualMetrics";

export type MetricApplicabilitySuggestion = {
  metricName: string;
  companyId: string;
  suggestion: "missing_required" | "possibly_not_applicable" | "not_configured" | "needs_clarification";
  confidence: ConfidenceLevel;
  rationale: string;
  recommendedReplacement?: string;
};

export type TemplateRenderContext = {
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  reporting_period?: string;
  report_name?: string;
  missing_metrics_list?: string;
  monitoring_reason?: string;
  requested_due_date?: string;
  reviewer_name?: string;
  reviewer_title?: string;
};

export type TemplateValidationIssue = {
  variable: string;
  kind: "unknown" | "unclosed" | "unavailable";
  message: string;
};
