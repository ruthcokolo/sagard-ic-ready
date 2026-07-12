"use client";

import { useEffect, useMemo, useState } from "react";
import type { MetricExpectationReasonSource, MetricRequirement } from "@/lib/portfolio/monitoring-phase-types";
import type { EffectiveRequirementRow } from "@/lib/portfolio/reporting-requirements";
import { RequirementBadge } from "./RequirementBadge";

export type EditRequirementDraft = {
  mode: "inherit" | MetricRequirement;
  reason: string;
  reasonSource: MetricExpectationReasonSource;
  otherSourceDetail: string;
};

const COMPANY_REQUIREMENT_OPTIONS: Array<{ value: EditRequirementDraft["mode"]; label: string }> = [
  { value: "inherit", label: "Inherit sector default" },
  { value: "required", label: "Required" },
  { value: "optional", label: "Optional" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "not_configured", label: "Not configured" },
];

const SECTOR_REQUIREMENT_OPTIONS: Array<{ value: MetricRequirement; label: string }> = [
  { value: "required", label: "Required" },
  { value: "optional", label: "Optional" },
  { value: "not_applicable", label: "Not applicable" },
  { value: "not_configured", label: "Not configured" },
];

const COMPANY_REASON_SOURCES: Array<{ value: MetricExpectationReasonSource; label: string }> = [
  { value: "company_policy", label: "Company policy" },
  { value: "investment_team_decision", label: "Investment team decision" },
  { value: "confirmed_ai_suggestion", label: "Confirmed AI suggestion" },
  { value: "other", label: "Other" },
];

export function EditRequirementDrawer({
  open,
  row,
  scope,
  companyName,
  sectorName,
  onClose,
  onSave,
  onOpenAudit,
}: {
  open: boolean;
  row: EffectiveRequirementRow | null;
  scope: "company" | "sector";
  companyName: string;
  sectorName: string;
  onClose: () => void;
  onSave: (draft: EditRequirementDraft) => void;
  onOpenAudit?: () => void;
}) {
  const [draft, setDraft] = useState<EditRequirementDraft>({
    mode: "inherit",
    reason: "",
    reasonSource: "company_policy",
    otherSourceDetail: "",
  });

  useEffect(() => {
    if (!open || !row) return;
    if (scope === "sector") {
      setDraft({
        mode: row.requirement,
        reason: row.rationale.startsWith("Sector default for") ? "" : row.rationale,
        reasonSource: "sector_policy",
        otherSourceDetail: "",
      });
      return;
    }
    setDraft({
      mode: row.isOverride ? row.requirement : "inherit",
      reason: row.isOverride ? row.rationale : "",
      reasonSource:
        row.rationaleSource === "investment_team_decision" ||
        row.rationaleSource === "confirmed_ai_suggestion" ||
        row.rationaleSource === "other" ||
        row.rationaleSource === "company_policy"
          ? row.rationaleSource
          : "company_policy",
      otherSourceDetail: "",
    });
  }, [open, row, scope]);

  const effectivePreview = useMemo(() => {
    if (!row) return null;
    if (scope === "sector") {
      const requirement = draft.mode === "inherit" ? row.requirement : draft.mode;
      return {
        requirement,
        caption: `for ${sectorName}`,
      };
    }
    if (draft.mode === "inherit") {
      return {
        requirement: row.sectorRequirement,
        caption: `Inherited from ${row.sectorKey}`,
      };
    }
    return {
      requirement: draft.mode,
      caption: `for ${companyName}`,
    };
  }, [draft.mode, row, companyName, sectorName, scope]);

  if (!open || !row || !effectivePreview) return null;

  const removing = scope === "company" && draft.mode === "inherit" && row.isOverride;
  const creatingOrChanging =
    scope === "sector"
      ? draft.mode !== row.requirement ||
        draft.reason.trim() !== (row.rationale.startsWith("Sector default for") ? "" : row.rationale.trim())
      : draft.mode !== "inherit" &&
        (!row.isOverride ||
          draft.mode !== row.requirement ||
          draft.reason.trim() !== (row.override?.reason ?? "").trim());

  const reasonRequired = scope === "sector" ? creatingOrChanging : creatingOrChanging;
  const reasonOk = !reasonRequired || draft.reason.trim().length >= 8;
  const otherOk =
    scope === "sector" ||
    draft.reasonSource !== "other" ||
    draft.mode === "inherit" ||
    draft.otherSourceDetail.trim().length >= 2;
  const hasChanges =
    scope === "sector"
      ? draft.mode !== row.requirement ||
        draft.reason.trim() !== (row.rationale.startsWith("Sector default for") ? "" : row.rationale.trim())
      : removing ||
        (draft.mode !== "inherit" &&
          (!row.isOverride ||
            draft.mode !== row.requirement ||
            draft.reason.trim() !== (row.override?.reason ?? "").trim() ||
            draft.reasonSource !== (row.override?.reasonSource ?? "company_policy")));

  const canSave = hasChanges && reasonOk && otherOk && draft.reason.length <= 500;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/20"
        aria-label="Close edit requirement"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-stone-200 bg-white shadow-2xl sm:w-[min(400px,100vw)] md:w-[min(420px,55vw)]">
        <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-stone-900">Edit requirement</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Metric</p>
            <p className="mt-1 text-[15px] font-semibold text-stone-900">{row.metricName}</p>
            <p className="mt-0.5 text-[12px] text-stone-500">{row.metricDescription}</p>
          </div>

          {scope === "company" ? (
            <section className="rounded-xl border border-stone-100 bg-[#faf9f7] p-3.5">
              <p className="text-[11px] font-semibold text-stone-600">Current inherited rule</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RequirementBadge requirement={row.sectorRequirement} />
                <span className="text-[12px] text-stone-600">
                  from {row.sectorKey} sector default
                </span>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-stone-100 bg-[#faf9f7] p-3.5">
              <p className="text-[11px] font-semibold text-stone-600">Current sector rule</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RequirementBadge requirement={row.requirement} />
                <span className="text-[12px] text-stone-600">{sectorName} sector default</span>
              </div>
            </section>
          )}

          <label className="block">
            <span className="text-[12px] font-semibold text-stone-700">
              {scope === "sector" ? "Sector requirement" : "Company requirement"}
            </span>
            <select
              value={draft.mode}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  mode: e.target.value as EditRequirementDraft["mode"],
                }))
              }
              className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              {(scope === "sector" ? SECTOR_REQUIREMENT_OPTIONS : COMPANY_REQUIREMENT_OPTIONS).map(
                (opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                )
              )}
            </select>
          </label>

          {scope === "sector" || draft.mode !== "inherit" ? (
            <>
              <label className="block">
                <span className="text-[12px] font-semibold text-stone-700">
                  Reason for change <span className="text-[#7a3344]">*</span>
                </span>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {scope === "sector"
                    ? "Explain why this sector should expect this requirement."
                    : "Explain why this company should have a different requirement."}
                </p>
                <textarea
                  value={draft.reason}
                  maxLength={500}
                  rows={5}
                  onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm leading-relaxed"
                  placeholder={
                    scope === "sector"
                      ? "Describe the sector rationale…"
                      : "Describe the company-specific rationale…"
                  }
                />
                <p className="mt-1 text-right text-[11px] tabular-nums text-stone-400">
                  {draft.reason.length} / 500
                </p>
              </label>

              {scope === "company" ? (
                <>
                  <label className="block">
                    <span className="text-[12px] font-semibold text-stone-700">Reason source</span>
                    <select
                      value={draft.reasonSource}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          reasonSource: e.target.value as MetricExpectationReasonSource,
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                    >
                      {COMPANY_REASON_SOURCES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {draft.reasonSource === "other" ? (
                    <label className="block">
                      <span className="text-[12px] font-semibold text-stone-700">
                        Source description <span className="text-[#7a3344]">*</span>
                      </span>
                      <input
                        value={draft.otherSourceDetail}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, otherSourceDetail: e.target.value }))
                        }
                        className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                        placeholder="Describe the source…"
                      />
                    </label>
                  ) : null}
                </>
              ) : (
                <p className="text-[12px] text-stone-500">
                  Reason source: <span className="font-medium text-stone-700">Sector policy</span>
                </p>
              )}
            </>
          ) : null}

          <section className="rounded-xl border border-stone-200 bg-white p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Effective result
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RequirementBadge requirement={effectivePreview.requirement} />
              <span className="text-[13px] text-stone-700">{effectivePreview.caption}</span>
            </div>
          </section>
        </div>

        <footer className="border-t border-stone-100 px-5 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-200 px-3.5 py-2 text-[12px] font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => onSave(draft)}
              className="rounded-lg bg-[#63202e] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#7a3344] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {removing
                ? "Remove override"
                : scope === "sector"
                  ? "Save requirement"
                  : "Save override"}
            </button>
          </div>
          <p className="mt-3 text-[11px] text-stone-500">
            All changes are logged in audit history.{" "}
            {onOpenAudit ? (
              <button
                type="button"
                onClick={onOpenAudit}
                className="font-semibold text-[#7a3344] hover:underline"
              >
                View audit history
              </button>
            ) : null}
          </p>
        </footer>
      </aside>
    </>
  );
}
