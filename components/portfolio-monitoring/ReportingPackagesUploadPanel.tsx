"use client";

/**
 * Upload area and queue for adding new reporting package PDFs.
 */
import { useEffect, useMemo, useState } from "react";
import {
  COMPANY_FORMATTED_PDF_CATALOG,
  SAMPLE_PDF_SOURCE_COPY,
  TEMPLATE_PDF_CATALOG,
  getSamplePdfForCompany,
  inferSourceFormatFromFileName,
  type SamplePdfSource,
} from "@/lib/portfolio/sample-pdf-catalog";
import { detectMetadataFromFileName } from "@/lib/portfolio/reporting-packages-demo";
import { isPdfFile, isZipFile } from "@/lib/portfolio/bulk-upload";
import type { PackageSourceFormat } from "@/lib/portfolio/types";

const PERIODS = ["Q2 2026", "Q1 2026", "Q4 2025", "Q3 2025", "FY 2025"];
const SOURCES: SamplePdfSource[] = ["company-formatted", "template"];
const FORMAT_OPTIONS: Array<PackageSourceFormat | "auto"> = [
  "auto",
  "Company-formatted PDF",
  "ICReady template",
];

type CompanyOption = { id: string; name: string };

type UploadPanelProps = {
  preferSample?: boolean;
  companies: CompanyOption[];
  onProcessSingle: (input: {
    companyId?: string;
    reportPeriod?: string;
    file: File | null;
    useSample: boolean;
    sampleSource: SamplePdfSource;
    sourceFormatOverride?: PackageSourceFormat;
    confirmMetadataMismatch?: boolean;
  }) => Promise<void>;
  onProcessBulk: (files: File[]) => Promise<void>;
  processing: boolean;
  message: { type: "success" | "error"; text: string } | null;
  onClose: () => void;
};

type QueuedFile = {
  file: File;
  companyName: string;
  reportPeriod: string;
};

function queueFromFiles(files: File[]): QueuedFile[] {
  return files.map((file) => {
    const detected = detectMetadataFromFileName(file.name);
    return {
      file,
      companyName: detected.companyName ?? file.name,
      reportPeriod: detected.reportPeriod ?? "Q2 2026",
    };
  });
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** Drag-and-drop upload zone and file queue for new packages. */
export function ReportingPackagesUploadPanel({
  preferSample = false,
  companies,
  onProcessSingle,
  onProcessBulk,
  processing,
  message,
  onClose,
}: UploadPanelProps) {
  const [sampleSource, setSampleSource] = useState<SamplePdfSource>("company-formatted");
  const catalog = sampleSource === "template" ? TEMPLATE_PDF_CATALOG : COMPANY_FORMATTED_PDF_CATALOG;

  const [companyId, setCompanyId] = useState(companies[0]?.id ?? catalog[0]?.companyId ?? "");
  const catalogEntry = getSamplePdfForCompany(companyId, sampleSource);
  const [reportPeriod, setReportPeriod] = useState("Q2 2026");
  const [file, setFile] = useState<File | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [formatOverride, setFormatOverride] = useState<PackageSourceFormat | "auto">("auto");
  const [confirmMismatch, setConfirmMismatch] = useState(false);

  const isBulk = queuedFiles.length > 1 || (queuedFiles.length === 1 && isZipFile(queuedFiles[0].file));

  const selectedCompany = companies.find((c) => c.id === companyId);
  const detected = useMemo(
    () => (file ? detectMetadataFromFileName(file.name, companies) : null),
    [file, companies]
  );
  const detectedFormat = file ? inferSourceFormatFromFileName(file.name) : null;
  const metadataMismatch =
    !!detected?.companyName &&
    !!selectedCompany &&
    detected.companyName.toLowerCase() !== selectedCompany.name.toLowerCase() &&
    detected.companyId !== companyId;

  const filteredCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, companyQuery]);

  useEffect(() => {
    if (preferSample) {
      if (!catalog.some((c) => c.companyId === companyId)) {
        const first = catalog[0];
        if (first) {
          setCompanyId(first.companyId);
          setReportPeriod(first.reportPeriod);
        }
      }
      return;
    }
    if (!companies.some((c) => c.id === companyId) && companies[0]) {
      setCompanyId(companies[0].id);
    }
  }, [catalog, companyId, companies, preferSample]);

  useEffect(() => {
    if (detected?.reportPeriod) setReportPeriod(detected.reportPeriod);
    if (detected?.companyId && companies.some((c) => c.id === detected.companyId)) {
      setCompanyId(detected.companyId);
    }
    setConfirmMismatch(false);
  }, [detected?.companyId, detected?.reportPeriod, companies]);

  function onSampleSourceChange(source: SamplePdfSource) {
    setSampleSource(source);
    const nextCatalog = source === "template" ? TEMPLATE_PDF_CATALOG : COMPANY_FORMATTED_PDF_CATALOG;
    const first = nextCatalog[0];
    if (first) {
      setCompanyId(first.companyId);
      setReportPeriod(first.reportPeriod);
    }
    setFile(null);
    setQueuedFiles([]);
  }

  function onCompanyChange(id: string) {
    setCompanyId(id);
    if (preferSample) {
      const entry = getSamplePdfForCompany(id, sampleSource);
      if (entry) setReportPeriod(entry.reportPeriod);
    }
    setConfirmMismatch(false);
  }

  function addFiles(incoming: File[]) {
    const pdfsAndZips = incoming.filter((f) => isPdfFile(f) || isZipFile(f));
    if (pdfsAndZips.length === 0) return;

    if (pdfsAndZips.length === 1 && isPdfFile(pdfsAndZips[0]) && !preferSample) {
      setFile(pdfsAndZips[0]);
      setQueuedFiles(queueFromFiles([pdfsAndZips[0]]));
      return;
    }

    setFile(null);
    setQueuedFiles((prev) => {
      const merged = [...prev.map((q) => q.file), ...pdfsAndZips];
      const unique = merged.filter(
        (f, i, arr) => arr.findIndex((x) => x.name === f.name && x.size === f.size) === i
      );
      return queueFromFiles(unique);
    });
  }

  async function handleDrop(dataTransfer: DataTransfer) {
    const items = Array.from(dataTransfer.items);
    const collected: File[] = [];

    for (const item of items) {
      const entry = item.webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        setExpanding(true);
        await walkDirectory(entry as FileSystemDirectoryEntry, collected);
        setExpanding(false);
        continue;
      }
      const f = item.getAsFile();
      if (f) collected.push(f);
    }

    if (collected.length === 0) {
      addFiles(Array.from(dataTransfer.files));
      return;
    }
    addFiles(collected);
  }

  const previewRows = useMemo(() => {
    if (queuedFiles.length === 0 && file) return queueFromFiles([file]);
    return queuedFiles;
  }, [file, queuedFiles]);

  if (preferSample) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 px-4 py-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-package-title"
          className="w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-stone-100 px-6 py-4">
            <div>
              <h2 id="upload-package-title" className="text-lg font-semibold text-stone-900">
                Process sample package
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Load a bundled sample PDF to demo extraction without uploading your own files.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {SOURCES.map((source) => {
                const copy = SAMPLE_PDF_SOURCE_COPY[source];
                const active = sampleSource === source;
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => onSampleSourceChange(source)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? source === "template"
                          ? "border-[#7a3344]/40 bg-[#fdf2f4] ring-1 ring-[#7a3344]/20"
                          : "border-stone-900/20 bg-stone-50 ring-1 ring-stone-900/10"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-stone-900">{copy.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-500">{copy.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-stone-500">Sample company</span>
                <select
                  value={companyId}
                  onChange={(e) => onCompanyChange(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  {catalog.map((c) => (
                    <option key={c.companyId} value={c.companyId}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-stone-500">Report period</span>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                >
                  {PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {catalogEntry && (
              <p className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                {catalogEntry.fileName}
              </p>
            )}

            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
                {message.text}
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={processing || !catalogEntry}
              onClick={() =>
                onProcessSingle({
                  companyId,
                  reportPeriod,
                  file: null,
                  useSample: true,
                  sampleSource,
                })
              }
              className="rounded-xl bg-[#63202e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#521a26] disabled:opacity-60"
            >
              {processing ? "Processing…" : "Load sample package"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 px-4 py-10 sm:items-start">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-package-title"
        className="max-h-[95vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-stone-100 px-6 py-4">
          <div>
            <h2 id="upload-package-title" className="text-lg font-semibold text-stone-900">
              Upload package
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Upload a company-provided PDF. ICReady extracts suggested metrics with source evidence.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {!isBulk ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {companies.length > 0 ? (
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-medium text-stone-500">Company</span>
                    <input
                      value={companyQuery}
                      onChange={(e) => setCompanyQuery(e.target.value)}
                      placeholder="Search companies…"
                      className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    />
                    <select
                      value={companyId}
                      onChange={(e) => onCompanyChange(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    >
                      {filteredCompanies.length === 0 ? (
                        <option value="">No matching companies</option>
                      ) : (
                        filteredCompanies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                ) : (
                  <p className="sm:col-span-2 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-600">
                    Company will be detected from the PDF filename on upload.
                  </p>
                )}
                <label className="block">
                  <span className="text-xs font-medium text-stone-500">Report period</span>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    required
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-stone-500">
                    Format <span className="font-normal text-stone-400">(optional)</span>
                  </span>
                  <select
                    value={formatOverride}
                    onChange={(e) =>
                      setFormatOverride(e.target.value as PackageSourceFormat | "auto")
                    }
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "auto"
                          ? `Auto-detect${
                              detectedFormat
                                ? ` (${
                                    detectedFormat.toLowerCase().includes("icready") ||
                                    detectedFormat.toLowerCase().includes("template")
                                      ? "ICReady Template"
                                      : "Original"
                                  })`
                                : ""
                            }`
                          : opt === "ICReady template"
                            ? "ICReady Template"
                            : "Original"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          ) : null}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleDrop(e.dataTransfer);
            }}
            className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
              dragOver ? "border-[#63202e] bg-[#fdf2f4]/50" : "border-stone-200 bg-stone-50/50"
            }`}
          >
            <p className="text-sm font-medium text-stone-700">
              {expanding
                ? "Reading folder…"
                : file
                  ? file.name
                  : previewRows.length > 1
                    ? `${previewRows.length} files ready`
                    : "Drag and drop a PDF here"}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Accepted: PDF · ZIP of PDFs · folder (bulk)
            </p>
            {file ? (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-stone-600">
                <span>{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setQueuedFiles([]);
                  }}
                  className="font-semibold text-[#63202e] hover:underline"
                >
                  Remove file
                </button>
                <label className="cursor-pointer font-semibold text-stone-700 hover:underline">
                  Replace file
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Choose PDF
                  <input
                    type="file"
                    accept="application/pdf,.pdf,application/zip,.zip"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
                <label className="inline-flex cursor-pointer rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Choose folder
                  <input
                    type="file"
                    // @ts-expect-error webkitdirectory is supported in Chromium browsers
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
              </div>
            )}
          </div>

          {isBulk && previewRows.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-stone-200">
              <div className="border-b border-stone-100 bg-stone-50 px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Files to process ({previewRows.length})
                </p>
              </div>
              <ul className="max-h-48 divide-y divide-stone-100 overflow-y-auto">
                {previewRows.slice(0, 50).map((row) => (
                  <li key={`${row.file.name}-${row.file.size}`} className="min-w-0 px-4 py-2.5 text-sm">
                    <p className="truncate font-medium text-stone-800" title={row.file.name}>
                      {row.file.name}
                    </p>
                    <p
                      className="truncate text-xs text-stone-500"
                      title={`${row.companyName} · ${row.reportPeriod}`}
                    >
                      {row.companyName} · {row.reportPeriod}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {metadataMismatch && !isBulk ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">Metadata mismatch</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                The PDF appears to belong to {detected?.companyName}, but{" "}
                {selectedCompany?.name ?? "another company"} is selected.
              </p>
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-amber-900">
                <input
                  type="checkbox"
                  checked={confirmMismatch}
                  onChange={(e) => setConfirmMismatch(e.target.checked)}
                  className="rounded border-amber-300"
                />
                Confirm and continue with the selected company
              </label>
            </div>
          ) : null}

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              processing ||
              previewRows.length === 0 ||
              (companies.length > 0 && !isBulk && !companyId) ||
              (metadataMismatch && !confirmMismatch && !isBulk)
            }
            onClick={() => {
              const files = previewRows.map((r) => r.file);
              if (isBulk || files.length > 1 || files.some(isZipFile)) {
                void onProcessBulk(files);
              } else {
                const single = previewRows[0];
                void onProcessSingle({
                  companyId: companyId || undefined,
                  file: single.file,
                  reportPeriod,
                  useSample: false,
                  sampleSource: "company-formatted",
                  sourceFormatOverride:
                    formatOverride === "auto" ? undefined : formatOverride,
                  confirmMetadataMismatch: confirmMismatch,
                });
              }
            }}
            className="rounded-xl bg-[#63202e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#521a26] disabled:opacity-60"
          >
            {processing
              ? "Processing…"
              : isBulk || previewRows.length > 1
                ? `Process ${previewRows.length} packages`
                : "Upload and extract"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function walkDirectory(
  entry: FileSystemDirectoryEntry,
  out: File[]
): Promise<void> {
  const reader = entry.createReader();
  const entries = await readAllEntries(reader);

  for (const child of entries) {
    if (child.isFile) {
      const file = await entryToFile(child as FileSystemFileEntry);
      if (file && (isPdfFile(file) || isZipFile(file))) out.push(file);
    } else if (child.isDirectory) {
      await walkDirectory(child as FileSystemDirectoryEntry, out);
    }
  }
}

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve(all);
            return;
          }
          all.push(...batch);
          readBatch();
        },
        (err) => reject(err)
      );
    };
    readBatch();
  });
}

function entryToFile(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(
      (file) => resolve(file),
      () => resolve(null)
    );
  });
}
