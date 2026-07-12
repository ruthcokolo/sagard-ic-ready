"use client";

import { useEffect, useMemo, useState } from "react";
import { CompanyAvatar } from "@/components/portfolio-monitoring/company-identity";
import { formatCompanyDisplayName } from "@/lib/portfolio/company-identity";
import {
  countCompaniesWithMultipleActivePackages,
  getBulkAssignButtonLabel,
  normalizeAssociateName,
  type BulkAssignmentPriority,
  type BulkPackageScope,
  type PortfolioReviewerOption,
} from "@/lib/portfolio/bulk-assignment";
import type { CompanyReviewLandingRow } from "@/lib/portfolio/metric-review-landing-selectors";
import type { PortfolioState } from "@/lib/portfolio/types";

export function BulkAssignmentModal({
  open,
  rows,
  state,
  reviewers,
  currentUserId,
  currentUserName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  rows: CompanyReviewLandingRow[];
  state: PortfolioState;
  reviewers: PortfolioReviewerOption[];
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
  onConfirm: (input: {
    reviewerId: string | null;
    reviewerName: string | null;
    dueDate: string | null | undefined;
    priority: BulkAssignmentPriority;
    note: string;
    packageScope: BulkPackageScope;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [reviewerId, setReviewerId] = useState<string | "unassigned" | "">(
    currentUserId
  );
  const [duePreset, setDuePreset] = useState<"keep" | "none" | "today" | "tomorrow" | "week" | "custom">("keep");
  const [customDue, setCustomDue] = useState("");
  const [priority, setPriority] = useState<BulkAssignmentPriority>("keep_existing");
  const [note, setNote] = useState("");
  const [packageScope, setPackageScope] = useState<BulkPackageScope>("latest_active");
  const [confirmReplace, setConfirmReplace] = useState(false);

  const title = getBulkAssignButtonLabel(rows).includes("Reassign")
    ? "Reassign companies"
    : "Assign companies";

  const replacingCount = rows.filter((r) => Boolean(r.assigneeId)).length;
  const multiActive = countCompaniesWithMultipleActivePackages(
    state,
    rows.map((r) => r.companyId)
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setReviewerId(currentUserId);
    setDuePreset("keep");
    setCustomDue("");
    setPriority("keep_existing");
    setNote("");
    setPackageScope("latest_active");
    setConfirmReplace(false);
  }, [open, currentUserId]);

  const filteredReviewers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviewers;
    return reviewers.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.roleLabel.toLowerCase().includes(q)
    );
  }, [reviewers, query]);

  const preview = rows.slice(0, 8);
  const extra = rows.length - preview.length;

  if (!open) return null;

  const resolveDue = (): string | null | undefined => {
    if (duePreset === "keep") return undefined;
    if (duePreset === "none") return null;
    if (duePreset === "today") {
      const d = new Date();
      d.setHours(17, 0, 0, 0);
      return d.toISOString();
    }
    if (duePreset === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(17, 0, 0, 0);
      return d.toISOString();
    }
    if (duePreset === "week") {
      const d = new Date();
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
      d.setHours(17, 0, 0, 0);
      return d.toISOString();
    }
    if (customDue) return new Date(customDue).toISOString();
    return undefined;
  };

  const selectedReviewer =
    reviewerId === "unassigned" || reviewerId === ""
      ? null
      : reviewers.find((r) => r.id === reviewerId) ?? {
          id: currentUserId,
          name: currentUserName,
          roleLabel: "Associate",
        };

  const canSubmit =
    reviewerId !== "" &&
    (duePreset !== "custom" || Boolean(customDue)) &&
    (replacingCount === 0 || confirmReplace);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-display text-xl text-stone-900">{title}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {rows.length} compan{rows.length === 1 ? "y" : "ies"} selected
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-stone-100 bg-[#faf9f7] p-2.5">
            {preview.map((row) => (
              <div key={row.companyId} className="flex items-center gap-2.5">
                <CompanyAvatar
                  companyId={row.companyId}
                  companyName={row.companyName}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-stone-900">
                    {formatCompanyDisplayName(row.companyName)}
                  </p>
                  <p className="truncate text-[11px] text-stone-500">
                    {row.assigneeName
                      ? `Currently assigned to ${row.assigneeName}`
                      : "Currently unassigned"}
                    {" · "}
                    {row.reviewStatus}
                  </p>
                </div>
              </div>
            ))}
            {extra > 0 ? (
              <p className="px-1 text-[11px] font-medium text-stone-500">
                +{extra} more companies
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Assign to
            </label>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviewers…"
              className="mt-1.5 h-9 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-[#7a3344]/40"
            />
            <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto">
              <li>
                <button
                  type="button"
                  onClick={() => setReviewerId(currentUserId)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left ${
                    reviewerId === currentUserId ? "bg-[#fdf2f4]" : "hover:bg-stone-50"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7a3344] text-[10px] font-bold text-white">
                    Me
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium text-stone-900">
                      Me — {currentUserName}
                    </span>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setReviewerId("unassigned")}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left ${
                    reviewerId === "unassigned" ? "bg-[#fdf2f4]" : "hover:bg-stone-50"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">
                    —
                  </span>
                  <span className="text-[13px] font-medium text-stone-900">Unassigned</span>
                </button>
              </li>
              {filteredReviewers
                .filter(
                  (r) =>
                    r.id !== currentUserId &&
                    normalizeAssociateName(r.name) !== normalizeAssociateName(currentUserName)
                )
                .map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setReviewerId(r.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left ${
                        reviewerId === r.id ? "bg-[#fdf2f4]" : "hover:bg-stone-50"
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-700 text-[10px] font-bold text-white">
                        {r.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span>
                        <span className="block text-[13px] font-medium text-stone-900">
                          {r.name}
                        </span>
                        <span className="block text-[11px] text-stone-500">
                          {r.roleLabel}
                          {r.activeReviewCount != null
                            ? ` · ${r.activeReviewCount} active reviews`
                            : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Review due date
            </label>
            <select
              value={duePreset}
              onChange={(e) =>
                setDuePreset(e.target.value as typeof duePreset)
              }
              className="mt-1.5 h-9 w-full rounded-lg border border-stone-200 px-3 text-sm"
            >
              <option value="keep">Keep existing</option>
              <option value="none">No due date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">End of week</option>
              <option value="custom">Custom date</option>
            </select>
            {duePreset === "custom" ? (
              <input
                type="date"
                value={customDue}
                onChange={(e) => setCustomDue(e.target.value)}
                className="mt-2 h-9 w-full rounded-lg border border-stone-200 px-3 text-sm"
              />
            ) : null}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as BulkAssignmentPriority)
              }
              className="mt-1.5 h-9 w-full rounded-lg border border-stone-200 px-3 text-sm"
            >
              <option value="keep_existing">Keep existing priority</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add context for the reviewer…"
              className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-stone-700">Assignment scope</p>
            <p className="mt-0.5 text-[12px] text-stone-600">
              Latest active reporting package for each selected company
            </p>
            {multiActive > 0 ? (
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] text-amber-800">
                  {multiActive} selected compan
                  {multiActive === 1 ? "y has" : "ies have"} multiple active packages.
                </p>
                <label className="flex items-center gap-2 text-[12px] text-stone-700">
                  <input
                    type="radio"
                    checked={packageScope === "latest_active"}
                    onChange={() => setPackageScope("latest_active")}
                  />
                  Assign latest active package only
                </label>
                <label className="flex items-center gap-2 text-[12px] text-stone-700">
                  <input
                    type="radio"
                    checked={packageScope === "all_active"}
                    onChange={() => setPackageScope("all_active")}
                  />
                  Assign all active packages
                </label>
              </div>
            ) : null}
          </div>

          {replacingCount > 0 ? (
            <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-[12px] text-amber-900">
              <input
                type="checkbox"
                checked={confirmReplace}
                onChange={(e) => setConfirmReplace(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                This will replace the current reviewer for {replacingCount} selected
                compan{replacingCount === 1 ? "y" : "ies"}. Confirm to continue.
              </span>
            </label>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onConfirm({
                reviewerId: reviewerId === "unassigned" ? null : selectedReviewer?.id ?? null,
                reviewerName:
                  reviewerId === "unassigned" ? null : selectedReviewer?.name ?? null,
                dueDate: resolveDue(),
                priority,
                note: note.trim(),
                packageScope,
              })
            }
            className="rounded-lg bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {title.includes("Reassign") ? "Reassign" : "Assign"} {rows.length} compan
            {rows.length === 1 ? "y" : "ies"}
          </button>
        </div>
      </aside>
    </div>
  );
}
