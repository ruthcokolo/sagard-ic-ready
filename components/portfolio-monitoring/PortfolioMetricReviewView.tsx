"use client";

/**
 * Legacy demo view for portfolio metrics extraction (separate from main review).
 */
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

/** Renders the portfolio metric review view UI. */
export function PortfolioMetricReviewView() {
  const [processed, setProcessed] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "validation">("validation");

  const summary = useMemo(() => getPortfolioSummary(), []);
  const coverage = useMemo(() => getCoverageMatrix(), []);
  const metrics = useMemo(() => {
    const rows = PORTFOLIO_METRICS;
    if (filter === "validation") {
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
    <div className="px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Metric review</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Validate metrics extracted from company-provided reporting packages before they are
            approved for reporting.
          </p>
        </div>
        <a
          href={GITHUB_POC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13px] font-semibold text-stone-700 hover:border-[#7a3344]/30 hover:bg-[#fdf2f4]"
        >
          Python extraction pipeline
          <IconExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-semibold text-stone-900">Reporting packages batch</h3>
          <p className="mt-1 text-xs text-stone-500">
            {SAMPLE_REPORTS.length} company-provided PDFs
          </p>

          <ul className="mt-4 space-y-3">
            {SAMPLE_REPORTS.map((report) => (
              <li
                key={report.id}
                className="rounded-xl border border-stone-200 bg-stone-50/60 p-3"
              >
                <p className="text-sm font-medium text-stone-900">{report.company}</p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-stone-400">
                  {report.fileName}
                </p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={runExtraction}
            disabled={processing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a3344] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5a2533] disabled:opacity-80"
          >
            {processing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Extracting metrics…
              </>
            ) : (
              <>
                <IconRefreshCheck className="h-4 w-4" />
                Re-run extraction
              </>
            )}
          </button>
        </section>

        <div className="space-y-6">
          {processed && (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Metrics extracted" value={summary.metricCount.toString()} />
                <StatCard
                  label="Needs validation"
                  value={summary.lowConfidence.toString()}
                  hint="Confidence below 85%"
                />
                <StatCard label="Companies" value={summary.reportCount.toString()} />
              </section>

              <section className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="border-b border-stone-100 px-5 py-4">
                  <h3 className="text-sm font-semibold text-stone-900">Coverage matrix</h3>
                </div>
                <div className="overflow-x-auto p-4">
                  <CoverageTable coverage={coverage} />
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                  <h3 className="text-sm font-semibold text-stone-900">Extraction review</h3>
                  <div className="flex rounded-lg border border-stone-200 p-0.5">
                    <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                      All metrics
                    </FilterButton>
                    <FilterButton
                      active={filter === "validation"}
                      onClick={() => setFilter("validation")}
                    >
                      Needs validation ({summary.lowConfidence})
                    </FilterButton>
                  </div>
                </div>
                <MetricsTable metrics={metrics} />
              </section>
            </>
          )}
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-stone-400">
        All metrics are extracted from company-provided reports and require human validation before
        use.
      </p>
    </div>
  );
}

function StatCard({
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

function CoverageTable({
  coverage,
}: {
  coverage: ReturnType<typeof getCoverageMatrix>;
}) {
  if (!coverage.length) return null;
  const headers = coverage[0].cells;
  return (
    <table className="min-w-full text-left text-sm">
      <thead className="text-[11px] uppercase tracking-wide text-stone-500">
        <tr>
          <th className="pb-2 pr-4">Company</th>
          {headers.map((h) => (
            <th key={h.key} className="px-2 pb-2 text-center">
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {coverage.map((row) => (
          <tr key={row.company} className="border-t border-stone-100">
            <td className="py-2 pr-4 font-medium text-stone-900">{row.company}</td>
            {row.cells.map((cell) => (
              <td key={cell.key} className="px-2 py-2 text-center text-stone-500">
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
  );
}

function MetricsTable({ metrics }: { metrics: PortfolioMetric[] }) {
  return (
    <div className="overflow-x-auto">
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
            <tr
              key={`${metric.company}-${metric.metricKey}`}
              className="border-t border-stone-100 align-top"
            >
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
              <td className="px-3 py-3 text-xs text-stone-600">
                {methodLabel(metric.extractionMethod)}
              </td>
              <td className="max-w-xs px-3 py-3">
                <p className="text-xs text-stone-500">p.{metric.sourcePage}</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {metric.sourceSnippet}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
