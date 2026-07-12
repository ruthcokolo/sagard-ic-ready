"use client";

/**
 * Tab view with performance charts and metrics for a company.
 */
import { useMemo, useState } from "react";
import {
  CompanyProfileEmptyState,
  SectionCard,
  Sparkline,
} from "@/components/portfolio-monitoring/company-profile/shared";
import {
  getCompanyMetricHistory,
} from "@/lib/portfolio/company-profile-selectors";
import { periodSortKey } from "@/lib/portfolio/metric-comparison";
import type { ExtractedMetric, MetricName, PortfolioState } from "@/lib/portfolio/types";
import { METRIC_REVIEW_PATH } from "@/lib/portfolio/metric-review-url-state";

function sortKey(period: string) {
  return periodSortKey(period);
}

type Props = {
  state: PortfolioState;
  companyId: string;
  availableMetrics: MetricName[];
  hasPackages: boolean;
  hasApproved: boolean;
};

/** Performance metrics tab on the company profile. */
export function CompanyPerformanceView({
  state,
  companyId,
  availableMetrics,
  hasPackages,
  hasApproved,
}: Props) {
  const [metricName, setMetricName] = useState<MetricName | "">(
    availableMetrics[0] ?? ""
  );
  const [approvedOnly, setApprovedOnly] = useState(true);

  const history = useMemo(() => {
    if (!metricName) return [] as ExtractedMetric[];
    return getCompanyMetricHistory(state, companyId, metricName, approvedOnly);
  }, [state, companyId, metricName, approvedOnly]);

  const chartValues = history
    .filter((m) => m.normalizedValue != null)
    .map((m) => m.normalizedValue as number);

  if (!hasPackages) {
    return (
      <CompanyProfileEmptyState
        title="No reporting history yet"
        copy="Reports submitted by this company will appear here after they are uploaded and processed."
        action={{ href: "/dashboard/portfolio/reporting-packages", label: "Go to Reporting Packages" }}
      />
    );
  }

  if (!hasApproved && approvedOnly) {
    return (
      <CompanyProfileEmptyState
        title="No approved performance data yet"
        copy="Complete metric validation to populate company performance and trends."
        action={{ href: METRIC_REVIEW_PATH, label: "Open Metric Review" }}
      />
    );
  }

  if (availableMetrics.length === 0) {
    return (
      <CompanyProfileEmptyState
        title="No approved performance data yet"
        copy="Complete metric validation to populate company performance and trends."
        action={{ href: METRIC_REVIEW_PATH, label: "Open Metric Review" }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Performance trends" helper="Approved historical values by default">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-stone-500">Metric</span>
            <select
              value={metricName}
              onChange={(e) => setMetricName(e.target.value as MetricName)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              {availableMetrics.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={approvedOnly}
              onChange={(e) => setApprovedOnly(e.target.checked)}
              className="rounded border-stone-300 text-[#7a3344] focus:ring-[#7a3344]"
            />
            Approved only
          </label>
          {!approvedOnly ? (
            <p className="text-xs text-amber-700">
              Unapproved values are shown distinctly and never mixed silently with approved.
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-xl border border-stone-100 bg-[#faf9f7] p-4">
          {chartValues.length < 2 ? (
            <p className="text-sm text-stone-500">
              Need at least two periods with numeric values to chart a trend.
            </p>
          ) : (
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <TrendChart
                  points={history
                    .filter((m) => m.normalizedValue != null)
                    .map((m) => ({
                      period: m.reportPeriod,
                      value: m.normalizedValue as number,
                      approved: m.status === "Approved for reporting",
                    }))}
                />
              </div>
              <Sparkline values={chartValues} />
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase text-stone-400">
              <tr>
                <th className="pb-2 pr-3">Period</th>
                <th className="pb-2 pr-3">Value</th>
                <th className="pb-2 pr-3">Unit</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {[...history]
                .sort((a, b) => sortKey(b.reportPeriod) - sortKey(a.reportPeriod))
                .map((m, idx, arr) => {
                  const older = arr
                    .slice(idx + 1)
                    .find(
                      (p) =>
                        p.unit === m.unit &&
                        p.normalizedValue != null &&
                        m.normalizedValue != null &&
                        (approvedOnly
                          ? p.status === "Approved for reporting"
                          : true)
                    );
                  let change = "—";
                  if (
                    older &&
                    m.normalizedValue != null &&
                    older.normalizedValue != null &&
                    older.normalizedValue !== 0
                  ) {
                    const pct =
                      Math.round(
                        ((m.normalizedValue - older.normalizedValue) /
                          Math.abs(older.normalizedValue)) *
                          1000
                      ) / 10;
                    change = `${pct > 0 ? "↑" : pct < 0 ? "↓" : "→"} ${Math.abs(pct)}%`;
                  }
                  return (
                    <tr
                      key={m.id}
                      className={`border-t border-stone-100 ${
                        m.status !== "Approved for reporting" ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="py-2.5 pr-3 font-medium">{m.reportPeriod}</td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {m.extractedValue || "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-stone-500">{m.unit}</td>
                      <td className="py-2.5 pr-3 text-stone-600">{m.status}</td>
                      <td className="py-2.5 tabular-nums text-stone-500">{change}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function TrendChart({
  points,
}: {
  points: { period: string; value: number; approved: boolean }[];
}) {
  const sorted = [...points].sort((a, b) => sortKey(a.period) - sortKey(b.period));
  const values = sorted.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 520;
  const h = 160;
  const pad = 16;

  const coords = sorted.map((p, i) => {
    const x = pad + (i / Math.max(1, sorted.length - 1)) * (w - pad * 2);
    const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
    return { ...p, x, y };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full text-[#7a3344]" role="img">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={line} />
      {coords.map((c) => (
        <g key={c.period}>
          <circle
            cx={c.x}
            cy={c.y}
            r={4}
            fill={c.approved ? "#7a3344" : "#d97706"}
          />
          <text
            x={c.x}
            y={h - 2}
            textAnchor="middle"
            className="fill-stone-400"
            style={{ fontSize: 10 }}
          >
            {c.period}
          </text>
        </g>
      ))}
    </svg>
  );
}

