"use client";

/**
 * Dropdown menu with actions for a reporting requirement row.
 */
import { useEffect, useRef, useState } from "react";
import type { EffectiveRequirementRow } from "@/lib/portfolio/reporting-requirements";

/** Action menu for a requirement row (edit, disable, etc.). */
export function RequirementActionsMenu({
  row,
  canEdit,
  canReset,
  canViewHistory,
  hasHistory,
  showReset = true,
  onEdit,
  onReset,
  onHistory,
}: {
  row: EffectiveRequirementRow;
  canEdit: boolean;
  canReset: boolean;
  canViewHistory: boolean;
  hasHistory: boolean;
  showReset?: boolean;
  onEdit: () => void;
  onReset: () => void;
  onHistory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const showHistory = canViewHistory && hasHistory;
  if (!canEdit && !showHistory) return null;

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        type="button"
        aria-label={`Actions for ${row.metricName}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-800"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
          <circle cx="8" cy="3" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="8" cy="13" r="1.25" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          {canEdit ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-stone-800 hover:bg-stone-50"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit requirement
            </button>
          ) : null}
          {showReset && canEdit && canReset && row.isOverride ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-stone-800 hover:bg-stone-50"
              onClick={() => {
                setOpen(false);
                onReset();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
              Reset to sector default
            </button>
          ) : null}
          {showHistory ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-stone-800 hover:bg-stone-50"
              onClick={() => {
                setOpen(false);
                onHistory();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              View change history
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
