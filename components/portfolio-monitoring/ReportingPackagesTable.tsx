"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CoverageBar,
  PackageActionsMenu,
  PackagePrimaryAction,
  PackageStatusBadge,
  SourceFormatBadge,
} from "@/components/portfolio-monitoring/PackageStatusBadges";
import type { ReportingPackageRow } from "@/lib/portfolio/reporting-packages-demo";
import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity";
import { getActivePortfolioSectors } from "@/lib/portfolio/sector-classification";
import { getPackageOpsStatus } from "@/lib/portfolio/reporting-packages-selectors";

export type PackageFiltersState = {
  search: string;
  sector: string;
  period: string;
  format: string;
  status: string;
  uploadedBy: string;
  duplicateOnly: boolean;
  lowCoverageOnly: boolean;
  failedOnly: boolean;
  highRetryOnly: boolean;
};

export const DEFAULT_PACKAGE_FILTERS: PackageFiltersState = {
  search: "",
  sector: "all",
  period: "all",
  format: "all",
  status: "all",
  uploadedBy: "all",
  duplicateOnly: false,
  lowCoverageOnly: false,
  failedOnly: false,
  highRetryOnly: false,
};

function formatUploadedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUploadedTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function hasActiveFilters(filters: PackageFiltersState) {
  return (
    filters.search.trim() !== "" ||
    filters.sector !== "all" ||
    filters.period !== "all" ||
    filters.format !== "all" ||
    filters.status !== "all" ||
    filters.uploadedBy !== "all" ||
    filters.duplicateOnly ||
    filters.lowCoverageOnly ||
    filters.failedOnly ||
    filters.highRetryOnly
  );
}

export function filterPackageRows(
  rows: ReportingPackageRow[],
  filters: PackageFiltersState
): ReportingPackageRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (
      q &&
      !`${row.companyName} ${row.fileName} ${row.reportPeriod}`.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (filters.sector !== "all" && row.sector !== filters.sector) return false;
    if (filters.period !== "all" && row.reportPeriod !== filters.period) return false;
    if (filters.format !== "all" && row.sourceFormat !== filters.format) return false;
    const ops = getPackageOpsStatus(row);
    if (filters.status !== "all") {
      if (filters.status === "Processing" && ops !== "Processing") return false;
      if (filters.status === "Processed" && ops !== "Processed") return false;
      if (filters.status === "Failed" && ops !== "Failed") return false;
      if (filters.status === "Needs attention" && ops !== "Needs attention") return false;
    }
    if (filters.uploadedBy !== "all" && row.processedBy !== filters.uploadedBy) return false;
    if (filters.failedOnly && ops !== "Failed") return false;
    if (
      filters.lowCoverageOnly &&
      !(ops === "Needs attention" || (row.status === "Processed" && row.coverage < 60))
    ) {
      return false;
    }
    if (filters.highRetryOnly && (row.runCount ?? 1) < 2) return false;
    if (filters.duplicateOnly && (row.runCount ?? 1) < 2) return false;
    return true;
  });
}

export function PackageFilters({
  rows,
  filters,
  onChange,
}: {
  rows: ReportingPackageRow[];
  filters: PackageFiltersState;
  onChange: (next: PackageFiltersState) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const sectors = useMemo(
    () => getActivePortfolioSectors(rows.map((row) => ({ sector: row.sector }))),
    [rows]
  );
  const periods = useMemo(
    () => Array.from(new Set(rows.map((r) => r.reportPeriod))).sort(),
    [rows]
  );
  const formats = useMemo(
    () => Array.from(new Set(rows.map((r) => r.sourceFormat))).sort(),
    [rows]
  );
  const uploaders = useMemo(
    () => Array.from(new Set(rows.map((r) => r.processedBy).filter(Boolean))).sort(),
    [rows]
  );

  const selectClass =
    "h-9 appearance-none rounded-lg border border-stone-200 bg-white bg-[length:12px] bg-[right_10px_center] bg-no-repeat py-0 pl-3 pr-8 text-[13px] text-stone-700 [background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%239ca3af%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')]";

  return (
    <div className="border-b border-stone-100 bg-stone-50/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by company or file name..."
            className="h-9 w-full rounded-lg border border-stone-200 bg-white py-0 pl-9 pr-3 text-[13px] text-stone-800 placeholder:text-stone-400"
          />
        </div>
        {sectors.length > 0 ? (
          <select
            value={filters.sector}
            onChange={(e) => onChange({ ...filters, sector: e.target.value })}
            className={`${selectClass} min-w-[140px]`}
            aria-label="Filter by sector"
          >
            <option value="all">All sectors</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        ) : null}
        <select
          value={filters.period}
          onChange={(e) => onChange({ ...filters, period: e.target.value })}
          className={`${selectClass} min-w-[140px]`}
        >
          <option value="all">All report periods</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filters.format}
          onChange={(e) => onChange({ ...filters, format: e.target.value })}
          className={`${selectClass} min-w-[168px]`}
        >
          <option value="all">All formats</option>
          {formats.map((f) => (
            <option key={f} value={f}>
              {f.toLowerCase().includes("icready") || f.toLowerCase().includes("template")
                ? "ICReady Template"
                : "Original"}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className={`${selectClass} min-w-[140px]`}
        >
          <option value="all">All statuses</option>
          <option value="Processing">Processing</option>
          <option value="Processed">Processed</option>
          <option value="Failed">Failed</option>
          <option value="Needs attention">Needs attention</option>
        </select>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-stone-500 hover:text-stone-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 9.75h12M9 15h6M10.5 20.25h3" />
            </svg>
            More filters
          </button>
          {hasActiveFilters(filters) ? (
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_PACKAGE_FILTERS })}
              className="text-[12px] font-semibold text-[#63202e] hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
      {moreOpen ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-lg border border-stone-100 bg-white px-3 py-2.5">
          <label className="inline-flex items-center gap-2 text-[12px] text-stone-600">
            <span className="text-stone-500">Uploaded by</span>
            <select
              value={filters.uploadedBy}
              onChange={(e) => onChange({ ...filters, uploadedBy: e.target.value })}
              className="h-8 rounded-md border border-stone-200 bg-white px-2 text-[12px]"
            >
              <option value="all">Anyone</option>
              {uploaders.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] text-stone-600">
            <input
              type="checkbox"
              checked={filters.failedOnly}
              onChange={(e) => onChange({ ...filters, failedOnly: e.target.checked })}
              className="rounded border-stone-300"
            />
            Failed only
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] text-stone-600">
            <input
              type="checkbox"
              checked={filters.lowCoverageOnly}
              onChange={(e) => onChange({ ...filters, lowCoverageOnly: e.target.checked })}
              className="rounded border-stone-300"
            />
            Low coverage
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] text-stone-600">
            <input
              type="checkbox"
              checked={filters.duplicateOnly}
              onChange={(e) => onChange({ ...filters, duplicateOnly: e.target.checked })}
              className="rounded border-stone-300"
            />
            Reprocessed / versioned
          </label>
          <label className="inline-flex items-center gap-2 text-[12px] text-stone-600">
            <input
              type="checkbox"
              checked={filters.highRetryOnly}
              onChange={(e) => onChange({ ...filters, highRetryOnly: e.target.checked })}
              className="rounded border-stone-300"
            />
            Retry count ≥ 2
          </label>
        </div>
      ) : null}
    </div>
  );
}

function PackageErrorPanel({
  row,
  onRetry,
  onDetails,
}: {
  row: ReportingPackageRow;
  onRetry: () => void;
  onDetails: () => void;
}) {
  const failed = row.status === "Failed";
  const tone = failed
    ? {
        shell: "border-b border-red-100 bg-red-50/60",
        title: "text-red-800",
        body: "text-red-700",
        label: "text-red-700/80",
        btn: "border-red-200 text-red-700 hover:bg-red-50",
        heading: "Processing failed",
        fallback:
          "Text extraction failed. The document may be scanned or password-protected.",
        steps: [
          "Upload a selectable-text PDF",
          "Confirm the file is not password-protected",
          "Retry processing",
          "Contact the company for a replacement file",
        ],
        primary: "Retry processing",
      }
    : {
        shell: "border-b border-amber-100 bg-amber-50/60",
        title: "text-amber-900",
        body: "text-amber-800",
        label: "text-amber-800/80",
        btn: "border-amber-200 text-amber-900 hover:bg-amber-50",
        heading: "Needs operational attention",
        fallback:
          row.coverage < 60
            ? `Extraction coverage is ${row.coverage}%. Review the source PDF or reprocess.`
            : "This package needs operational attention before Metric Review.",
        steps: [
          "Review extraction coverage and missing metrics",
          "Confirm company and report period metadata",
          "Reprocess if the source PDF was incomplete",
          "Open extraction details for more context",
        ],
        primary: "Resolve issue",
      };

  return (
    <div className={`${tone.shell} px-4 py-4 md:px-6`}>
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
        <div>
          <p className={`flex items-center gap-2 text-sm font-semibold ${tone.title}`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            {tone.heading}
          </p>
          <p className={`mt-1 text-[13px] leading-relaxed ${tone.body}`}>
            {row.errorMessage ?? tone.fallback}
          </p>
        </div>
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${tone.label}`}>
            What you can do
          </p>
          <ul className={`mt-1 list-disc space-y-0.5 pl-4 text-[12px] ${tone.body}`}>
            {tone.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 self-start">
          <button
            type="button"
            onClick={onRetry}
            className={`rounded-lg border bg-white px-3 py-1.5 text-[12px] font-semibold ${tone.btn}`}
          >
            {tone.primary}
          </button>
          <button
            type="button"
            onClick={onDetails}
            className={`rounded-lg border bg-white px-3 py-1.5 text-[12px] font-semibold ${tone.btn}`}
          >
            View details ›
          </button>
        </div>
      </div>
    </div>
  );
}

type TableProps = {
  rows: ReportingPackageRow[];
  filters: PackageFiltersState;
  onFiltersChange: (f: PackageFiltersState) => void;
  onOpenDetails: (row: ReportingPackageRow) => void;
  onRetry: (row: ReportingPackageRow) => void;
  onReprocess: (row: ReportingPackageRow) => void;
  onDelete: (row: ReportingPackageRow) => void;
  onDownload: (row: ReportingPackageRow) => void;
  onUpload: () => void;
  onLoadSample: () => void;
  showDemoTools?: boolean;
  className?: string;
};

export function ReportingPackagesTable({
  rows,
  filters,
  onFiltersChange,
  onOpenDetails,
  onRetry,
  onReprocess,
  onDelete,
  onDownload,
  onUpload,
  onLoadSample,
  showDemoTools = false,
  className = "",
}: TableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterPackageRows(rows, filters), [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length);

  const selectClass =
    "h-8 appearance-none rounded-lg border border-stone-200 bg-white bg-[length:12px] bg-[right_8px_center] bg-no-repeat py-0 pl-2.5 pr-7 text-[12px] text-stone-700 [background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%239ca3af%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')]";

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCompany(row: ReportingPackageRow) {
    router.push(`/dashboard/portfolio/companies/${row.companyId}`);
  }

  function downloadFile(row: ReportingPackageRow) {
    onDownload(row);
  }

  if (rows.length === 0) {
    return (
      <section
        className={`flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center ${className}`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-stone-900">No reporting packages yet</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
          Upload a company reporting PDF to begin extracting portfolio metrics.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onUpload}
            className="rounded-lg bg-[#63202e] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#521a26]"
          >
            Upload package
          </button>
          {showDemoTools ? (
            <button
              type="button"
              onClick={onLoadSample}
              className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-[13px] font-semibold text-stone-700 hover:bg-stone-50"
            >
              Load sample package
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
    >
      <PackageFilters
        rows={rows}
        filters={filters}
        onChange={(f) => {
          onFiltersChange(f);
          setPage(1);
        }}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
          <h3 className="text-sm font-semibold text-stone-900">No packages match these filters</h3>
          <p className="mt-1 text-sm text-stone-500">Adjust or clear the current filters.</p>
          <button
            type="button"
            onClick={() => {
              onFiltersChange({ ...DEFAULT_PACKAGE_FILTERS });
              setPage(1);
            }}
            className="mt-4 text-[13px] font-semibold text-[#63202e] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="hidden min-h-0 flex-1 overflow-auto md:block">
            <table className="min-w-[1280px] w-full table-fixed text-left">
              <thead className="sticky top-0 z-10 border-b border-stone-100 bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-[0.04em] text-stone-500">
                <tr>
                  <th className="w-[15%] px-4 py-3 pr-5">Company</th>
                  <th className="w-[9%] whitespace-nowrap px-4 py-3">Report period</th>
                  <th className="w-[12%] whitespace-nowrap px-4 py-3">Format</th>
                  <th className="w-[14%] px-4 py-3">File name</th>
                  <th className="w-[10%] whitespace-nowrap px-4 py-3">Uploaded</th>
                  <th className="w-[13%] whitespace-nowrap px-4 py-3 pr-5">Processing status</th>
                  <th className="w-[9%] whitespace-nowrap px-4 py-3 pl-5">Metrics found</th>
                  <th className="w-[8%] px-4 py-3">Coverage</th>
                  <th className="w-[10%] px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const ops = getPackageOpsStatus(row);
                  const expanded = expandedIds.has(row.id);
                  const showExpand = ops === "Failed" || ops === "Needs attention";
                  const coverageAvailable = ops === "Processed" || ops === "Needs attention";
                  return (
                    <FragmentRow key={row.id}>
                      <tr
                        className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/50 ${
                          expanded ? "bg-stone-50/40" : ""
                        }`}
                      >
                        <td className="max-w-0 overflow-hidden px-4 py-3.5 pr-5 align-middle">
                          <CompanyIdentity
                            companyId={row.companyId}
                            companyName={row.companyName}
                            secondaryText={row.sector}
                            size="md"
                            href={`/dashboard/portfolio/companies/${row.companyId}`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 align-middle text-[13px] text-stone-700">
                          {row.reportPeriod}
                        </td>
                        <td className="max-w-0 overflow-hidden px-4 py-3.5 align-middle">
                          <SourceFormatBadge format={row.sourceFormat} />
                        </td>
                        <td
                          className="max-w-0 overflow-hidden px-4 py-3.5 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            title={row.fileName}
                            onClick={() => downloadFile(row)}
                            className="inline-flex max-w-full items-start gap-1 text-left text-[13px] font-medium text-blue-600 hover:underline"
                          >
                            <span className="line-clamp-2 min-w-0">{row.fileName}</span>
                            <svg
                              className="mt-0.5 h-3 w-3 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="max-w-0 overflow-hidden px-4 py-3.5 align-middle">
                          <p className="truncate text-[12px] text-stone-800">
                            {formatUploadedDate(row.uploadedAt)}
                          </p>
                          <p className="truncate text-[11px] text-stone-500">
                            {formatUploadedTime(row.uploadedAt)}
                          </p>
                          <p className="truncate text-[11px] text-stone-400">{row.processedBy}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 pr-5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <PackageStatusBadge row={row} />
                            {showExpand ? (
                              <button
                                type="button"
                                aria-label={expanded ? "Collapse details" : "Expand details"}
                                onClick={() => toggleExpanded(row.id)}
                                className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                              >
                                {expanded ? "▾" : "▸"}
                              </button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 pl-5 align-middle text-[13px] tabular-nums text-stone-700">
                          {coverageAvailable ? row.metricsExtracted : "—"}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <CoverageBar value={row.coverage} available={coverageAvailable} />
                        </td>
                        <td
                          className="px-4 py-3.5 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <PackagePrimaryAction
                              row={row}
                              onRetry={() => onRetry(row)}
                              onViewExtraction={() => onOpenDetails(row)}
                              onViewProgress={() => onOpenDetails(row)}
                              onResolveIssue={() => {
                                toggleExpanded(row.id);
                                onOpenDetails(row);
                              }}
                            />
                            <PackageActionsMenu
                              row={row}
                              onDownload={() => downloadFile(row)}
                              onDetails={() => onOpenDetails(row)}
                              onReprocess={() => onReprocess(row)}
                              onDelete={() => onDelete(row)}
                              onOpenCompany={() => openCompany(row)}
                            />
                          </div>
                        </td>
                      </tr>
                      {expanded && showExpand ? (
                        <tr>
                          <td colSpan={9} className="p-0">
                            <PackageErrorPanel
                              row={row}
                              onRetry={() => onRetry(row)}
                              onDetails={() => onOpenDetails(row)}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </FragmentRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 md:hidden">
            {pageRows.map((row) => {
              const ops = getPackageOpsStatus(row);
              const coverageAvailable = ops === "Processed" || ops === "Needs attention";
              return (
                <article
                  key={row.id}
                  className="rounded-xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <CompanyIdentity
                        companyId={row.companyId}
                        companyName={row.companyName}
                        secondaryText={row.sector}
                        size="lg"
                        href={`/dashboard/portfolio/companies/${row.companyId}`}
                      />
                      <p className="mt-1 truncate text-xs text-stone-500">
                        {row.reportPeriod} ·{" "}
                        {row.sourceFormat.toLowerCase().includes("icready") ||
                        row.sourceFormat.toLowerCase().includes("template")
                          ? "ICReady Template"
                          : "Original"}
                      </p>
                      <button
                        type="button"
                        title={row.fileName}
                        onClick={() => downloadFile(row)}
                        className="mt-1 line-clamp-2 text-left text-xs font-medium text-blue-600 hover:underline"
                      >
                        {row.fileName}
                      </button>
                    </div>
                    <PackageStatusBadge row={row} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-stone-600">
                    <span>
                      Metrics: {coverageAvailable ? row.metricsExtracted : "—"}
                    </span>
                    <CoverageBar value={row.coverage} available={coverageAvailable} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PackagePrimaryAction
                      row={row}
                      onRetry={() => onRetry(row)}
                      onViewExtraction={() => onOpenDetails(row)}
                      onViewProgress={() => onOpenDetails(row)}
                      onResolveIssue={() => onOpenDetails(row)}
                    />
                    <PackageActionsMenu
                      row={row}
                      onDownload={() => downloadFile(row)}
                      onDetails={() => onOpenDetails(row)}
                      onReprocess={() => onReprocess(row)}
                      onDelete={() => onDelete(row)}
                      onOpenCompany={() => openCompany(row)}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3">
            <p className="text-[13px] text-stone-500">
              Showing {rangeStart} to {rangeEnd} of {filtered.length.toLocaleString()} results
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 text-stone-500 disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-[13px] ${
                      n === currentPage
                        ? "bg-[#63202e] font-semibold text-white"
                        : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-200 text-stone-500 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className={selectClass}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
