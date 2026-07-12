"use client";

import { useState } from "react";
import type { ExtractedMetric } from "@/lib/portfolio/types";
import { isUnresolved } from "@/lib/portfolio/metric-review-selectors";
import {
  ConfidencePill,
  MetricIcon,
  MetricReviewStatusBadge,
  rowStateClass,
} from "./shared";

function MetricDecisionMenu({
  metric,
  onApprove,
  onEdit,
  onReject,
  onMarkMissing,
}: {
  metric: ExtractedMetric;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
  onMarkMissing: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (metric.status === "Approved for reporting") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
        Approved
      </span>
    );
  }

  if (metric.status === "Missing from report") {
    return (
      <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 ring-1 ring-inset ring-stone-200">
        Missing
      </span>
    );
  }

  if (metric.status === "Rejected") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        Rejected
      </span>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {isUnresolved(metric) ? (
          <button
            type="button"
            onClick={onApprove}
            title="Approve (A)"
            className="rounded-lg bg-[#7a3344] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#6a2b3a]"
          >
            Approve
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-stone-200 px-2 py-1 text-[11px] text-stone-600 hover:bg-stone-50"
          aria-label="More actions"
        >
          ▾
        </button>
      </div>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 min-w-[9rem] rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onApprove();
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-[11px] hover:bg-stone-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-[11px] hover:bg-stone-50"
          >
            Edit value
          </button>
          <button
            type="button"
            onClick={() => {
              onReject();
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-[11px] hover:bg-stone-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => {
              onMarkMissing();
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-[11px] hover:bg-stone-50"
          >
            Mark missing
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MetricReviewTable({
  metrics,
  selectedIds,
  selectedMetricId,
  onToggleSelect,
  onToggleSelectAll,
  onSelectMetric,
  onApprove,
  onEdit,
  onReject,
  onMarkMissing,
}: {
  metrics: ExtractedMetric[];
  selectedIds: Set<string>;
  selectedMetricId: string | null;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onSelectMetric: (metric: ExtractedMetric) => void;
  onApprove: (id: string) => void;
  onEdit: (metric: ExtractedMetric) => void;
  onReject: (id: string) => void;
  onMarkMissing: (id: string) => void;
}) {
  const allSelected = metrics.length > 0 && metrics.every((m) => selectedIds.has(m.id));

  return (
    <table className="min-w-[760px] w-full text-left text-sm">
      <thead>
        <tr className="border-b border-stone-100 bg-stone-50/80 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          <th className="w-10 px-3 py-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onToggleSelectAll(e.target.checked)}
              aria-label="Select all metrics"
            />
          </th>
          <th className="px-2 py-2">Metric</th>
          <th className="px-2 py-2">Extracted value</th>
          <th className="px-2 py-2">Confidence</th>
          <th className="px-2 py-2">Evidence</th>
          <th className="px-2 py-2">Status</th>
          <th className="px-3 py-2">Decision</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map((metric) => (
          <tr
            key={metric.id}
            className={`cursor-pointer border-b border-stone-100 ${rowStateClass(
              metric,
              selectedMetricId === metric.id
            )}`}
            onClick={() => onSelectMetric(metric)}
          >
            <td className="h-[70px] px-3" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.has(metric.id)}
                onChange={() => onToggleSelect(metric.id)}
                aria-label={`Select ${metric.metricName}`}
              />
            </td>
            <td className="px-2">
              <div className="flex items-center gap-2">
                <MetricIcon name={metric.metricName} />
                <div>
                  <p className="text-[12px] font-semibold text-stone-900">{metric.metricName}</p>
                  <p className="text-[10px] text-stone-500">{metric.unit}</p>
                </div>
              </div>
            </td>
            <td className="px-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold tabular-nums text-stone-900">
                  {metric.extractedValue || "—"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(metric);
                  }}
                  className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  title="Edit value (E)"
                  aria-label="Edit value"
                >
                  ✎
                </button>
              </div>
            </td>
            <td className="px-2">
              <ConfidencePill confidence={metric.confidence} showTooltip />
            </td>
            <td className="px-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMetric(metric);
                }}
                className="text-left text-[11px]"
              >
                <span className="block font-semibold text-stone-800">
                  {metric.sourcePage ? `Page ${metric.sourcePage}` : "—"}
                </span>
                <span className="font-semibold text-[#7a3344] hover:underline">View</span>
              </button>
            </td>
            <td className="px-2">
              <MetricReviewStatusBadge metric={metric} />
            </td>
            <td className="px-3" onClick={(e) => e.stopPropagation()}>
              <MetricDecisionMenu
                metric={metric}
                onApprove={() => onApprove(metric.id)}
                onEdit={() => onEdit(metric)}
                onReject={() => onReject(metric.id)}
                onMarkMissing={() => onMarkMissing(metric.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
