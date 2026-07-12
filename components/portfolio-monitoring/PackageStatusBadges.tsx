"use client";

/**
 * Badges and action buttons showing package status, format, and coverage.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReportingPackageRow } from "@/lib/portfolio/reporting-packages-demo";
import {
  getPackageOpsStatus,
  getPackagePrimaryAction,
} from "@/lib/portfolio/reporting-packages-selectors";

/** Colored badge for a package's processing status. */
export function PackageStatusBadge({
  row,
}: {
  row: Pick<ReportingPackageRow, "status" | "coverage" | "metricsExtracted" | "missingMetrics">;
}) {
  const ops = getPackageOpsStatus(row as ReportingPackageRow);

  if (ops === "Processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
          <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
        </svg>
        Processing
      </span>
    );
  }
  if (ops === "Failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        Failed
      </span>
    );
  }
  if (ops === "Needs attention") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
        Needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Processed
    </span>
  );
}

/** Badge showing the PDF source format type. */
export function SourceFormatBadge({ format }: { format: string }) {
  const normalized = format.toLowerCase();
  const isTemplate =
    normalized.includes("icready") ||
    normalized === "icready_template" ||
    (normalized.includes("template") && !normalized.includes("company"));
  const label = isTemplate ? "ICReady Template" : "Original";
  const tooltip = isTemplate
    ? "Submitted using ICReady’s standardized reporting template."
    : "Submitted using the company’s own layout and terminology.";
  const styles = isTemplate
    ? "bg-emerald-50 text-emerald-800"
    : "bg-stone-100 text-stone-700";
  return (
    <span
      className={`inline-flex max-w-full cursor-help truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}

/** Horizontal bar showing metric coverage percentage. */
export function CoverageBar({ value, available }: { value: number; available: boolean }) {
  if (!available) {
    return <span className="text-[13px] text-stone-400">—</span>;
  }
  const barColor =
    value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-amber-500" : "bg-red-500";
  return (
    <div
      className="flex items-center gap-2"
      title="Extraction coverage reflects how many expected metrics were found in the report."
    >
      <span className="w-8 text-[13px] tabular-nums text-stone-700">{value}%</span>
      <div className="h-1.5 w-[64px] overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

/** Main action button for a package row (review, view, etc.). */
export function PackagePrimaryAction({
  row,
  onRetry,
  onViewExtraction,
  onViewProgress,
  onResolveIssue,
}: {
  row: ReportingPackageRow;
  onRetry: () => void;
  onViewExtraction: () => void;
  onViewProgress: () => void;
  onResolveIssue: () => void;
}) {
  const base =
    "whitespace-nowrap rounded-md border px-3 py-1.5 text-[12px] font-semibold transition";
  const action = getPackagePrimaryAction(row);

  if (action === "retry") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={`${base} border-red-200 bg-white text-red-600 hover:bg-red-50`}
      >
        Retry processing
      </button>
    );
  }
  if (action === "view_progress") {
    return (
      <button
        type="button"
        onClick={onViewProgress}
        className={`${base} border-stone-200 bg-white text-stone-600 hover:bg-stone-50`}
      >
        View progress
      </button>
    );
  }
  if (action === "resolve_issue") {
    return (
      <button
        type="button"
        onClick={onResolveIssue}
        className={`${base} border-amber-200 bg-white text-amber-800 hover:bg-amber-50`}
      >
        Resolve issue
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onViewExtraction}
      className={`${base} border-[#63202e]/25 bg-white text-[#63202e] hover:bg-[#fdf2f4]`}
    >
      View extraction
    </button>
  );
}

/** Dropdown of secondary actions for a package row. */
export function PackageActionsMenu({
  row,
  onDownload,
  onDetails,
  onReprocess,
  onDelete,
  onOpenCompany,
}: {
  row: ReportingPackageRow;
  onDownload: () => void;
  onDetails: () => void;
  onReprocess: () => void;
  onDelete: () => void;
  onOpenCompany: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ops = getPackageOpsStatus(row);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-stone-200 p-1.5 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
        aria-label="More actions"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
            onClick={() => {
              setOpen(false);
              onDownload();
            }}
          >
            Download source PDF
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
            onClick={() => {
              setOpen(false);
              onDetails();
            }}
          >
            View extraction details
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
            onClick={() => {
              setOpen(false);
              onReprocess();
            }}
            disabled={row.status === "Processing"}
          >
            Reprocess
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
            onClick={() => {
              setOpen(false);
              onOpenCompany();
            }}
          >
            Open company profile
          </button>
          {ops === "Processed" || ops === "Needs attention" ? (
            <Link
              href={`/dashboard/portfolio/metric-review?companyId=${encodeURIComponent(row.companyId)}&packageId=${encodeURIComponent(row.id)}`}
              className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
              onClick={() => setOpen(false)}
            >
              Send to Metric Review
            </Link>
          ) : null}
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete package
          </button>
        </div>
      ) : null}
    </div>
  );
}
