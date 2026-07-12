"use client";

/**
 * Row action menu and modals for reassign, due date, and priority changes.
 */
import { useEffect, useRef, useState } from "react";
import type { CompanyReviewLandingRow } from "@/lib/portfolio/metric-review-landing-selectors";
import type { ReviewPriority } from "@/lib/portfolio/types";

/** Action types available in the review row menu. */
export type RowMenuAction =
  | "assignToMe"
  | "reassign"
  | "addWaitlist"
  | "editWaitlist"
  | "removeWaitlist"
  | "changeDueDate"
  | "changePriority"
  | "viewCompany"
  | "viewPackage"
  | "downloadPdf"
  | "retryProcessing"
  | "viewAudit";

/** Per-row action menu during metric review. */
export function ReviewRowActionsMenu({
  row,
  isCurrentAssignee,
  onAction,
}: {
  row: CompanyReviewLandingRow;
  isCurrentAssignee: boolean;
  onAction: (action: RowMenuAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const items: { id: RowMenuAction; label: string; danger?: boolean }[] = [];

  if (row.packageId) {
    if (!isCurrentAssignee) {
      items.push({ id: "assignToMe", label: "Assign to me" });
    }
    items.push({ id: "reassign", label: "Reassign reviewer" });
    if (row.isWaitlisted) {
      items.push({ id: "editWaitlist", label: "Edit waitlist" });
      items.push({ id: "removeWaitlist", label: "Remove from waitlist" });
    } else if (row.reviewStatus !== "Completed") {
      items.push({ id: "addWaitlist", label: "Add to review waitlist" });
    }
    items.push({ id: "changeDueDate", label: "Change due date" });
    items.push({ id: "changePriority", label: "Change priority" });
    items.push({ id: "viewPackage", label: "View package" });
    items.push({ id: "downloadPdf", label: "Download source PDF" });
    if (row.reviewStatus === "Extraction failed") {
      items.push({ id: "retryProcessing", label: "Retry processing" });
    }
    items.push({ id: "viewAudit", label: "View audit history" });
  }
  items.push({ id: "viewCompany", label: "View company" });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700"
        aria-label="More actions"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onAction(item.id);
              }}
              className={`block w-full px-3 py-2 text-left text-xs hover:bg-stone-50 ${
                item.danger ? "text-red-600" : "text-stone-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Modal to change who is assigned to review a package. */
export function ReassignReviewerModal({
  open,
  currentName,
  onClose,
  onSave,
}: {
  open: boolean;
  currentName: string | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(currentName ?? "");
  useEffect(() => {
    if (open) setName(currentName ?? "");
  }, [open, currentName]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-stone-900">Reassign reviewer</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Reviewer name"
          className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#7a3344]/40"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim())}
            className="rounded-lg bg-[#7a3344] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal to change the due date on a review item. */
export function ChangeDueDateModal({
  open,
  currentDueDate,
  onClose,
  onSave,
}: {
  open: boolean;
  currentDueDate: string | null;
  onClose: () => void;
  onSave: (isoDate: string) => void;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (open) {
      setValue(currentDueDate ? currentDueDate.slice(0, 10) : "");
    }
  }, [open, currentDueDate]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-stone-900">Change due date</h3>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#7a3344]/40"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!value}
            onClick={() => onSave(new Date(value).toISOString())}
            className="rounded-lg bg-[#7a3344] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal to change the priority on a review item. */
export function ChangePriorityModal({
  open,
  current,
  onClose,
  onSave,
}: {
  open: boolean;
  current: ReviewPriority;
  onClose: () => void;
  onSave: (priority: ReviewPriority) => void;
}) {
  const [value, setValue] = useState<ReviewPriority>(current);
  useEffect(() => {
    if (open) setValue(current);
  }, [open, current]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-stone-900">Change priority</h3>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as ReviewPriority)}
          className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#7a3344]/40"
        >
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(value)}
            className="rounded-lg bg-[#7a3344] px-3 py-2 text-sm font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
