"use client";

/**
 * Side drawer with full details for a single reporting package.
 */
import Link from "next/link";
import {
  CoverageBar,
  PackageStatusBadge,
  SourceFormatBadge,
} from "@/components/portfolio-monitoring/PackageStatusBadges";
import type { ReportingPackageRow } from "@/lib/portfolio/reporting-packages-demo";
import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity";
import { ALL_METRICS } from "@/lib/portfolio/types";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { getPackageOpsStatus } from "@/lib/portfolio/reporting-packages-selectors";
import { getPackageVersions } from "@/lib/portfolio/package-versioning";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-stone-800">{children}</dd>
    </div>
  );
}

/** Slide-out panel with metadata and metrics for one package. */
export function PackageDetailsDrawer({
  row,
  onClose,
  onReprocess,
  onDelete,
  onDownload,
}: {
  row: ReportingPackageRow | null;
  onClose: () => void;
  onReprocess: (row: ReportingPackageRow) => void;
  onDelete: (row: ReportingPackageRow) => void;
  onDownload: (row: ReportingPackageRow) => void;
}) {
  const { state } = usePortfolio();
  if (!row) return null;

  const ops = getPackageOpsStatus(row);
  const suggested = state.metrics.filter((m) => m.packageId === row.id);
  const canHandoff = ops === "Processed" || ops === "Needs attention";
  const versions = getPackageVersions(state.packages, row.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-stone-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2 className="text-lg font-semibold text-stone-900">Extraction result</h2>
            <CompanyIdentity
              companyId={row.companyId}
              companyName={row.companyName}
              secondaryText={row.sector}
              size="md"
              className="mt-1"
              href={`/dashboard/portfolio/companies/${row.companyId}`}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {row.status === "Failed" ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Processing failed</p>
              <p className="mt-1 text-xs leading-relaxed text-red-700">
                {row.errorMessage ?? "Unable to extract text from this PDF."}
              </p>
              <button
                type="button"
                onClick={() => onReprocess(row)}
                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Retry processing
              </button>
            </div>
          ) : null}

          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Package metadata
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-4">
            <Field label="Reporting period">{row.reportPeriod}</Field>
            <Field label="Source format">
              <SourceFormatBadge format={row.sourceFormat} />
            </Field>
            <div className="col-span-2">
              <Field label="File name">
                <span className="break-all">{row.fileName}</span>
              </Field>
            </div>
            <Field label="Uploaded by">{row.processedBy}</Field>
            <Field label="Uploaded at">{formatDate(row.uploadedAt)}</Field>
            <Field label="Processing status">
              <PackageStatusBadge row={row} />
            </Field>
            <Field label="Processing runs">{row.runCount}</Field>
          </dl>

          {versions.length > 1 ? (
            <>
              <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Version history
              </h3>
              <ul className="mt-2 space-y-1.5 text-[12px] text-stone-600">
                {versions.map((v) => (
                  <li
                    key={v.packageId}
                    className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2"
                  >
                    <span>
                      v{v.versionNumber} · {v.relationship}
                      {v.activeVersion ? " · active" : ""}
                    </span>
                    <span className="text-stone-400">{formatDate(v.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
            Extraction summary
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-4">
            <Field label="Metrics found">
              {row.status === "Failed" || row.status === "Processing"
                ? "—"
                : row.metricsExtracted}
            </Field>
            <Field label="Expected metrics">{ALL_METRICS.length}</Field>
            <Field label="Pages processed">
              {row.status === "Failed" ? "—" : row.pagesProcessed}
            </Field>
            <div className="col-span-2">
              <Field label="Coverage">
                <CoverageBar
                  value={row.coverage}
                  available={ops === "Processed" || ops === "Needs attention"}
                />
              </Field>
            </div>
          </dl>

          {suggested.length > 0 ? (
            <>
              <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
                Suggested metrics
              </h3>
              <p className="mt-1 text-[11px] text-stone-500">
                Read-only extraction preview. Validation happens in Metric Review.
              </p>
              <ul className="mt-3 space-y-2">
                {suggested.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border border-stone-200 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-stone-900">{m.metricName}</p>
                        <p className="text-[12px] tabular-nums text-stone-700">
                          {m.extractedValue || "—"}
                          {m.unit ? ` ${m.unit}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                          {m.status === "Missing from report" ? "Missing" : "Extracted"}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {m.confidence} · p.{m.sourcePage || "—"}
                        </p>
                      </div>
                    </div>
                    {m.evidenceText ? (
                      <p className="mt-1 line-clamp-2 text-[11px] text-stone-500">
                        {m.evidenceText}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={() => onDownload(row)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-[13px] font-semibold text-stone-700 hover:bg-stone-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => onReprocess(row)}
            disabled={row.status === "Processing"}
            className="rounded-lg border border-stone-200 px-3 py-2 text-[13px] font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Reprocess
          </button>
          {canHandoff ? (
            <Link
              href={`/dashboard/portfolio/metric-review?companyId=${encodeURIComponent(row.companyId)}&packageId=${encodeURIComponent(row.id)}`}
              className="rounded-lg bg-[#63202e] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#521a26]"
            >
              Open in Metric Review
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(row)}
            className="ml-auto rounded-lg border border-red-200 px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50"
          >
            Delete package
          </button>
        </div>
      </aside>
    </div>
  );
}
