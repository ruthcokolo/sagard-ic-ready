"use client";

import { useEffect, useState } from "react";
import { resolvePortfolioAssociateIdentity } from "@/lib/portfolio/bulk-assignment";
import type { ReviewPriority, ReviewWaitlistItem } from "@/lib/portfolio/types";

export type WaitlistFormValues = {
  scheduledDate: string;
  priority: ReviewPriority;
  assignedReviewerId: string;
  assignedReviewerName: string;
  note: string;
  reminder: boolean;
};

export function AddToWaitlistModal({
  open,
  mode,
  companyName,
  packageLabel,
  existing,
  defaultReviewerId,
  defaultReviewerName,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  companyName: string;
  packageLabel: string;
  existing: ReviewWaitlistItem | null;
  defaultReviewerId: string;
  defaultReviewerName: string;
  onClose: () => void;
  onSave: (values: WaitlistFormValues) => void;
}) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState<ReviewPriority>("Normal");
  const [reviewerName, setReviewerName] = useState(defaultReviewerName);
  const [note, setNote] = useState("");
  const [reminder, setReminder] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setScheduledDate(existing.scheduledDate.slice(0, 10));
      setPriority(existing.priority);
      setReviewerName(existing.assignedReviewerName);
      setNote(existing.note ?? "");
      setReminder(existing.reminder);
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setScheduledDate(nextWeek.toISOString().slice(0, 10));
      setPriority("Normal");
      setReviewerName(defaultReviewerName);
      setNote("");
      setReminder(false);
    }
  }, [open, existing, defaultReviewerName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-stone-900">
          {mode === "edit" ? "Edit waitlist" : "Add to review waitlist"}
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          {companyName} · {packageLabel}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-medium text-stone-500">
              Scheduled review date
            </span>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#7a3344]/40"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-medium text-stone-500">Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReviewPriority)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#7a3344]/40"
            >
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-medium text-stone-500">
              Assigned reviewer
            </span>
            <input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#7a3344]/40"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-medium text-stone-500">
              Optional note
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#7a3344]/40"
              placeholder="e.g. Waiting on revised financials"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
              className="rounded border-stone-300 text-[#7a3344]"
            />
            Optional reminder
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!scheduledDate || !reviewerName.trim()}
            onClick={() => {
              const identity = resolvePortfolioAssociateIdentity(reviewerName);
              onSave({
                scheduledDate: new Date(scheduledDate).toISOString(),
                priority,
                assignedReviewerId: identity.id,
                assignedReviewerName: identity.name,
                note: note.trim(),
                reminder,
              });
            }}
            className="rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {mode === "edit" ? "Save changes" : "Add to waitlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
