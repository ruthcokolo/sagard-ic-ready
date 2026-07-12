"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { collectPdfFilesFromUpload, uniquePdfFiles } from "@/lib/portfolio/bulk-upload";
import { isDemoReportsEnabled } from "@/lib/portfolio/demo-report-catalog";
import type { UploadBatch, UploadQueueFile } from "@/lib/portfolio/monitoring-phase-types";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";
import {
  createUploadBatch,
  deriveBatchState,
  enrichBatchWithFiles,
  getReadyFilesForBatch,
  summarizeUploadBatch,
} from "@/lib/portfolio/upload-batch";
import { DuplicateFileDialog } from "./DuplicateFileDialog";
import { DemoPdfLibraryButton } from "./DemoPdfLibraryButton";
import {
  CompanyConfirmationDialog,
  MetadataConflictDialog,
  RelatedDocumentDialog,
  ReportingPeriodConfirmationDialog,
} from "./UploadDecisionDialogs";
import { UploadBatchSummary, UploadFileQueue } from "./UploadBatchSummary";

const PROCESS_CONCURRENCY = 3;

export function BatchUploadDrawer({
  open,
  onClose,
  onOpenPackage,
}: {
  open: boolean;
  onClose: () => void;
  onOpenPackage?: (packageId: string) => void;
}) {
  const { user } = useAuth();
  const { state, uploadAndProcessPdf } = usePortfolio();
  const canUpload = hasPortfolioPermission(user?.role, "canUploadReports");
  const [batch, setBatch] = useState<UploadBatch>(() =>
    createUploadBatch(user?.name ?? "Associate")
  );
  const [reviewFile, setReviewFile] = useState<UploadQueueFile | null>(null);
  const [relatedFile, setRelatedFile] = useState<UploadQueueFile | null>(null);
  const [confirmFile, setConfirmFile] = useState<UploadQueueFile | null>(null);
  const [companyConfirmFile, setCompanyConfirmFile] = useState<UploadQueueFile | null>(null);
  const [periodConfirmFile, setPeriodConfirmFile] = useState<UploadQueueFile | null>(null);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [menuFileId, setMenuFileId] = useState<string | null>(null);
  const [moreFooterOpen, setMoreFooterOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const packagesRef = useRef(state.packages);
  packagesRef.current = state.packages;
  const batchRef = useRef(batch);
  batchRef.current = batch;

  const summary = useMemo(() => summarizeUploadBatch(batch), [batch]);
  const readyCount = summary.ready;

  const hasUnresolved = batch.files.some(
    (f) =>
      f.state === "ready" ||
      f.state === "awaiting_input" ||
      f.state === "duplicate_found" ||
      f.state === "processing" ||
      f.state === "queued" ||
      f.state === "hashing" ||
      f.state === "detecting_metadata"
  );

  const requestClose = useCallback(() => {
    if (hasUnresolved) {
      setCloseConfirm(true);
      return;
    }
    onClose();
  }, [hasUnresolved, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  useEffect(() => {
    if (!moreFooterOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-upload-footer-more]")) return;
      setMoreFooterOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreFooterOpen]);

  useEffect(() => {
    if (!menuFileId) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("[data-upload-menu]") || t?.closest("[data-upload-row-menu]")) return;
      setMenuFileId(null);
    };
    // Capture phase so we close before row handlers re-toggle.
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [menuFileId]);

  const enqueueFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setBusy(true);
      setMessage(null);
      try {
        // Use only packages that actually exist after reset/upload.
        // Do not seed a synthetic Sagard package just because the demo PDF was selected.
        const packages = packagesRef.current;
        const base =
          batchRef.current.files.length === 0
            ? createUploadBatch(user?.name ?? "Associate")
            : batchRef.current;
        const next = await enrichBatchWithFiles(base, files, packages, state.companies);
        setBatch({ ...next, state: deriveBatchState(next) });
      } finally {
        setBusy(false);
      }
    },
    [state.companies, user?.name]
  );

  const onPick = async (list: FileList | null) => {
    if (!list?.length) return;
    const pdfs = uniquePdfFiles(await collectPdfFilesFromUpload([...list]));
    await enqueueFiles(pdfs);
  };

  const patchFile = (id: string, patch: Partial<UploadQueueFile>) => {
    setBatch((b) => {
      const next = {
        ...b,
        files: b.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      };
      return { ...next, state: deriveBatchState(next) };
    });
  };

  const markReady = (id: string, patch: Partial<UploadQueueFile> = {}) => {
    patchFile(id, {
      state: "ready",
      decision: "process",
      readinessLabel: "Ready to process",
      actionLabel: "Process",
      ...patch,
    });
  };

  const processOne = async (file: UploadQueueFile) => {
    if (!file.file || !canUpload) return;
    patchFile(file.id, {
      state: "processing",
      readinessLabel: "Processing",
      actionLabel: "…",
      processingStage: "Reading file",
    });
    await new Promise((r) => setTimeout(r, 40));
    patchFile(file.id, { processingStage: "Extracting metrics" });
    const result = await uploadAndProcessPdf({
      file: file.file,
      companyId: file.detectedCompanyId,
      reportPeriod: file.detectedPeriod,
      fileHash: file.fileHash,
      asVersion:
        file.decision === "process_as_version" || file.decision === "supplement",
      replacePackageId:
        file.decision === "replace" ? file.duplicate?.existingPackageIds[0] : undefined,
      previousPackageId:
        file.decision === "process_as_version" || file.decision === "supplement"
          ? file.duplicate?.existingPackageIds[0]
          : undefined,
    });
    patchFile(file.id, {
      state: result.success ? "processed" : "failed",
      readinessLabel: result.success ? "Processed" : "Failed",
      actionLabel: result.success ? "View" : "Retry",
      packageId: result.packageId,
      processingStage: undefined,
      errorMessage: result.success ? undefined : result.message,
    });
  };

  const processReadyAll = async () => {
    const ready = getReadyFilesForBatch(batchRef.current);
    if (!ready.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < ready.length; i += PROCESS_CONCURRENCY) {
        const slice = ready.slice(i, i + PROCESS_CONCURRENCY);
        await Promise.allSettled(slice.map((f) => processOne(f)));
      }
      setMessage("Ready files processed. Unresolved files can remain in the queue.");
    } finally {
      setBusy(false);
    }
  };

  const openReview = (file: UploadQueueFile, force?: "company" | "period") => {
    setMenuFileId(null);
    if (force === "company" || file.readinessLabel.toLowerCase().includes("company")) {
      setCompanyConfirmFile(file);
      return;
    }
    if (force === "period" || file.readinessLabel.toLowerCase().includes("period")) {
      setPeriodConfirmFile(file);
      return;
    }
    if (file.duplicate?.type === "same_period_related_document") {
      setRelatedFile(file);
      return;
    }
    if (file.duplicate?.type === "metadata_conflict") {
      setConfirmFile(file);
      return;
    }
    if (file.duplicate) {
      setReviewFile(file);
      return;
    }
    if (file.state === "awaiting_input") {
      if (!file.detectedCompanyName) {
        setCompanyConfirmFile(file);
        return;
      }
      setPeriodConfirmFile(file);
      return;
    }
    setConfirmFile(file);
  };

  const onPrimary = (file: UploadQueueFile) => {
    if (file.passwordProtected) {
      onMenuAction(file, "remove");
      return;
    }
    if (file.state === "processed" && file.packageId) {
      onOpenPackage?.(file.packageId);
      return;
    }
    if (file.state === "ready" || (file.state === "failed" && file.file)) {
      void processOne(file);
      return;
    }
    openReview(file);
  };

  const onMenuAction = (file: UploadQueueFile, action: string) => {
    setMenuFileId(null);
    if (action === "remove") {
      setBatch((b) => {
        const next = { ...b, files: b.files.filter((f) => f.id !== file.id) };
        return { ...next, state: deriveBatchState(next) };
      });
      return;
    }
    if (action === "skip") {
      patchFile(file.id, {
        state: "skipped",
        decision: "skip",
        readinessLabel: "Skipped",
        actionLabel: "—",
      });
      return;
    }
    if (action === "preview" && file.file) {
      const url = URL.createObjectURL(file.file);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }
    if (action === "review_duplicate") {
      openReview(file);
      return;
    }
    if (action === "edit_company") {
      openReview(file, "company");
      return;
    }
    if (action === "edit_period") {
      openReview(file, "period");
      return;
    }
    if (action === "edit_format") {
      setMessage("Format is detected from the PDF. Re-upload if the format looks wrong.");
      return;
    }
    if (action === "process_version") {
      void processOne({ ...file, decision: "process_as_version" });
      return;
    }
    if (action === "replace") {
      if (!hasPortfolioPermission(user?.role, "canReplacePackages")) {
        setMessage("You do not have permission to replace packages.");
        return;
      }
      void processOne({ ...file, decision: "replace" });
      return;
    }
    if (action === "view_error" && file.errorMessage) {
      setMessage(file.errorMessage);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-stone-900/35">
      <button type="button" className="absolute inset-0" aria-label="Close overlay" onClick={requestClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-drawer-title"
        className="relative z-10 flex h-full w-full max-w-full flex-col bg-white shadow-2xl md:w-[min(1150px,max(900px,65vw))] md:max-w-[min(1150px,92vw)]"
      >
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-6 py-5">
          <div className="min-w-0">
            <h2 id="upload-drawer-title" className="font-display text-[1.75rem] leading-tight text-[#63202e]">
              Upload reporting packages
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500">
              Each file is validated independently. One problem file does not block the rest of the
              batch.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-700"
            aria-label="Close upload drawer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Drop zone + summary */}
        <div className="shrink-0 space-y-3 px-6 pt-4">
          {!canUpload ? (
            <p className="text-sm text-red-700">You do not have permission to upload reports.</p>
          ) : null}

          <div
            className={`rounded-xl border border-dashed px-4 py-5 text-center transition ${
              dragOver
                ? "border-[#63202e] bg-[#fdf2f4]"
                : "border-stone-300 bg-[#faf9f7]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void onPick(e.dataTransfer.files);
            }}
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7a3344] shadow-sm ring-1 ring-stone-200">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
            </div>
            <p className="mt-3 text-sm font-semibold text-stone-800">Drag and drop PDFs or a folder</p>
            <p className="mt-1 text-[12px] text-stone-500">ZIP archives are expanded automatically.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={!canUpload || busy}
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-9 items-center rounded-lg bg-[#63202e] px-3.5 text-[13px] font-semibold text-white hover:bg-[#521a26] disabled:opacity-40"
              >
                Choose files
              </button>
              <button
                type="button"
                disabled={!canUpload || busy}
                onClick={() => folderRef.current?.click()}
                className="inline-flex h-9 items-center rounded-lg border border-[#7a3344]/50 bg-white px-3.5 text-[13px] font-semibold text-[#7a3344] hover:bg-[#fdf2f4]"
              >
                Choose folder
              </button>
              {isDemoReportsEnabled() ? (
                <DemoPdfLibraryButton
                  disabled={busy}
                  onLoad={async (files) => {
                    await enqueueFiles(files);
                  }}
                />
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.zip,application/pdf,application/zip"
              multiple
              className="hidden"
              onChange={(e) => void onPick(e.target.files)}
            />
            <input
              ref={folderRef}
              type="file"
              // @ts-expect-error non-standard folder attribute
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={(e) => void onPick(e.target.files)}
            />
          </div>

          <UploadBatchSummary batch={batch} />
          {message ? <p className="text-[12px] text-stone-600">{message}</p> : null}
        </div>

        {/* Scrollable queue */}
        <div className="min-h-0 flex-1 overflow-hidden px-6 py-3 pb-4" data-upload-menu>
          <UploadFileQueue
            batch={batch}
            menuFileId={menuFileId}
            onToggleMenu={(id) => setMenuFileId((cur) => (cur === id ? null : id))}
            onPrimary={onPrimary}
            onMenuAction={onMenuAction}
          />
        </div>

        {/* Sticky footer: Close · More actions · Process ready */}
        <footer className="flex shrink-0 flex-nowrap items-center justify-between gap-3 border-t border-stone-200 bg-white px-6 py-3.5">
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-9 shrink-0 items-center rounded-lg border border-stone-200 bg-white px-3.5 text-[13px] font-semibold text-stone-700 hover:bg-stone-50"
          >
            Close
          </button>

          <div className="flex flex-nowrap items-center justify-end gap-2">
            <div className="relative" data-upload-footer-more>
              <button
                type="button"
                aria-expanded={moreFooterOpen}
                aria-haspopup="menu"
                onClick={() => setMoreFooterOpen((v) => !v)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#7a3344]/40 bg-white px-3 text-[12px] font-semibold text-[#7a3344] hover:bg-[#fdf2f4]"
              >
                More actions
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {moreFooterOpen ? (
                <div
                  role="menu"
                  className="absolute bottom-10 right-0 z-30 w-56 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
                >
                  <FooterMenuItem
                    label="Skip duplicates"
                    count={summary.exactDuplicate}
                    disabled={summary.exactDuplicate === 0}
                    title={
                      summary.exactDuplicate === 0
                        ? "No exact duplicates in the queue"
                        : "Skip exact duplicate files only"
                    }
                    onClick={() => {
                      setMoreFooterOpen(false);
                      setBatch((b) => {
                        const next = {
                          ...b,
                          files: b.files.map((f) =>
                            f.duplicate?.type === "exact_duplicate"
                              ? {
                                  ...f,
                                  state: "skipped" as const,
                                  decision: "skip" as const,
                                  readinessLabel: "Skipped",
                                  actionLabel: "—",
                                }
                              : f
                          ),
                        };
                        return { ...next, state: deriveBatchState(next) };
                      });
                    }}
                  />
                  <FooterMenuItem
                    label="Review duplicates"
                    count={summary.duplicate}
                    disabled={summary.duplicate === 0}
                    title={
                      summary.duplicate === 0
                        ? "No duplicates waiting for review"
                        : "Open the first unresolved duplicate"
                    }
                    onClick={() => {
                      setMoreFooterOpen(false);
                      const first = batch.files.find(
                        (f) => f.state === "duplicate_found" && f.duplicate
                      );
                      if (first) openReview(first);
                      else setMessage("No duplicates waiting for review.");
                    }}
                  />
                  <FooterMenuItem
                    label="Remove failed"
                    count={summary.failed}
                    disabled={summary.failed === 0}
                    title={
                      summary.failed === 0
                        ? "No failed files in the queue"
                        : "Remove failed queue rows only"
                    }
                    danger
                    onClick={() => {
                      setMoreFooterOpen(false);
                      setBatch((b) => {
                        const next = {
                          ...b,
                          files: b.files.filter((f) => f.state !== "failed"),
                        };
                        return { ...next, state: deriveBatchState(next) };
                      });
                    }}
                  />
                  <FooterMenuItem
                    label="Clear completed"
                    count={summary.processed + summary.skipped}
                    disabled={summary.processed + summary.skipped === 0}
                    title={
                      summary.processed + summary.skipped === 0
                        ? "No processed or skipped files to clear"
                        : "Clear processed and skipped rows from the local queue"
                    }
                    onClick={() => {
                      setMoreFooterOpen(false);
                      setBatch((b) => {
                        const next = {
                          ...b,
                          files: b.files.filter(
                            (f) => f.state !== "processed" && f.state !== "skipped"
                          ),
                        };
                        return { ...next, state: deriveBatchState(next) };
                      });
                    }}
                  />
                </div>
              ) : null}
            </div>

            <button
              type="button"
              disabled={!canUpload || busy || readyCount === 0}
              onClick={() => void processReadyAll()}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#63202e] pl-4 pr-2 text-[13px] font-semibold text-white hover:bg-[#521a26] disabled:opacity-40"
            >
              Process ready
              <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold tabular-nums text-[#63202e]">
                {readyCount}
              </span>
            </button>
          </div>
        </footer>
      </aside>

      {closeConfirm ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-stone-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-stone-900">Close upload queue?</h3>
            <p className="mt-2 text-sm text-stone-600">
              Some files are still waiting for confirmation or processing.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloseConfirm(false)}
                className="rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
              >
                Keep working
              </button>
              <button
                type="button"
                onClick={() => {
                  setCloseConfirm(false);
                  onClose();
                }}
                className="rounded-lg bg-[#63202e] px-3.5 py-2 text-sm font-semibold text-white"
              >
                Close queue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewFile?.duplicate ? (
        <DuplicateFileDialog
          fileName={reviewFile.fileName}
          actorName={user?.name?.split(" ")[0] ?? "Alex"}
          duplicate={reviewFile.duplicate}
          onCancel={() => setReviewFile(null)}
          onViewExisting={() => {
            const id = reviewFile.duplicate?.existingPackageIds[0];
            if (id) onOpenPackage?.(id);
            setReviewFile(null);
          }}
          onSkip={() => {
            patchFile(reviewFile.id, {
              state: "skipped",
              decision: "skip",
              readinessLabel: "Skipped",
              actionLabel: "—",
            });
            setReviewFile(null);
          }}
          onProcessAsVersion={() => {
            const next = { ...reviewFile, decision: "process_as_version" as const };
            setReviewFile(null);
            void processOne(next);
          }}
          onReplace={() => {
            if (!hasPortfolioPermission(user?.role, "canReplacePackages")) {
              setMessage("You do not have permission to replace packages.");
              return;
            }
            const next = { ...reviewFile, decision: "replace" as const };
            setReviewFile(null);
            void processOne(next);
          }}
          onTreatAsSeparate={() => {
            const next = {
              ...reviewFile,
              decision: "process" as const,
              duplicate: undefined,
            };
            setReviewFile(null);
            void processOne(next);
          }}
        />
      ) : null}

      {relatedFile?.duplicate ? (
        <RelatedDocumentDialog
          fileName={relatedFile.fileName}
          duplicate={relatedFile.duplicate}
          onCancel={() => setRelatedFile(null)}
          onClassify={(decision) => {
            const file = relatedFile;
            setRelatedFile(null);
            if (decision === "skip") {
              patchFile(file.id, {
                state: "skipped",
                decision: "skip",
                readinessLabel: "Skipped",
                actionLabel: "—",
              });
              return;
            }
            if (decision === "revision") {
              void processOne({ ...file, decision: "process_as_version" });
              return;
            }
            if (decision === "supplement") {
              void processOne({ ...file, decision: "supplement" });
              return;
            }
            void processOne({ ...file, decision: "process", duplicate: undefined });
          }}
        />
      ) : null}

      {confirmFile ? (
        <MetadataConflictDialog
          fileName={confirmFile.fileName}
          selectedCompany={confirmFile.detectedCompanyName}
          detectedCompany={confirmFile.metadata?.companyName.value}
          selectedPeriod={confirmFile.detectedPeriod}
          detectedPeriod={confirmFile.metadata?.reportingPeriod.value}
          onCancel={() => setConfirmFile(null)}
          onKeepSelected={() => {
            markReady(confirmFile.id);
            setConfirmFile(null);
          }}
          onUseDetected={() => {
            const detectedName = confirmFile.metadata?.companyName.value;
            const company = state.companies.find(
              (c) => c.name.toLowerCase() === detectedName?.toLowerCase()
            );
            markReady(confirmFile.id, {
              detectedCompanyId: company?.id ?? confirmFile.detectedCompanyId,
              detectedCompanyName: detectedName ?? confirmFile.detectedCompanyName,
              detectedPeriod:
                confirmFile.metadata?.reportingPeriod.value ?? confirmFile.detectedPeriod,
            });
            setConfirmFile(null);
          }}
        />
      ) : null}

      {companyConfirmFile ? (
        <CompanyConfirmationDialog
          companyName={companyConfirmFile.detectedCompanyName}
          confidence={companyConfirmFile.metadata?.companyName.confidence}
          evidence={
            companyConfirmFile.metadata?.companyName.evidenceText ??
            "Company name found in filename or cover page"
          }
          companies={state.companies.map((c) => ({ id: c.id, name: c.name }))}
          onCancel={() => setCompanyConfirmFile(null)}
          onConfirm={() => {
            markReady(companyConfirmFile.id);
            setCompanyConfirmFile(null);
          }}
          onChooseAnother={(id, name) => {
            markReady(companyConfirmFile.id, {
              detectedCompanyId: id,
              detectedCompanyName: name,
            });
            setCompanyConfirmFile(null);
          }}
          onCreateNew={() => {
            setMessage(
              "Create the company from Portfolio Companies first, then choose it here. Companies are not created from the upload queue."
            );
            setCompanyConfirmFile(null);
          }}
        />
      ) : null}

      {periodConfirmFile ? (
        <ReportingPeriodConfirmationDialog
          detectedPeriod={periodConfirmFile.detectedPeriod}
          otherPeriod={
            periodConfirmFile.metadata?.reportingPeriod.value !==
            periodConfirmFile.detectedPeriod
              ? periodConfirmFile.metadata?.reportingPeriod.value
              : undefined
          }
          evidence={
            periodConfirmFile.metadata?.reportingPeriod.evidenceText ??
            "Period inferred from filename and document text"
          }
          onCancel={() => setPeriodConfirmFile(null)}
          onConfirm={(period) => {
            markReady(periodConfirmFile.id, { detectedPeriod: period });
            setPeriodConfirmFile(null);
          }}
          onChooseAnother={() => {
            const next = window.prompt(
              "Enter reporting period (e.g. Q2 2026)",
              periodConfirmFile.detectedPeriod ?? ""
            );
            if (!next?.trim()) return;
            markReady(periodConfirmFile.id, { detectedPeriod: next.trim() });
            setPeriodConfirmFile(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** Alias matching the planned component name. */
export const UploadReportingPackagesDrawer = BatchUploadDrawer;

function FooterMenuItem({
  label,
  count,
  disabled,
  title,
  danger,
  onClick,
}: {
  label: string;
  count: number;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12px] disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? "text-red-700 hover:bg-red-50" : "text-stone-700 hover:bg-stone-50"
      }`}
    >
      <span className="font-medium">{label}</span>
      <span className="tabular-nums text-stone-400">{count}</span>
    </button>
  );
}
