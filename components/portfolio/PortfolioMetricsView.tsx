"use client";

/** Standalone portfolio-metrics demo: batch extraction, coverage matrix, and human review table. */

import { useMemo, useState } from "react";
import {
  GITHUB_POC_URL,
  PORTFOLIO_METRICS,
  SAMPLE_REPORTS,
  type PortfolioMetric,
} from "@/lib/portfolio-metrics-data";
import {
  confidenceTone,
  formatMetricValue,
  getCoverageMatrix,
  getPortfolioSummary,
  methodLabel,
} from "@/lib/portfolio-metrics";
import { IconExternalLink, IconRefreshCheck } from "@/components/ui/Icons";

const FLOW_STEPS = [
  { label: "Reporting PDFs", sub: "Portfolio company packages" },
  { label: "Extract", sub: "Rules + provenance" },
  { label: "Review", sub: "Confidence + snippets" },
  { label: "Portfolio view", sub: "Compare across names" },
];

function ConfidencePill({ confidence }: { confidence: number }) {
  const tone = confidenceTone(confidence);
  const styles = {
    high: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-800",
    low: "bg-red-50 text-red-700",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}>
      {(confidence * 100).toFixed(0)}%
    </span>
  );
}

/** Full-page portfolio metrics workflow with simulated PDF extraction and review filters. */
export function PortfolioMetricsView() {
  const [processed, setProcessed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "review">("all");

  const summary = useMemo(() => getPortfolioSummary(), []);
  const coverage = useMemo(() => getCoverageMatrix(), []);
  const metrics = useMemo(() => {
    const rows = PORTFOLIO_METRICS;
    if (filter === "review") {
      return rows.filter((metric) => metric.confidence < 0.85);
    }
    return rows;
  }, [filter]);

  const runExtraction = () => {
    setProcessing(true);
    window.setTimeout(() => {
      setProcessing(false);
      setProcessed(true);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <header className="border-b border-stone-200/60 bg-white px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">
                New in ICReady
              </p>
              <span className="rounded-full bg-[#fdf2f4] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7a3344]">
                Beta
              </span>
            </div>
            <h1 className="font-display mt-1 text-[2.25rem] leading-tight text-stone-900">
              Portfolio metrics
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-stone-500">
              Extract financial and operating metrics from portfolio reporting PDFs — same human-review
              pattern as diligence, applied to post-investment monitoring.
            </p>
          </div>
          <a
            href={GITHUB_POC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13px] font-semibold text-stone-700 hover:border-[#7a3344]/30 hover:bg-[#fdf2f4]"
          >
            Python pipeline repo
            <IconExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      <section className="mx-8 mt-6 grid gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:grid-cols-4">
        {FLOW_STEPS.map((step, index) => (
          <div key={step.label} className="flex items-start gap-3 rounded-xl bg-stone-50/80 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7a3344] text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-stone-900">{step.label}</p>
              <p className="text-xs text-stone-500">{step.sub}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 px-8 py-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-stone-900">Incoming batch</h2>
          <p className="mt-1 text-xs text-stone-500">
            {SAMPLE_REPORTS.length} reporting packages ready to process
          </p>

          <ul className="mt-4 space-y-3">
            {SAMPLE_REPORTS.map((report) => (
              <li
                key={report.id}
                className="rounded-xl border border-stone-200 bg-stone-50/60 p-3"
              >
                <p className="text-sm font-medium text-stone-900">{report.company}</p>
                <p className="mt-0.5 text-[11px] text-stone-500">{report.period}</p>
                <p className="mt-2 truncate font-mono text-[10px] text-stone-400">{report.fileName}</p>
                <p className="mt-1 text-[11px] text-stone-500">{report.layout}</p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={runExtraction}
            disabled={processing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a3344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5a2533] disabled:cursor-wait disabled:opacity-80"
          >
            {processing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Extracting metrics…
              </>
            ) : processed ? (
              <>
                <IconRefreshCheck className="h-4 w-4" />
                Re-run extraction
              </>
            ) : (
              "Extract metrics"
            )}
          </button>

          {processed && (
            <p className="mt-3 text-xs text-emerald-700">
              {summary.metricCount} metrics extracted across {summary.reportCount} companies.
              {summary.lowConfidence > 0
                ? ` ${summary.lowConfidence} flagged for spot-check.`
                : ""}
            </p>
          )}
        </section>

        <div className="space-y-6">
          {!processed ? (
            <section className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/70 p-10 text-center">
              <p className="text-sm font-semibold text-stone-900">Run extraction to populate the review table</p>
              <p className="mt-2 max-w-md text-sm text-stone-500">
                This module uses the same trust model as IC diligence: AI extracts, humans verify before
                portfolio reporting.
              </p>
            </section>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Companies" value={summary.reportCount.toString()} />
                <SummaryCard label="Metrics extracted" value={summary.metricCount.toString()} />
                <SummaryCard
                  label="Needs spot-check"
                  value={summary.lowConfidence.toString()}
                  hint="Confidence below 85%"
                />
              </section>

              <section className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="border-b border-stone-100 px-5 py-4">
                  <h2 className="text-sm font-semibold text-stone-900">Coverage matrix</h2>
                  <p className="mt-1 text-xs text-stone-500">
                    Missing cells are expected — not every company reports every metric every period.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
                      <tr>
                        <th className="px-4 py-3">Company</th>
                        {coverage[0]?.cells.map((cell) => (
                          <th key={cell.key} className="px-3 py-3 text-center">
                            {cell.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coverage.map((row) => (
                        <tr key={row.company} className="border-t border-stone-100">
                          <td className="px-4 py-3 font-medium text-stone-900">{row.company}</td>
                          {row.cells.map((cell) => (
                            <td key={cell.key} className="px-3 py-3 text-center text-stone-500">
                              {cell.present ? (
                                <span className="font-semibold text-emerald-600">✓</span>
                              ) : (
                                "·"
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-stone-900">Extraction review</h2>
                    <p className="mt-1 text-xs text-stone-500">
                      Page, snippet, and method included for auditability.
                    </p>
                  </div>
                  <div className="flex rounded-lg border border-stone-200 p-0.5">
                    <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                      All metrics
                    </FilterButton>
                    <FilterButton active={filter === "review"} onClick={() => setFilter("review")}>
                      Spot-check ({summary.lowConfidence})
                    </FilterButton>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <MetricsTable metrics={metrics} />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[#7a3344]">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
        active ? "bg-[#7a3344] text-white" : "text-stone-600 hover:bg-stone-50"
      }`}
    >
      {children}
    </button>
  );
}

function MetricsTable({ metrics }: { metrics: PortfolioMetric[] }) {
  return (
    <table className="min-w-full text-left text-sm">
      <thead className="bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
        <tr>
          <th className="px-4 py-3">Company</th>
          <th className="px-3 py-3">Metric</th>
          <th className="px-3 py-3">Value</th>
          <th className="px-3 py-3">Confidence</th>
          <th className="px-3 py-3">Method</th>
          <th className="px-3 py-3">Source</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map((metric) => (
          <tr key={`${metric.company}-${metric.metricKey}`} className="border-t border-stone-100 align-top">
            <td className="px-4 py-3">
              <p className="font-medium text-stone-900">{metric.company}</p>
              <p className="text-xs text-stone-500">{metric.reportingPeriod ?? "—"}</p>
            </td>
            <td className="px-3 py-3 text-stone-700">{metric.metricName}</td>
            <td className="px-3 py-3 font-medium tabular-nums text-stone-900">
              {formatMetricValue(metric)}
            </td>
            <td className="px-3 py-3">
              <ConfidencePill confidence={metric.confidence} />
            </td>
            <td className="px-3 py-3 text-xs text-stone-600">{methodLabel(metric.extractionMethod)}</td>
            <td className="max-w-xs px-3 py-3">
              <p className="text-xs text-stone-500">p.{metric.sourcePage}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">{metric.sourceSnippet}</p>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
