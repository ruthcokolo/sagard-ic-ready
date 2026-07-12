"use client";

import { useEffect, useRef, useState } from "react";
import {
  endOfWeekIso,
  getBulkAssignButtonLabel,
  startOfDayIso,
} from "@/lib/portfolio/bulk-assignment";
import type { CompanyReviewLandingRow } from "@/lib/portfolio/metric-review-landing-selectors";
import type { ReviewPriority } from "@/lib/portfolio/types";

export function BulkSelectionToolbar({
  selectedRows,
  pageAssignableCount,
  totalFilteredAssignable,
  selectionMode,
  canAssign,
  onClear,
  onSelectAllFiltered,
  onAssign,
  onSetDueDate,
  onChangePriority,
}: {
  selectedRows: CompanyReviewLandingRow[];
  pageAssignableCount: number;
  totalFilteredAssignable: number;
  selectionMode: "page" | "all_filtered";
  canAssign: boolean;
  onClear: () => void;
  onSelectAllFiltered: () => void;
  onAssign: () => void;
  onSetDueDate: () => void;
  onChangePriority: () => void;
}) {
  const count = selectedRows.length;
  const label = getBulkAssignButtonLabel(selectedRows);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const allPageSelected =
    selectionMode === "page" &&
    pageAssignableCount > 0 &&
    count >= pageAssignableCount &&
    totalFilteredAssignable > pageAssignableCount;

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  return (
    <div className="sticky top-0 z-20 border-b border-[#7a3344]/20 bg-[#fdf2f4] px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#7a3344]">
            {selectionMode === "all_filtered"
              ? `All ${count} matching companies selected`
              : `${count} compan${count === 1 ? "y" : "ies"} selected`}
          </p>
          {allPageSelected ? (
            <button
              type="button"
              onClick={onSelectAllFiltered}
              className="mt-1 text-[11px] font-semibold text-[#7a3344] hover:underline"
            >
              Select all {totalFilteredAssignable} companies matching the current filters
            </button>
          ) : null}
          {selectionMode === "all_filtered" ? (
            <button
              type="button"
              onClick={onClear}
              className="mt-1 text-[11px] font-semibold text-[#7a3344] hover:underline"
            >
              Clear selection
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {canAssign ? (
            <button
              type="button"
              onClick={onAssign}
              title="Assign the selected companies to a reviewer. Existing assignments will be replaced after confirmation."
              className="rounded-lg bg-[#7a3344] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#6a2b3a]"
            >
              {label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSetDueDate}
            className="rounded-lg border border-[#7a3344]/25 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700 hover:bg-white/80"
          >
            Set due date
          </button>
          <button
            type="button"
            onClick={onChangePriority}
            className="rounded-lg border border-[#7a3344]/25 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700 hover:bg-white/80"
          >
            Change priority
          </button>
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className="rounded-lg border border-[#7a3344]/25 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-stone-700"
            >
              More
            </button>
            {moreOpen ? (
              <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onClear();
                  }}
                  className="block w-full px-3 py-2 text-left text-[12px] text-stone-700 hover:bg-stone-50"
                >
                  Clear selection
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-stone-600 hover:bg-[#f8e8eb]"
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}

export type BulkDueDatePreset = "none" | "today" | "tomorrow" | "week" | "custom";

export function BulkDueDateModal({
  open,
  count,
  onClose,
  onSave,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onSave: (iso: string | null) => void;
}) {
  const [preset, setPreset] = useState<BulkDueDatePreset>("none");
  const [custom, setCustom] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-stone-900">Set due date</h3>
        <p className="mt-1 text-xs text-stone-500">
          Apply to {count} selected compan{count === 1 ? "y" : "ies"}
        </p>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as BulkDueDatePreset)}
          className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          <option value="none">No due date</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="week">End of week</option>
          <option value="custom">Custom date</option>
        </select>
        {preset === "custom" ? (
          <input
            type="date"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={preset === "custom" && !custom}
            onClick={() => {
              if (preset === "none") onSave(null);
              else if (preset === "today") onSave(startOfDayIso(0));
              else if (preset === "tomorrow") onSave(startOfDayIso(1));
              else if (preset === "week") onSave(endOfWeekIso());
              else if (custom) onSave(new Date(custom).toISOString());
            }}
            className="rounded-lg bg-[#7a3344] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulkPriorityModal({
  open,
  count,
  onClose,
  onSave,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onSave: (priority: ReviewPriority) => void;
}) {
  const [value, setValue] = useState<ReviewPriority>("Normal");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-stone-900">Change priority</h3>
        <p className="mt-1 text-xs text-stone-500">
          Apply to {count} selected compan{count === 1 ? "y" : "ies"}
        </p>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as ReviewPriority)}
          className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          {(["Urgent", "High", "Normal", "Low"] as ReviewPriority[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(value)}
            className="rounded-lg bg-[#7a3344] px-3 py-2 text-sm font-semibold text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
