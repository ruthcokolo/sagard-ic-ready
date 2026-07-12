"use client";

/**
 * Table listing packages waiting in the review queue.
 */
import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity";
import type { ReviewQueueItem } from "@/lib/portfolio/metric-review-selectors";
import { ConfidencePill } from "./shared";

/** Table of packages still waiting for review. */
export function ReviewQueueTable({
  items,
  onReview,
}: {
  items: ReviewQueueItem[];
  onReview: (item: ReviewQueueItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-12 text-center">
        <h3 className="text-sm font-semibold text-stone-900">Review queue is clear</h3>
        <p className="mt-1 text-sm text-stone-500">All extracted metrics have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/80 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              <th className="px-4 py-2.5">Company</th>
              <th className="whitespace-nowrap px-2 py-2.5">Period</th>
              <th className="px-2 py-2.5">Package</th>
              <th className="px-2 py-2.5">Metric</th>
              <th className="px-2 py-2.5">Extracted value</th>
              <th className="px-2 py-2.5">Confidence</th>
              <th className="px-2 py-2.5">Issue</th>
              <th className="px-2 py-2.5">Age</th>
              <th className="px-4 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.metric.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                <td className="max-w-0 overflow-hidden px-4 py-3 align-middle">
                  <CompanyIdentity
                    companyId={item.metric.companyId}
                    companyName={item.metric.companyName}
                    size="sm"
                  />
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-xs text-stone-600">
                  {item.metric.reportPeriod}
                </td>
                <td className="max-w-0 overflow-hidden px-2 py-3 text-xs text-stone-600">
                  <span className="block truncate" title={item.reportTitle}>
                    {item.reportTitle}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-xs font-medium">
                  {item.metric.metricName}
                </td>
                <td className="max-w-0 overflow-hidden px-2 py-3 text-sm font-semibold tabular-nums">
                  <span className="block truncate" title={item.metric.extractedValue || undefined}>
                    {item.metric.extractedValue || "—"}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <ConfidencePill confidence={item.metric.confidence} />
                </td>
                <td className="max-w-0 overflow-hidden px-2 py-3 text-xs text-stone-600">
                  <span className="block truncate" title={item.issue}>
                    {item.issue}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-xs tabular-nums text-stone-500">
                  {item.ageDays}d
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onReview(item)}
                    className="text-xs font-semibold text-[#7a3344] hover:underline"
                  >
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
