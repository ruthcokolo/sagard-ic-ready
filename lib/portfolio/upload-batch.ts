import { hashFile, normalizeFileName } from "./file-hashing";
import { detectPackageDuplicate, type DuplicateCandidatePackage } from "./duplicate-detection";
import { detectPackageMetadata } from "./metadata-detection";
import { getDemoReportByFileName } from "./demo-report-catalog";
import type {
  UploadBatch,
  UploadBatchState,
  UploadFileState,
  UploadQueueFile,
} from "./monitoring-phase-types";
import type { PortfolioCompany } from "./types";

export function createUploadBatch(createdBy: string): UploadBatch {
  return {
    id: `batch-${Date.now()}`,
    state: "draft",
    createdAt: new Date().toISOString(),
    createdBy,
    files: [],
  };
}

export function summarizeUploadBatch(batch: UploadBatch) {
  const total = batch.files.length;
  const ready = batch.files.filter((f) => f.state === "ready").length;
  const duplicate = batch.files.filter((f) => f.state === "duplicate_found").length;
  const exactDuplicate = batch.files.filter(
    (f) => f.state === "duplicate_found" && f.duplicate?.type === "exact_duplicate"
  ).length;
  const needsInput = batch.files.filter((f) => f.state === "awaiting_input").length;
  const processing = batch.files.filter((f) => f.state === "processing").length;
  const processed = batch.files.filter((f) => f.state === "processed").length;
  const failed = batch.files.filter((f) => f.state === "failed").length;
  const skipped = batch.files.filter((f) => f.state === "skipped").length;
  const unsupported = batch.files.filter((f) =>
    Boolean(f.passwordProtected || f.errorMessage?.toLowerCase().includes("unsupported"))
  ).length;
  return {
    total,
    ready,
    duplicate,
    exactDuplicate,
    needsInput,
    processing,
    processed,
    failed,
    skipped,
    unsupported,
  };
}

export function deriveBatchState(batch: UploadBatch): UploadBatchState {
  const s = summarizeUploadBatch(batch);
  if (s.total === 0) return "draft";
  if (s.processing > 0) return "processing";
  if (s.ready > 0 && (s.duplicate > 0 || s.needsInput > 0)) return "partially_ready";
  if (s.processed + s.failed + s.skipped === s.total) {
    return s.failed > 0 ? "completed_with_errors" : "completed";
  }
  if (s.ready === s.total) return "partially_ready";
  return "validating";
}

export function getReadyFilesForBatch(batch: UploadBatch): UploadQueueFile[] {
  return batch.files.filter((f) => f.state === "ready" && f.decision !== "skip");
}

export function getDuplicateFilesForBatch(batch: UploadBatch): UploadQueueFile[] {
  return batch.files.filter((f) => f.state === "duplicate_found");
}

function readinessFor(file: UploadQueueFile): { readinessLabel: string; actionLabel: string } {
  if (file.passwordProtected) {
    return { readinessLabel: "Password protected", actionLabel: "Re-upload unlocked" };
  }
  if (file.ocrRequired) {
    return { readinessLabel: "OCR required", actionLabel: "Review OCR" };
  }
  if (file.duplicate?.type === "same_period_related_document") {
    return { readinessLabel: "Related document", actionLabel: "Classify" };
  }
  if (file.duplicate?.type === "metadata_conflict") {
    return { readinessLabel: "Metadata conflict", actionLabel: "Resolve" };
  }
  switch (file.state) {
    case "ready":
      return { readinessLabel: "Ready to process", actionLabel: "Process" };
    case "duplicate_found":
      return { readinessLabel: "Waiting for decision", actionLabel: "Review duplicate" };
    case "awaiting_input":
      return {
        readinessLabel: file.detectedPeriod
          ? "Needs company confirmation"
          : "Needs period confirmation",
        actionLabel: "Confirm",
      };
    case "processing":
      return { readinessLabel: "Processing", actionLabel: "…" };
    case "processed":
      return { readinessLabel: "Processed", actionLabel: "View" };
    case "failed":
      return { readinessLabel: "Failed", actionLabel: "Retry" };
    case "skipped":
      return { readinessLabel: "Skipped", actionLabel: "—" };
    default:
      return { readinessLabel: "Queued", actionLabel: "Wait" };
  }
}

export async function buildUploadQueueFile(
  file: File,
  packages: DuplicateCandidatePackage[],
  companies: PortfolioCompany[]
): Promise<UploadQueueFile> {
  const id = `uf-${normalizeFileName(file.name)}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let state: UploadFileState = "hashing";
  let fileHash: string | undefined;
  let passwordProtected = false;
  let ocrRequired = false;
  let errorMessage: string | undefined;

  try {
    fileHash = await hashFile(file);
  } catch {
    errorMessage = "Could not hash file";
  }

  const demo = getDemoReportByFileName(file.name);
  const metadata = detectPackageMetadata({
    fileName: file.name,
    knownCompanyNames: companies.map((c) => c.name).concat(demo ? [demo.companyName] : []),
  });

  const companyName = metadata.companyName.value;
  const company =
    companies.find((c) => c.name.toLowerCase() === companyName?.toLowerCase()) ??
    (demo?.companyId
      ? ({ id: demo.companyId, name: demo.companyName } as PortfolioCompany)
      : undefined);

  const period = metadata.reportingPeriod.value ?? demo?.reportingPeriod;

  const duplicate = detectPackageDuplicate(packages, {
    fileName: file.name,
    fileHash,
    fileSize: file.size,
    companyId: company?.id ?? demo?.companyId,
    reportPeriod: period,
  });

  if (duplicate.type === "exact_duplicate" || duplicate.type === "possible_revision") {
    state = "duplicate_found";
  } else if (duplicate.type === "same_period_related_document") {
    state = "duplicate_found";
  } else if (duplicate.type === "metadata_conflict") {
    state = "awaiting_input";
  } else if (!companyName || metadata.companyName.confidence === "low") {
    state = "awaiting_input";
  } else if (!period || metadata.reportingPeriod.confidence === "low") {
    state = "awaiting_input";
  } else {
    state = "ready";
  }

  if (metadata.sourceFormat.value === "Scanned PDF") {
    ocrRequired = true;
    if (state === "ready") state = "awaiting_input";
  }

  const base: UploadQueueFile = {
    id,
    fileName: file.name,
    fileSize: file.size,
    fileHash,
    state,
    detectedCompanyId: company?.id ?? demo?.companyId,
    detectedCompanyName: company?.name ?? companyName ?? demo?.companyName,
    detectedPeriod: period,
    sourceFormat: metadata.sourceFormat.value,
    duplicate: duplicate.type === "none" ? undefined : duplicate,
    metadata,
    readinessLabel: "",
    actionLabel: "",
    errorMessage,
    ocrRequired,
    passwordProtected,
    file,
    decision: state === "ready" ? "process" : "awaiting",
  };

  const labels = readinessFor(base);
  return { ...base, ...labels };
}

/** Treat earlier queue rows as duplicate candidates so in-batch re-adds are flagged. */
function queueFileAsDuplicateCandidate(file: UploadQueueFile): DuplicateCandidatePackage {
  return {
    id: file.id,
    companyId: file.detectedCompanyId ?? "",
    companyName: file.detectedCompanyName ?? "",
    fileName: file.fileName,
    reportPeriod: file.detectedPeriod ?? "",
    uploadedAt: new Date().toISOString(),
    runCount: 0,
    status: "Processed",
    pagesProcessed: 0,
    metricsExtracted: 0,
    needsValidation: 0,
    missingMetrics: 0,
    coverage: 0,
    sourceFormat: "Company-formatted PDF",
    fileHash: file.fileHash,
    fileSize: file.fileSize,
  };
}

export async function enrichBatchWithFiles(
  batch: UploadBatch,
  files: File[],
  packages: DuplicateCandidatePackage[],
  companies: PortfolioCompany[]
): Promise<UploadBatch> {
  const candidates: DuplicateCandidatePackage[] = [
    ...packages,
    ...batch.files
      .filter((f) => f.state !== "skipped" && f.state !== "failed")
      .map(queueFileAsDuplicateCandidate),
  ];
  const built: UploadQueueFile[] = [];
  for (const file of files) {
    const nextFile = await buildUploadQueueFile(file, candidates, companies);
    built.push(nextFile);
    // Later files in the same drop must see earlier ones in this batch.
    if (nextFile.state !== "skipped" && nextFile.state !== "failed") {
      candidates.push(queueFileAsDuplicateCandidate(nextFile));
    }
  }
  const next = { ...batch, files: [...batch.files, ...built] };
  return { ...next, state: deriveBatchState(next) };
}
