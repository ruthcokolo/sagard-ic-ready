/**
 * Duplicate package detection by hash, fingerprint, filename, and period signals.
 */

import { normalizeFileName } from "./file-hashing";
import { documentSimilarity } from "./document-fingerprint";
import type {
  DuplicateDetectionResult,
  DuplicateMatchReason,
} from "./monitoring-phase-types";
import type { ReportingPackage } from "./types";

export type DuplicateCandidatePackage = ReportingPackage & {
  fileHash?: string;
  fileSize?: number;
  documentFingerprint?: string;
  contentTextSample?: string;
};

export type DuplicateDetectionInput = {
  fileName: string;
  fileHash?: string;
  fileSize?: number;
  companyId?: string;
  reportPeriod?: string;
  contentTextSample?: string;
  fingerprint?: string;
};

/**
 * Multi-level duplicate detection.
 * Exact hash → exact_duplicate; same name different hash → possible_revision;
 * same company+period → related; content similarity → optional boost.
 */
export function detectPackageDuplicate(
  packages: DuplicateCandidatePackage[],
  input: DuplicateDetectionInput
): DuplicateDetectionResult {
  const reasons: DuplicateMatchReason[] = [];
  const matched = new Map<string, DuplicateCandidatePackage>();

  if (input.fileHash) {
    for (const pkg of packages) {
      if (pkg.fileHash && pkg.fileHash === input.fileHash) {
        matched.set(pkg.id, pkg);
        reasons.push("same_file_hash");
      }
    }
  }

  if (reasons.includes("same_file_hash")) {
    const existing = [...matched.values()][0];
    return {
      type: "exact_duplicate",
      confidence: "high",
      existingPackageIds: [...matched.keys()],
      reasons: uniqueReasons(reasons.concat(sharedMetaReasons(existing, input))),
      existingFileName: existing?.fileName,
      existingUploadedAt: existing?.uploadedAt,
      existingCompanyName: existing?.companyName,
      existingReportPeriod: existing?.reportPeriod,
    };
  }

  const normName = normalizeFileName(input.fileName);
  for (const pkg of packages) {
    if (normalizeFileName(pkg.fileName) === normName) {
      matched.set(pkg.id, pkg);
      reasons.push("same_normalized_filename");
      if (
        input.fileSize != null &&
        pkg.fileSize != null &&
        pkg.fileSize === input.fileSize
      ) {
        reasons.push("same_file_size");
      }
    }
  }

  if (reasons.includes("same_normalized_filename") && input.fileHash) {
    // Same name, different hash → revision
    const existing = [...matched.values()][0];
    return {
      type: "possible_revision",
      confidence: "high",
      existingPackageIds: [...matched.keys()],
      reasons: uniqueReasons(reasons.concat(sharedMetaReasons(existing, input))),
      existingFileName: existing?.fileName,
      existingUploadedAt: existing?.uploadedAt,
      existingCompanyName: existing?.companyName,
      existingReportPeriod: existing?.reportPeriod,
    };
  }

  for (const pkg of packages) {
    if (
      input.companyId &&
      input.reportPeriod &&
      pkg.companyId === input.companyId &&
      pkg.reportPeriod === input.reportPeriod
    ) {
      matched.set(pkg.id, pkg);
      reasons.push("same_company", "same_reporting_period");
    }
  }

  if (input.contentTextSample || input.fingerprint) {
    for (const pkg of packages) {
      let sim = 0;
      if (input.fingerprint && pkg.documentFingerprint) {
        sim = documentSimilarity(
          input.fingerprint.replace(/\|/g, " "),
          pkg.documentFingerprint.replace(/\|/g, " ")
        );
      } else if (input.contentTextSample && pkg.contentTextSample) {
        sim = documentSimilarity(input.contentTextSample, pkg.contentTextSample);
      }
      if (sim >= 0.72) {
        matched.set(pkg.id, pkg);
        reasons.push("high_content_similarity");
        if (sim >= 0.9) reasons.push("same_document_fingerprint");
      }
    }
  }

  if (matched.size === 0) {
    return { type: "none", confidence: "high", existingPackageIds: [], reasons: [] };
  }

  const existing = [...matched.values()][0];
  const uniq = uniqueReasons(reasons);

  if (
    uniq.includes("same_normalized_filename") &&
    !uniq.includes("same_file_hash")
  ) {
    return {
      type: "possible_revision",
      confidence: "medium",
      existingPackageIds: [...matched.keys()],
      reasons: uniq,
      existingFileName: existing.fileName,
      existingUploadedAt: existing.uploadedAt,
      existingCompanyName: existing.companyName,
      existingReportPeriod: existing.reportPeriod,
    };
  }

  if (uniq.includes("same_company") && uniq.includes("same_reporting_period")) {
    return {
      type: "same_period_related_document",
      confidence: uniq.includes("high_content_similarity") ? "medium" : "low",
      existingPackageIds: [...matched.keys()],
      reasons: uniq,
      existingFileName: existing.fileName,
      existingUploadedAt: existing.uploadedAt,
      existingCompanyName: existing.companyName,
      existingReportPeriod: existing.reportPeriod,
    };
  }

  return {
    type: "metadata_conflict",
    confidence: "low",
    existingPackageIds: [...matched.keys()],
    reasons: uniq,
    existingFileName: existing.fileName,
    existingUploadedAt: existing.uploadedAt,
    existingCompanyName: existing.companyName,
    existingReportPeriod: existing.reportPeriod,
  };
}

function sharedMetaReasons(
  pkg: DuplicateCandidatePackage | undefined,
  input: DuplicateDetectionInput
): DuplicateMatchReason[] {
  if (!pkg) return [];
  const out: DuplicateMatchReason[] = [];
  if (input.companyId && pkg.companyId === input.companyId) out.push("same_company");
  if (input.reportPeriod && pkg.reportPeriod === input.reportPeriod) {
    out.push("same_reporting_period");
  }
  if (normalizeFileName(pkg.fileName) === normalizeFileName(input.fileName)) {
    out.push("same_normalized_filename");
  }
  return out;
}

function uniqueReasons(reasons: DuplicateMatchReason[]): DuplicateMatchReason[] {
  return [...new Set(reasons)];
}

/** Human-readable reason labels for the duplicate dialog. */
export function duplicateReasonLabels(reasons: DuplicateMatchReason[]): string[] {
  const labels: Record<DuplicateMatchReason, string> = {
    same_file_hash: "Identical file contents",
    same_normalized_filename: "Same filename",
    same_company: "Same company",
    same_reporting_period: "Same reporting period",
    same_file_size: "Same file size",
    high_content_similarity: "High content similarity",
    same_document_fingerprint: "Same document fingerprint",
  };
  return reasons.map((r) => labels[r]);
}
