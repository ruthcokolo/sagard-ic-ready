"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { WorkflowExplainerCard } from "@/components/portfolio-monitoring/WorkflowExplainerCard";
import { ReportingPackagesStatsRow } from "@/components/portfolio-monitoring/ReportingPackagesStatsRow";
import {
  DEFAULT_PACKAGE_FILTERS,
  ReportingPackagesTable,
  type PackageFiltersState,
} from "@/components/portfolio-monitoring/ReportingPackagesTable";
import { ReportingPackagesUploadPanel } from "@/components/portfolio-monitoring/ReportingPackagesUploadPanel";
import { PackageDetailsDrawer } from "@/components/portfolio-monitoring/PackageDetailsDrawer";
import { DemoFlowChecklist } from "@/components/portfolio-monitoring/DemoFlowChecklist";
import { BatchUploadDrawer } from "@/components/portfolio-monitoring/upload/BatchUploadDrawer";
import { DuplicatePackageDialog } from "@/components/portfolio-monitoring/DuplicatePackageDialog";
import {
  computeReportingPackageStats,
  toReportingPackageRow,
  type ReportingPackageRow,
} from "@/lib/portfolio/reporting-packages-demo";
import {
  getSamplePdfForCompany,
  type SamplePdfSource,
} from "@/lib/portfolio/sample-pdf-catalog";
import { dedupePackages } from "@/lib/portfolio/store-utils";
import { findLikelyDuplicatePackage } from "@/lib/portfolio/reporting-packages-selectors";
import type { PackageSourceFormat, ReportingPackage } from "@/lib/portfolio/types";
import { detectMetadataFromFileName } from "@/lib/portfolio/reporting-packages-demo";
import { companyIdFromName } from "@/lib/portfolio/company-from-upload";

function PackageToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200/80 bg-white px-4 py-3 shadow-lg ring-1 ring-emerald-100"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        ✓
      </span>
      <p className="text-sm font-medium text-stone-800">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto shrink-0 text-stone-400 hover:text-stone-600"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function ReportingPackagesView() {
  const {
    state,
    uploadAndProcessPdf,
    processBulkUpload,
    deletePackage,
    downloadPackagePdf,
  } = usePortfolio();
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showBatchUpload, setShowBatchUpload] = useState(false);
  const [preferSample, setPreferSample] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filters, setFilters] = useState<PackageFiltersState>(DEFAULT_PACKAGE_FILTERS);
  const [selectedRow, setSelectedRow] = useState<ReportingPackageRow | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    existing: ReportingPackage;
    pending: {
      companyId?: string;
      reportPeriod?: string;
      file: File | null;
      useSample: boolean;
      sampleSource: SamplePdfSource;
      sourceFormatOverride?: PackageSourceFormat;
    };
  } | null>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  const isDemo =
    typeof process !== "undefined" && process.env.NODE_ENV !== "production";

  const livePackages = useMemo(() => dedupePackages(state.packages), [state.packages]);

  const companySectorById = useMemo(
    () => new Map(state.companies.map((company) => [company.id, company.sector])),
    [state.companies]
  );

  const displayRows = useMemo(() => {
    return livePackages.map((pkg) => {
      const row = toReportingPackageRow(
        pkg,
        state.metrics,
        "Alex Rivera",
        companySectorById.get(pkg.companyId) ?? "Unclassified"
      );
      const catalog = getSamplePdfForCompany(pkg.companyId, "company-formatted");
      const templateCatalog = getSamplePdfForCompany(pkg.companyId, "template");
      const match =
        pkg.sourceFormat === "ICReady template"
          ? templateCatalog ?? catalog
          : catalog ?? templateCatalog;
      return {
        ...row,
        fileUrl: match?.publicPath,
      };
    });
  }, [livePackages, state.metrics, companySectorById]);

  const stats = useMemo(
    () => computeReportingPackageStats(livePackages),
    [livePackages]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("failedOnly") === "1") {
      setFilters((f) => ({ ...f, failedOnly: true }));
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) {
        setUploadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function runUpload(input: {
    companyId?: string;
    reportPeriod?: string;
    file: File | null;
    useSample: boolean;
    sampleSource: SamplePdfSource;
    sourceFormatOverride?: PackageSourceFormat;
  }) {
    setProcessing(true);
    setMessage(null);
    setToast(null);
    const result = await uploadAndProcessPdf({
      file: input.file,
      companyId: input.companyId,
      reportPeriod: input.reportPeriod,
      useSample: input.useSample,
      sampleSource: input.sampleSource,
      sourceFormatOverride:
        input.sourceFormatOverride === "Company-formatted PDF" ||
        input.sourceFormatOverride === "ICReady template"
          ? input.sourceFormatOverride
          : undefined,
    });
    setProcessing(false);

    if (result.success) {
      if (result.reprocessed) {
        setToast(result.message);
        setMessage(null);
      } else {
        setMessage({ type: "success", text: result.message });
      }
      setShowUploadPanel(false);
      setUploadMenuOpen(false);
      setDuplicatePrompt(null);
      setSelectedRow(null);
    } else {
      setMessage({ type: "error", text: result.message });
    }
  }

  async function handleProcessSingle(
    input: {
      companyId?: string;
      reportPeriod?: string;
      file: File | null;
      useSample: boolean;
      sampleSource: SamplePdfSource;
      sourceFormatOverride?: PackageSourceFormat;
      confirmMetadataMismatch?: boolean;
    },
    options?: { allowReprocess?: boolean }
  ) {
    if (!input.useSample && !input.file) {
      setMessage({ type: "error", text: "Upload a PDF or use Load sample package." });
      return;
    }

    if (!options?.allowReprocess) {
      const fileName = input.useSample
        ? getSamplePdfForCompany(input.companyId ?? "", input.sampleSource)?.fileName
        : input.file?.name;
      const period =
        input.reportPeriod ||
        (input.file
          ? detectMetadataFromFileName(input.file.name, state.companies).reportPeriod
          : undefined) ||
        "Q2 2026";
      const companyId =
        input.companyId ||
        (input.file
          ? detectMetadataFromFileName(input.file.name, state.companies).companyId
          : undefined) ||
        (input.file
          ? companyIdFromName(
              detectMetadataFromFileName(input.file.name).companyName ?? "Unknown"
            )
          : undefined);

      if (fileName && companyId) {
        const existing = findLikelyDuplicatePackage(livePackages, {
          companyId,
          reportPeriod: period,
          fileName,
        });
        if (existing) {
          setDuplicatePrompt({
            existing,
            pending: {
              companyId,
              reportPeriod: period,
              file: input.file,
              useSample: input.useSample,
              sampleSource: input.sampleSource,
              sourceFormatOverride: input.sourceFormatOverride,
            },
          });
          return;
        }
      }
    }

    await runUpload(input);
  }

  async function handleProcessBulk(files: File[]) {
    if (files.length === 0) {
      setMessage({ type: "error", text: "Add at least one PDF, ZIP, or folder to upload." });
      return;
    }

    setProcessing(true);
    setMessage(null);
    setToast(null);
    const result = await processBulkUpload(files);
    setProcessing(false);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      setShowUploadPanel(false);
      setUploadMenuOpen(false);
      setSelectedRow(null);
    } else {
      setMessage({ type: "error", text: result.message });
    }
  }

  async function reprocessRow(row: ReportingPackageRow) {
    const sampleSource: SamplePdfSource =
      row.sourceFormat === "ICReady template" ? "template" : "company-formatted";
    const catalog = getSamplePdfForCompany(row.companyId, sampleSource);
    await handleProcessSingle(
      {
        companyId: row.companyId,
        reportPeriod: row.reportPeriod,
        file: null,
        useSample: !!catalog,
        sampleSource,
      },
      { allowReprocess: true }
    );
  }

  function openUpload(samplePreferred = false) {
    setPreferSample(samplePreferred);
    setMessage(null);
    setUploadMenuOpen(false);
    if (samplePreferred) {
      // Sample catalog still uses the focused single-file panel.
      setShowUploadPanel(true);
      return;
    }
    // Canonical upload path: batch drawer (single, multi, folder, demo library).
    setShowBatchUpload(true);
  }

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden px-4 pb-6 pt-7 sm:px-6 lg:px-8">
      {/* 1. Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <h1 className="font-display text-[2rem] leading-tight text-stone-900">Reporting packages</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
            Upload company-provided PDFs. ICReady extracts suggested metrics with source evidence.
          </p>
          <p className="mt-1 text-[12px] text-stone-400">
            Successful extractions are sent to Metric Review for validation.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowWorkflowGuide(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#63202e]/30 bg-white px-3.5 text-[13px] font-semibold text-[#63202e] hover:bg-[#fdf2f4]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Workflow guide
          </button>
          <div className="relative" ref={uploadMenuRef}>
            <div className="inline-flex h-9 overflow-hidden rounded-lg">
              <button
                type="button"
                onClick={() => openUpload(false)}
                className={`inline-flex items-center gap-2 bg-[#63202e] px-3.5 text-[13px] font-semibold text-white hover:bg-[#521a26] ${
                  isDemo ? "" : "rounded-lg"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Upload package
              </button>
              {isDemo ? (
                <button
                  type="button"
                  onClick={() => setUploadMenuOpen((v) => !v)}
                  className="border-l border-[#521a26] bg-[#63202e] px-2 text-white hover:bg-[#521a26]"
                  aria-label="Upload options"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : null}
            </div>
            {isDemo && uploadMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => openUpload(false)}
                  className="block w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                >
                  Upload PDFs / ZIP / folder
                </button>
                <button
                  type="button"
                  onClick={() => openUpload(true)}
                  className="block w-full px-4 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                >
                  Process sample package
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Package pipeline summary */}
      <div className="mt-5 shrink-0 min-w-0">
        <ReportingPackagesStatsRow stats={stats} />
      </div>

      {/* 3–4. Filters + table — fills remaining viewport */}
      <div className="mt-5 flex min-h-0 min-w-0 flex-1 flex-col">
        <ReportingPackagesTable
          rows={displayRows}
          filters={filters}
          onFiltersChange={setFilters}
          onOpenDetails={setSelectedRow}
          onRetry={(row) => reprocessRow(row)}
          onReprocess={(row) => reprocessRow(row)}
          onDelete={(row) => {
            if (window.confirm(`Delete package “${row.fileName}”? This cannot be undone.`)) {
              deletePackage(row.id);
              setSelectedRow(null);
              setToast("Package deleted.");
            }
          }}
          onDownload={(row) => {
            const ok = downloadPackagePdf(row.id);
            if (!ok && row.fileUrl) {
              void import("@/lib/portfolio/source-download").then(({ triggerSourceDownload }) =>
                triggerSourceDownload(row.fileUrl!, row.fileName)
              );
            }
          }}
          onUpload={() => openUpload(false)}
          onLoadSample={() => openUpload(true)}
          showDemoTools={isDemo}
        />
      </div>

      {showWorkflowGuide && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 px-4 py-10">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Workflow guide</h2>
                <p className="mt-1 text-sm text-stone-500">
                  How Reporting Packages moves PDFs from upload to Metric Review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkflowGuide(false)}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
              <WorkflowExplainerCard />
              {isDemo ? (
                <details className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-stone-700">
                    Demo tools
                  </summary>
                  <div className="mt-3">
                    <DemoFlowChecklist state={state} />
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showUploadPanel && (
        <ReportingPackagesUploadPanel
          preferSample={preferSample}
          companies={state.companies.map((c) => ({ id: c.id, name: c.name }))}
          onProcessSingle={handleProcessSingle}
          onProcessBulk={handleProcessBulk}
          processing={processing}
          message={message}
          onClose={() => {
            setShowUploadPanel(false);
            setMessage(null);
          }}
        />
      )}

      {duplicatePrompt ? (
        <DuplicatePackageDialog
          existing={duplicatePrompt.existing}
          onCancel={() => setDuplicatePrompt(null)}
          onViewExisting={() => {
            const row = displayRows.find((r) => r.id === duplicatePrompt.existing.id);
            setDuplicatePrompt(null);
            setShowUploadPanel(false);
            if (row) setSelectedRow(row);
          }}
          onUploadAsVersion={() => {
            const pending = duplicatePrompt.pending;
            setDuplicatePrompt(null);
            void handleProcessSingle(pending, { allowReprocess: true });
          }}
        />
      ) : null}

      <BatchUploadDrawer
        open={showBatchUpload}
        onClose={() => setShowBatchUpload(false)}
        onOpenPackage={(packageId) => {
          const row = displayRows.find((r) => r.id === packageId);
          setShowBatchUpload(false);
          if (row) setSelectedRow(row);
        }}
      />

      <PackageDetailsDrawer
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onReprocess={(row) => reprocessRow(row)}
        onDelete={(row) => {
          if (window.confirm(`Delete package “${row.fileName}”? This cannot be undone.`)) {
            deletePackage(row.id);
            setSelectedRow(null);
            setToast("Package deleted.");
          }
        }}
        onDownload={(row) => {
          const ok = downloadPackagePdf(row.id);
          if (!ok && row.fileUrl) {
            void import("@/lib/portfolio/source-download").then(({ triggerSourceDownload }) =>
              triggerSourceDownload(row.fileUrl!, row.fileName)
            );
          }
        }}
      />

      {toast && <PackageToast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
