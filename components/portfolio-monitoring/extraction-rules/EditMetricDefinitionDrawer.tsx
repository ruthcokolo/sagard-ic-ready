"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ExtractionRule,
  MetricDataType,
  MetricValueContext,
} from "@/lib/portfolio/types";
import {
  METRIC_CONTEXT_LABELS,
  METRIC_DATA_TYPE_LABELS,
  findAliasConflicts,
  unitsForType,
} from "@/lib/portfolio/metric-definition-utils";

export type MetricDefinitionDraft = {
  metricName: string;
  description: string;
  type: MetricDataType;
  expectedUnit: string;
  enabled: boolean;
  aliases: string[];
  matchingGuidance: string;
  supportedContexts: MetricValueContext[];
};

const TYPES: MetricDataType[] = ["currency", "percentage", "count", "ratio", "text"];
const CONTEXTS: MetricValueContext[] = ["actual", "forecast", "budget", "prior_period"];

function emptyDraft(): MetricDefinitionDraft {
  return {
    metricName: "",
    description: "",
    type: "currency",
    expectedUnit: "USD",
    enabled: true,
    aliases: [],
    matchingGuidance: "",
    supportedContexts: ["actual"],
  };
}

function draftFromRule(rule: ExtractionRule): MetricDefinitionDraft {
  return {
    metricName: rule.metricName,
    description: rule.description ?? "",
    type: rule.type ?? "currency",
    expectedUnit: rule.expectedUnit === "percent" ? "%" : rule.expectedUnit,
    enabled: rule.enabled,
    aliases: [...rule.aliases],
    matchingGuidance: rule.matchingGuidance ?? "",
    supportedContexts: rule.supportedContexts?.length
      ? [...rule.supportedContexts]
      : ["actual"],
  };
}

export function EditMetricDefinitionDrawer({
  open,
  mode,
  rule,
  allRules,
  focusAliases,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  rule: ExtractionRule | null;
  allRules: ExtractionRule[];
  focusAliases?: boolean;
  onClose: () => void;
  onSave: (draft: MetricDefinitionDraft) => { success: boolean; message: string };
}) {
  const [draft, setDraft] = useState<MetricDefinitionDraft>(emptyDraft());
  const [aliasDraft, setAliasDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aliasWarning, setAliasWarning] = useState<string | null>(null);
  const aliasesRef = useRef<HTMLDivElement>(null);
  const initialRef = useRef<MetricDefinitionDraft | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = mode === "edit" && rule ? draftFromRule(rule) : emptyDraft();
    setDraft(next);
    initialRef.current = next;
    setAliasDraft("");
    setError(null);
    setAliasWarning(null);
    if (focusAliases) {
      window.setTimeout(() => aliasesRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [open, mode, rule, focusAliases]);

  const unitOptions = useMemo(() => unitsForType(draft.type), [draft.type]);

  useEffect(() => {
    if (!open) return;
    if (!unitOptions.includes(draft.expectedUnit)) {
      setDraft((d) => ({ ...d, expectedUnit: unitOptions[0] }));
    }
  }, [open, unitOptions, draft.expectedUnit]);

  if (!open) return null;

  const initial = initialRef.current;
  const hasChanges =
    mode === "create" ||
    !initial ||
    JSON.stringify(draft) !== JSON.stringify(initial);

  const canSave =
    hasChanges &&
    draft.metricName.trim().length > 0 &&
    draft.supportedContexts.length > 0 &&
    draft.description.length <= 300 &&
    draft.matchingGuidance.length <= 500;

  const tryAddAlias = (force = false) => {
    const value = aliasDraft.trim().toLowerCase();
    if (!value) return;
    if (draft.aliases.includes(value)) {
      setAliasWarning("That alias is already on this metric.");
      return;
    }
    const conflicts = findAliasConflicts(
      allRules,
      value,
      mode === "edit" ? rule?.metricName : undefined
    );
    if (conflicts.length && !force) {
      setAliasWarning(
        `“${value}” is also used by ${conflicts.map((c) => c.metricName).join(", ")}.`
      );
      return;
    }
    setDraft((d) => ({ ...d, aliases: [...d.aliases, value] }));
    setAliasDraft("");
    setAliasWarning(null);
  };

  const handleSave = () => {
    setError(null);
    const result = onSave(draft);
    if (!result.success) {
      setError(result.message);
      return;
    }
    onClose();
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/20"
        aria-label="Close metric definition"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-stone-200 bg-white shadow-2xl sm:w-[min(400px,100vw)] md:w-[min(420px,55vw)]">
        <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 className="text-[17px] font-semibold text-stone-900">
            {mode === "create" ? "Add metric definition" : "Edit metric definition"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-[12px] font-semibold text-stone-700">
              Metric name <span className="text-[#7a3344]">*</span>
            </span>
            <input
              value={draft.metricName}
              onChange={(e) => setDraft((d) => ({ ...d, metricName: e.target.value }))}
              className="mt-1.5 w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-stone-700">Description</span>
            <textarea
              value={draft.description}
              maxLength={300}
              rows={3}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="mt-1.5 w-full rounded-md border border-stone-200 px-3 py-2 text-sm leading-relaxed"
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-stone-400">
              {draft.description.length} / 300
            </p>
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-stone-700">
              Type <span className="text-[#7a3344]">*</span>
            </span>
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  type: e.target.value as MetricDataType,
                }))
              }
              className="mt-1.5 w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {METRIC_DATA_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-stone-700">
              Expected unit <span className="text-[#7a3344]">*</span>
            </span>
            <select
              value={draft.expectedUnit}
              onChange={(e) => setDraft((d) => ({ ...d, expectedUnit: e.target.value }))}
              className="mt-1.5 w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold text-stone-700">Status</span>
            <select
              value={draft.enabled ? "active" : "inactive"}
              onChange={(e) =>
                setDraft((d) => ({ ...d, enabled: e.target.value === "active" }))
              }
              className="mt-1.5 w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <p className="mt-1 text-[11px] text-stone-500">
              {draft.enabled
                ? "ICReady will extract this metric from future PDFs."
                : "This definition remains in historical records but is not used for future extraction."}
            </p>
          </label>

          <div ref={aliasesRef}>
            <p className="text-[12px] font-semibold text-stone-700">Aliases</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {draft.aliases.length === 0 ? (
                <p className="text-[12px] text-stone-400">No aliases configured</p>
              ) : (
                draft.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700"
                  >
                    {alias}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          aliases: d.aliases.filter((a) => a !== alias),
                        }))
                      }
                      className="text-stone-400 hover:text-red-600"
                      aria-label={`Remove ${alias}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={aliasDraft}
                onChange={(e) => {
                  setAliasDraft(e.target.value);
                  setAliasWarning(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    tryAddAlias(false);
                  }
                }}
                placeholder="Add alias..."
                className="flex-1 rounded-md border border-stone-200 px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => tryAddAlias(false)}
                className="rounded-md border border-stone-200 px-3 py-1.5 text-[12px] font-semibold text-stone-700 hover:bg-stone-50"
              >
                Add
              </button>
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Add common variations, abbreviations, and synonyms used in company reports.
            </p>
            {aliasWarning ? (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                <p>{aliasWarning}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAliasWarning(null)}
                    className="rounded border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => tryAddAlias(true)}
                    className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-900"
                  >
                    Keep alias with warning
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <label className="block">
            <span className="text-[12px] font-semibold text-stone-700">Matching guidance</span>
            <textarea
              value={draft.matchingGuidance}
              maxLength={500}
              rows={4}
              onChange={(e) => setDraft((d) => ({ ...d, matchingGuidance: e.target.value }))}
              placeholder="Optional business context to reduce incorrect matches…"
              className="mt-1.5 w-full rounded-md border border-stone-200 px-3 py-2 text-sm leading-relaxed"
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-stone-400">
              {draft.matchingGuidance.length} / 500
            </p>
          </label>

          <fieldset>
            <legend className="text-[12px] font-semibold text-stone-700">Supported contexts</legend>
            <div className="mt-2 space-y-1.5">
              {CONTEXTS.map((ctx) => {
                const checked = draft.supportedContexts.includes(ctx);
                return (
                  <label key={ctx} className="flex items-center gap-2 text-[13px] text-stone-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          supportedContexts: checked
                            ? d.supportedContexts.filter((c) => c !== ctx)
                            : [...d.supportedContexts, ctx],
                        }))
                      }
                      className="rounded border-stone-300 text-[#7a3344]"
                    />
                    {METRIC_CONTEXT_LABELS[ctx]}
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-stone-500">
              Select which contexts this metric may appear in.
            </p>
          </fieldset>

          {error ? (
            <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex justify-end gap-2 border-t border-stone-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stone-200 px-3.5 py-2 text-[12px] font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="rounded-md bg-[#63202e] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#7a3344] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === "create" ? "Add metric" : "Save changes"}
          </button>
        </footer>
      </aside>
    </>
  );
}
