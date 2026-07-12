"use client";

import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity";
import type { PortfolioState } from "@/lib/portfolio/types";
import { getRecentlyReviewedMetrics } from "@/lib/portfolio/metric-review-selectors";
import type { MetricAuditEntry } from "@/lib/portfolio/types";

export function RecentlyReviewedTable({
  state,
  decisionFilter,
  onDecisionFilterChange,
}: {
  state: PortfolioState;
  decisionFilter: "all" | MetricAuditEntry["action"];
  onDecisionFilterChange: (filter: "all" | MetricAuditEntry["action"]) => void;
}) {
  const rows = getRecentlyReviewedMetrics(state, decisionFilter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["all", "approved", "edited", "rejected", "marked_missing"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onDecisionFilterChange(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              decisionFilter === f
                ? "bg-[#7a3344] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-stone-500">No recent review decisions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full table-fixed text-left text-sm">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/80 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-2.5">Company</th>
                  <th className="px-2 py-2.5">Package</th>
                  <th className="px-2 py-2.5">Metric</th>
                  <th className="px-2 py-2.5">Decision</th>
                  <th className="px-2 py-2.5">Previous</th>
                  <th className="px-2 py-2.5">Final</th>
                  <th className="px-2 py-2.5">Reviewer</th>
                  <th className="px-4 py-2.5">Reviewed at</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ audit, metric, reportTitle }) => (
                  <tr key={audit.id} className="border-b border-stone-100">
                    <td className="max-w-0 overflow-hidden px-4 py-3 align-middle">
                      {metric ? (
                        <CompanyIdentity
                          companyId={metric.companyId}
                          companyName={metric.companyName}
                          size="sm"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-0 overflow-hidden px-2 py-3 text-xs text-stone-600">
                      <span className="block truncate" title={reportTitle}>
                        {reportTitle}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-xs font-medium">
                      {audit.metricName}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-xs capitalize">
                      {audit.action.replace("_", " ")}
                    </td>
                    <td className="max-w-0 overflow-hidden px-2 py-3 text-xs tabular-nums">
                      <span className="block truncate" title={audit.originalValue || undefined}>
                        {audit.originalValue || "—"}
                      </span>
                    </td>
                    <td className="max-w-0 overflow-hidden px-2 py-3 text-xs tabular-nums">
                      <span className="block truncate" title={audit.finalValue || undefined}>
                        {audit.finalValue || "—"}
                      </span>
                    </td>
                    <td className="max-w-0 overflow-hidden px-2 py-3 text-xs">
                      <span className="block truncate">{audit.reviewer}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                      {new Date(audit.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
