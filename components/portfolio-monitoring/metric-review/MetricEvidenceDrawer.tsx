"use client";

/**
 * Side drawer showing PDF evidence for a metric during review.
 */
import { useEffect, useState } from "react";
import {
  formatEvidenceDateTime,
  getComparablePreviousMetric,
  getMetricComparableHistory,
  highlightEvidenceExcerpt,
  inferSourceSection,
  MISSING_REASONS,
  REJECT_REASONS,
  getDisplayMetricStatus,
} from "@/lib/portfolio/metric-review-selectors";
import type { ExtractedMetric, ReportingPackage } from "@/lib/portfolio/types";
import { resolveSourceDownload, triggerSourceDownload } from "@/lib/portfolio/source-download";
import { PdfEvidencePreview } from "./PdfEvidencePreview";
import { MissingMetricFollowUpSection } from "@/components/portfolio-monitoring/communications/MetricFollowUpPanels";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";

function EvidenceConfidenceBadge({ confidence }: { confidence: ExtractedMetric["confidence"] }) {
  const styles = {
    Low: "bg-[#fdf2f4] text-[#7a3344] ring-[#7a3344]/15",
    Medium: "bg-sky-50 text-sky-800 ring-sky-100",
    High: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  };
  return (
    <span
      title="Confidence reflects extraction clarity, not whether the reported business result is correct."
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[confidence]}`}
    >
      {confidence} confidence
    </span>
  );
}

function statusTone(status: string): string {
  if (status === "Needs validation" || status === "Edited — needs approval") return "text-amber-700";
  if (status === "Approved for reporting") return "text-emerald-700";
  if (status === "Rejected") return "text-red-700";
  return "text-stone-700";
}

/** Drawer showing PDF evidence for a metric value. */
export function MetricEvidenceDrawer({
  metric,
  pkg,
  allMetrics,
  fileUrl,
  onClose,
  onApprove,
  onEdit,
  onReject,
  onMarkMissing,
  onNextUnresolved,
  onPrevUnresolved,
}: {
  metric: ExtractedMetric;
  pkg?: ReportingPackage | null;
  allMetrics: ExtractedMetric[];
  fileUrl?: string | null;
  onClose: () => void;
  onApprove: () => void;
  onEdit: () => void;
  onReject: (reason?: string) => void;
  onMarkMissing: (reason?: string) => void;
  onNextUnresolved?: () => void;
  onPrevUnresolved?: () => void;
}) {
  const [dialog, setDialog] = useState<"reject" | "missing" | "history" | null>(null);
  const [reason, setReason] = useState("");
  const [locateRequest, setLocateRequest] = useState(0);
  const [evidenceLocated, setEvidenceLocated] = useState(false);
  const { state } = usePortfolio();
  const companySector =
    state.companies.find((c) => c.id === metric.companyId)?.sector ?? "Enterprise Software";

  const previous = getComparablePreviousMetric(metric, allMetrics);
  const history = getMetricComparableHistory(metric, allMetrics);
  const excerpt = highlightEvidenceExcerpt(metric.evidenceText, metric.extractedValue);
  const displayStatus = getDisplayMetricStatus(metric);
  const section =
    metric.sourceSection?.trim() ||
    inferSourceSection(metric.evidenceText) ||
    null;
  const extractedOn = formatEvidenceDateTime(pkg?.processedAt ?? pkg?.uploadedAt);
  const sourceFileName = metric.sourceFile || pkg?.fileName || "report.pdf";
  const resolved = resolveSourceDownload({
    sourceFile: sourceFileName,
    companyId: metric.companyId,
    fileUrl,
  });
  const page = metric.sourcePage || 1;
  const hasEvidence = Boolean(metric.evidenceText?.trim());
  const isFoundValue = ![
    "Missing from report",
    "Optional metric not reported",
    "Not applicable",
    "Not configured",
  ].includes(metric.status);

  useEffect(() => {
    setEvidenceLocated(false);
  }, [metric.id]);

  const openInPdf = () => {
    if (!resolved.url) return;
    // Prefer opening the catalog/public path with page fragment; fall back to download.
    if (!resolved.url.startsWith("blob:")) {
      window.open(`${resolved.url}#page=${page}`, "_blank", "noopener,noreferrer");
      return;
    }
    void triggerSourceDownload(resolved.url, sourceFileName);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        if (dialog) setDialog(null);
        else onClose();
      } else if (e.key === "a" || e.key === "A") {
        if (isFoundValue && hasEvidence && !evidenceLocated) return;
        e.preventDefault();
        onApprove();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        onEdit();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setDialog("reject");
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setDialog("missing");
      } else if (e.key === "j" || e.key === "J") {
        onNextUnresolved?.();
      } else if (e.key === "k" || e.key === "K") {
        onPrevUnresolved?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, onApprove, onClose, onEdit, onNextUnresolved, onPrevUnresolved, isFoundValue, hasEvidence, evidenceLocated]);

  return (
    <>
      {/* Scrim — panel overlays so the package workspace is not squeezed */}
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/20"
        aria-label="Close evidence panel"
        onClick={onClose}
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-[min(420px,100vw)] flex-col border-l border-stone-200 bg-[#faf9f7] shadow-2xl"
        aria-label="Metric evidence panel"
      >
        {/* Sticky header */}
        <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[#faf9f7]/95 px-5 pb-4 pt-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[20px] font-semibold leading-tight text-stone-900">
                  {metric.metricName}
                </h2>
                <EvidenceConfidenceBadge confidence={metric.confidence} />
              </div>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[28px] font-bold tabular-nums leading-none text-stone-900">
                  {metric.extractedValue || "—"}
                </span>
                <span className="text-[13px] font-medium text-stone-500">{metric.unit}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close evidence panel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Validation summary */}
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  Status
                </p>
                <p className={`mt-1 text-[13px] font-semibold ${statusTone(displayStatus)}`}>
                  {displayStatus}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  Extracted on
                </p>
                <p className="mt-1 text-[13px] font-medium text-stone-800">{extractedOn}</p>
              </div>
              {metric.reviewedBy ? (
                <>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      Reviewed by
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-stone-800">
                      {metric.reviewedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      Reviewed at
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-stone-800">
                      {formatEvidenceDateTime(metric.reviewedAt)}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {(
            [
              "Missing from report",
              "Optional metric not reported",
              "Not applicable",
              "Not configured",
            ] as string[]
          ).includes(metric.status) ? (
            <MissingMetricFollowUpSection
              companyId={metric.companyId}
              companyName={metric.companyName}
              sector={companySector}
              metricName={metric.metricName}
              reportPeriod={metric.reportPeriod}
              packageId={metric.packageId}
              reportName={sourceFileName}
              status={metric.status}
              reason={
                metric.evidenceText ||
                `${metric.metricName} was not resolved as a found value for this package.`
              }
            />
          ) : null}

          {/* Source & location */}
          <section>
            <h3 className="text-[13px] font-semibold text-stone-900">Source &amp; location</h3>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-stone-900">
                  {metric.sourcePage ? `Page ${metric.sourcePage}` : "Page unavailable"}
                </p>
                {section ? (
                  <p className="mt-0.5 text-[12px] text-stone-500">{section}</p>
                ) : null}
                <p className="mt-1 truncate text-[11px] text-stone-600" title={sourceFileName}>
                  {sourceFileName}
                </p>
              </div>
              {resolved.url ? (
                <button
                  type="button"
                  onClick={openInPdf}
                  className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold text-[#7a3344] hover:underline"
                >
                  Open in PDF
                  <span aria-hidden>↗</span>
                </button>
              ) : null}
            </div>
          </section>

          {/* Extracted evidence */}
          <section>
            <h3 className="text-[13px] font-semibold text-stone-900">Extracted evidence</h3>
            {metric.tableContext?.rowLabel || metric.tableContext?.columnLabel ? (
              <p className="mt-1 text-[11px] text-stone-500">
                {[
                  metric.tableContext.rowLabel
                    ? `Row: ${metric.tableContext.rowLabel}`
                    : null,
                  metric.tableContext.columnLabel
                    ? `Column: ${metric.tableContext.columnLabel}`
                    : null,
                  metric.valueType ? `Type: ${metric.valueType}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            <div className="mt-2 rounded-xl border border-stone-200 bg-white p-3.5 text-[13px] leading-relaxed text-stone-700">
              {hasEvidence && excerpt ? (
                <button
                  type="button"
                  onClick={() => setLocateRequest((n) => n + 1)}
                  className="pdf-evidence-phrase block w-full rounded-sm bg-[rgba(253,224,71,0.28)] px-1 py-0.5 text-left text-stone-800 transition hover:bg-[rgba(253,224,71,0.4)]"
                  title="Locate this evidence in the PDF"
                >
                  {excerpt.before}
                  <span className="pdf-evidence-value rounded-[2px] bg-[rgba(250,204,21,0.72)] px-0.5 font-bold text-[#111827] shadow-[0_0_0_1px_rgba(217,119,6,0.65)]">
                    {excerpt.highlight}
                  </span>
                  {excerpt.after}
                </button>
              ) : hasEvidence ? (
                <button
                  type="button"
                  onClick={() => setLocateRequest((n) => n + 1)}
                  className="pdf-evidence-phrase block w-full rounded-sm bg-[rgba(253,224,71,0.28)] px-1 py-0.5 text-left transition hover:bg-[rgba(253,224,71,0.4)]"
                  title="Locate this evidence in the PDF"
                >
                  {metric.evidenceText}
                </button>
              ) : (
                <span className="text-stone-500">
                  Evidence text unavailable. Review the source page below.
                </span>
              )}
            </div>
            {isFoundValue && hasEvidence && !evidenceLocated ? (
              <p className="mt-2 text-[11px] font-medium text-amber-800">
                Waiting for PDF highlight — extracted text must appear in the document before
                approve.
              </p>
            ) : null}
            {isFoundValue && hasEvidence && evidenceLocated ? (
              <p className="mt-2 text-[11px] font-medium text-emerald-800">
                Verified — evidence is highlighted on the PDF below.
              </p>
            ) : null}
          </section>

          {/* PDF preview */}
          <PdfEvidencePreview
            sourceFile={sourceFileName}
            companyId={metric.companyId}
            pageNumber={page}
            fileUrl={fileUrl}
            highlightText={metric.extractedValue}
            evidenceText={metric.evidenceText}
            highlightKeywords={[metric.metricName]}
            metricName={metric.metricName}
            reportPeriod={metric.reportPeriod}
            valueType={metric.valueType}
            tableContext={metric.tableContext}
            locateRequest={locateRequest}
            onLocateAvailabilityChange={setEvidenceLocated}
            onOpenExternal={resolved.url ? openInPdf : undefined}
          />

          {/* Previous value */}
          <section>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-stone-900">Previous value (if any)</h3>
              <button
                type="button"
                onClick={() => setDialog("history")}
                className="text-[12px] font-semibold text-[#7a3344] hover:underline"
              >
                View history
              </button>
            </div>
            {previous ? (
              <p className="mt-1.5 text-[13px] text-stone-800">
                {previous.reportPeriod}: {previous.extractedValue} {previous.unit}
              </p>
            ) : (
              <p className="mt-1.5 text-[12px] text-stone-500">
                No previous approved value available.
              </p>
            )}
          </section>
        </div>

        {/* Sticky footer */}
        <footer className="sticky bottom-0 z-10 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={onApprove}
              disabled={isFoundValue && hasEvidence && !evidenceLocated}
              title={
                isFoundValue && hasEvidence && !evidenceLocated
                  ? "Approve is blocked until evidence is highlighted on the PDF"
                  : undefined
              }
              className="rounded-lg bg-emerald-700 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-1"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[12px] font-semibold text-stone-800 hover:bg-stone-50"
            >
              Edit value
            </button>
            <button
              type="button"
              onClick={() => {
                setReason("");
                setDialog("reject");
              }}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] font-semibold text-red-700 hover:bg-red-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => {
                setReason("");
                setDialog("missing");
              }}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[12px] font-semibold text-stone-800 hover:bg-stone-50"
            >
              Mark missing
            </button>
          </div>
        </footer>
      </aside>

      {/* Reject / missing / history dialogs */}
      {dialog === "reject" || dialog === "missing" ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-stone-900">
              {dialog === "reject"
                ? `Reject ${metric.metricName}?`
                : `Mark ${metric.metricName} as missing from this report?`}
            </h3>
            <label className="mt-3 block text-[12px] font-semibold text-stone-600">
              Reason {dialog === "reject" ? "(required)" : "(optional)"}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="">Select a reason…</option>
              {(dialog === "reject" ? REJECT_REASONS : MISSING_REASONS).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dialog === "reject" && !reason}
                onClick={() => {
                  if (dialog === "reject") onReject(reason || undefined);
                  else onMarkMissing(reason || undefined);
                  setDialog(null);
                  setReason("");
                }}
                className="rounded-lg bg-[#7a3344] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dialog === "history" ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
              <h3 className="text-base font-semibold text-stone-900">
                {metric.metricName} history
              </h3>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-50"
                aria-label="Close history"
              >
                ×
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-500">
                  No previous approved values available.
                </p>
              ) : (
                <ul className="space-y-3">
                  {history.map((row) => (
                    <li
                      key={`${row.reportPeriod}-${row.sourcePage}-${row.finalValue}`}
                      className="rounded-xl border border-stone-200 px-3 py-2.5"
                    >
                      <p className="text-[13px] font-semibold text-stone-900">
                        {row.reportPeriod}
                      </p>
                      <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div>
                          <dt className="text-stone-400">Extracted</dt>
                          <dd className="font-medium text-stone-800">{row.extractedValue}</dd>
                        </div>
                        <div>
                          <dt className="text-stone-400">Approved</dt>
                          <dd className="font-medium text-stone-800">{row.finalValue}</dd>
                        </div>
                        <div>
                          <dt className="text-stone-400">Status</dt>
                          <dd className="font-medium text-stone-800">{row.status}</dd>
                        </div>
                        <div>
                          <dt className="text-stone-400">Page</dt>
                          <dd className="font-medium text-stone-800">{row.sourcePage || "—"}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-stone-400">Reviewer</dt>
                          <dd className="font-medium text-stone-800">
                            {row.reviewer
                              ? `${row.reviewer}${row.reviewedAt ? ` · ${formatEvidenceDateTime(row.reviewedAt)}` : ""}`
                              : "—"}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-stone-400">Source</dt>
                          <dd className="truncate font-medium text-stone-800" title={row.sourceFile}>
                            {row.sourceFile}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
