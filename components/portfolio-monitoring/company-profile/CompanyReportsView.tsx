"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CompanyProfileEmptyState,
  SectionCard,
  formatShortDate,
} from "@/components/portfolio-monitoring/company-profile/shared";
import { MetricStatusBadge } from "@/components/portfolio-monitoring/PortfolioShared";
import { getPackageMetrics } from "@/lib/portfolio/metric-review-selectors";
import type { ReportHistoryRow } from "@/lib/portfolio/company-profile-selectors";
import type {
  ExtractedMetric,
  MetricAuditEntry,
  PortfolioState,
  ReportingPackage,
} from "@/lib/portfolio/types";
import { METRIC_REVIEW_PATH } from "@/lib/portfolio/metric-review-url-state";

type Props = {
  state: PortfolioState;
  companyId: string;
  rows: ReportHistoryRow[];
  packages: ReportingPackage[];
  selectedPackageId: string | null;
  onSelectPackage: (id: string | null) => void;
  onDownload: (packageId: string) => void;
};

export function CompanyReportsView({
  state,
  companyId,
  rows,
  packages,
  selectedPackageId,
  onSelectPackage,
  onDownload,
}: Props) {
  const selected = packages.find((p) => p.id === selectedPackageId) ?? null;

  if (rows.length === 0) {
    return (
      <CompanyProfileEmptyState
        title="No reporting history yet"
        copy="Reports submitted by this company will appear here after they are uploaded and processed."
        action={{ href: "/dashboard/portfolio/reporting-packages", label: "Go to Reporting Packages" }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard
        title="All reports"
        helper="Complete history of PDFs submitted by this company"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase text-stone-400">
              <tr>
                <th className="pb-2 pr-3">Period</th>
                <th className="pb-2 pr-3">Report</th>
                <th className="pb-2 pr-3">Filename</th>
                <th className="pb-2 pr-3">Received</th>
                <th className="pb-2 pr-3">Processed</th>
                <th className="pb-2 pr-3">Processing</th>
                <th className="pb-2 pr-3">Review</th>
                <th className="pb-2 pr-3">Coverage</th>
                <th className="pb-2 pr-3">Reviewer</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.packageId} className="border-t border-stone-100">
                  <td className="py-2.5 pr-3 font-medium">{row.period}</td>
                  <td className="py-2.5 pr-3">{row.reportTitle}</td>
                  <td className="max-w-[10rem] truncate py-2.5 pr-3 font-mono text-xs text-stone-500" title={row.fileName}>
                    {row.fileName}
                  </td>
                  <td className="py-2.5 pr-3 text-stone-500">
                    {formatShortDate(row.receivedAt)}
                  </td>
                  <td className="py-2.5 pr-3 text-stone-500">
                    {formatShortDate(row.processedAt)}
                  </td>
                  <td className="py-2.5 pr-3">{row.processingStatus}</td>
                  <td className="py-2.5 pr-3">{row.reviewStatus}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{row.coverage}%</td>
                  <td className="py-2.5 pr-3 text-stone-500">
                    {row.reviewerName ?? "—"}
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectPackage(row.packageId)}
                        className="font-semibold text-[#7a3344] hover:underline"
                      >
                        View report
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownload(row.packageId)}
                        className="text-stone-600 hover:underline"
                      >
                        Download
                      </button>
                      {row.processingStatus === "Processed" ? (
                        <Link
                          href={`${METRIC_REVIEW_PATH}?companyId=${encodeURIComponent(companyId)}&packageId=${encodeURIComponent(row.packageId)}`}
                          className="text-stone-600 hover:underline"
                        >
                          Open review
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {selected ? (
        <CompanyReportDetail
          state={state}
          pkg={selected}
          onClose={() => onSelectPackage(null)}
          onDownload={() => onDownload(selected.id)}
        />
      ) : null}
    </div>
  );
}

function CompanyReportDetail({
  state,
  pkg,
  onClose,
  onDownload,
}: {
  state: PortfolioState;
  pkg: ReportingPackage;
  onClose: () => void;
  onDownload: () => void;
}) {
  const metrics = getPackageMetrics(state, pkg.id);
  const audit = (state.metricAuditLog ?? []).filter((a) => a.packageId === pkg.id);
  const [evidenceMetric, setEvidenceMetric] = useState<ExtractedMetric | null>(null);

  const counts = useMemo(() => {
    const approved = metrics.filter((m) => m.status === "Approved for reporting").length;
    const edited = metrics.filter(
      (m) =>
        m.originalExtractedValue != null &&
        m.originalExtractedValue !== m.extractedValue
    ).length;
    const rejected = metrics.filter((m) => m.status === "Rejected").length;
    const missing = metrics.filter((m) => m.status === "Missing from report").length;
    const needs = metrics.filter((m) => m.status === "Needs validation").length;
    return {
      total: metrics.length,
      approved,
      edited,
      rejected,
      missing,
      needs,
      coverage: pkg.coverage,
    };
  }, [metrics, pkg.coverage]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-stone-900/30">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close report detail"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-3xl flex-col bg-[#f4f2ef] shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-stone-900">
              {pkg.reportPeriod} report
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">{pkg.fileName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-stone-500 hover:bg-stone-100"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <SectionCard title="Report metadata">
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <Meta label="Company" value={pkg.companyName} />
              <Meta label="Reporting period" value={pkg.reportPeriod} />
              <Meta label="Filename" value={pkg.fileName} />
              <Meta label="Received" value={formatShortDate(pkg.uploadedAt)} />
              <Meta label="Processed" value={formatShortDate(pkg.processedAt)} />
              <Meta label="Run count" value={String(pkg.runCount)} />
              <Meta label="Processing status" value={pkg.status} />
              <Meta
                label="Assigned reviewer"
                value={pkg.assignedReviewerName ?? "—"}
              />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onDownload}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium"
              >
                Download PDF
              </button>
              <Link
                href={`${METRIC_REVIEW_PATH}?companyId=${encodeURIComponent(pkg.companyId)}&packageId=${encodeURIComponent(pkg.id)}`}
                className="rounded-xl bg-[#7a3344] px-3 py-2 text-sm font-medium text-white"
              >
                Open in Metric Review
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Metric summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
              <Stat label="Total found" value={counts.total} />
              <Stat label="Approved" value={counts.approved} />
              <Stat label="Edited" value={counts.edited} />
              <Stat label="Rejected" value={counts.rejected} />
              <Stat label="Missing" value={counts.missing} />
              <Stat label="Needs validation" value={counts.needs} />
              <Stat label="Coverage" value={`${counts.coverage}%`} />
            </div>
          </SectionCard>

          <SectionCard title="Extracted metrics">
            {metrics.length === 0 ? (
              <p className="text-sm text-stone-500">No metrics extracted for this report.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-[11px] font-semibold uppercase text-stone-400">
                    <tr>
                      <th className="pb-2 pr-2">Metric</th>
                      <th className="pb-2 pr-2">Extracted</th>
                      <th className="pb-2 pr-2">Final</th>
                      <th className="pb-2 pr-2">Unit</th>
                      <th className="pb-2 pr-2">Confidence</th>
                      <th className="pb-2 pr-2">Status</th>
                      <th className="pb-2 pr-2">Page</th>
                      <th className="pb-2 pr-2">Evidence</th>
                      <th className="pb-2">Reviewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} className="border-t border-stone-100 align-top">
                        <td className="py-2 pr-2 font-medium">{m.metricName}</td>
                        <td className="py-2 pr-2 tabular-nums text-stone-500">
                          {m.originalExtractedValue ?? m.extractedValue ?? "—"}
                        </td>
                        <td className="py-2 pr-2 tabular-nums">
                          {m.status === "Approved for reporting"
                            ? m.extractedValue || "—"
                            : m.extractedValue || "—"}
                        </td>
                        <td className="py-2 pr-2 text-stone-500">{m.unit}</td>
                        <td className="py-2 pr-2">{m.confidence}</td>
                        <td className="py-2 pr-2">
                          <MetricStatusBadge status={m.status} />
                        </td>
                        <td className="py-2 pr-2">{m.sourcePage || "—"}</td>
                        <td className="py-2 pr-2">
                          <button
                            type="button"
                            onClick={() => setEvidenceMetric(m)}
                            className="max-w-[8rem] truncate text-left text-xs text-[#7a3344] hover:underline"
                            title={m.evidenceText}
                          >
                            {m.evidenceText ? "View" : "—"}
                          </button>
                        </td>
                        <td className="py-2 text-xs text-stone-500">
                          {m.reviewedBy ?? "—"}
                          {m.reviewedAt ? (
                            <span className="block">{formatShortDate(m.reviewedAt)}</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Audit history">
            {audit.length === 0 ? (
              <p className="text-sm text-stone-500">No review decisions recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {audit
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )
                  .map((entry: MetricAuditEntry) => (
                    <li
                      key={entry.id}
                      className="rounded-xl border border-stone-100 bg-white px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-stone-800">
                        {entry.metricName} · {entry.action}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {entry.reviewer} · {formatShortDate(entry.timestamp)}
                        {entry.originalValue
                          ? ` · ${entry.originalValue} → ${entry.finalValue ?? "—"}`
                          : ""}
                      </p>
                      {entry.reason ? (
                        <p className="mt-1 text-xs text-stone-600">{entry.reason}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {evidenceMetric ? (
          <div className="absolute inset-0 z-20 flex items-end justify-center bg-stone-900/40 p-4 sm:items-center">
            <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg text-stone-900">
                  Evidence · {evidenceMetric.metricName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEvidenceMetric(null)}
                  className="text-sm text-stone-500"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Page {evidenceMetric.sourcePage || "—"}
              </p>
              <p className="mt-3 text-sm italic text-stone-700">
                {evidenceMetric.evidenceText || "No evidence excerpt available."}
              </p>
              <button
                type="button"
                onClick={onDownload}
                className="mt-4 text-sm font-semibold text-[#7a3344] hover:underline"
              >
                Open PDF
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-stone-800">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-[#faf9f7] px-3 py-2">
      <p className="text-[11px] text-stone-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-stone-900">{value}</p>
    </div>
  );
}
