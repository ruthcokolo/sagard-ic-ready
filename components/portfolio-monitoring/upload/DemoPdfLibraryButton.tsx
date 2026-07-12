"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEMO_PDF_LIBRARY,
  fetchDemoPdfsAsFiles,
  getDemoPdfLibraryGrouped,
  type DemoPdfLibraryItem,
} from "@/lib/portfolio/demo-pdf-library";

type FilterId = "all" | "company_formatted" | "icready_template";

export function DemoPdfLibraryButton({
  disabled,
  onLoad,
}: {
  disabled?: boolean;
  onLoad: (files: File[]) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { companyFormatted, icreadyTemplate } = getDemoPdfLibraryGrouped();

  const visible = useMemo(() => {
    if (filter === "company_formatted") return companyFormatted;
    if (filter === "icready_template") return icreadyTemplate;
    return DEMO_PDF_LIBRARY;
  }, [filter, companyFormatted, icreadyTemplate]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setError(null);
      setFilter("all");
    }
  }, [open]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected(new Set(visible.map((e) => e.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const addSelected = async () => {
    const entries = DEMO_PDF_LIBRARY.filter((e) => selected.has(e.id));
    if (!entries.length) return;
    setError(null);
    setLoading(true);
    try {
      const { files, missing } = await fetchDemoPdfsAsFiles(entries);
      if (missing.length) {
        setError(
          missing.length === entries.length
            ? "Demo PDFs not found. Run npm run generate:demo-reports."
            : `Loaded ${files.length}; missing ${missing.length} file(s).`
        );
      }
      if (files.length) {
        await onLoad(files);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled || loading}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 text-[13px] font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
      >
        Load demo PDFs
        <svg className="h-3.5 w-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Select demo PDFs"
          className="absolute left-1/2 top-10 z-40 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl sm:left-0 sm:translate-x-0"
        >
          <div className="border-b border-stone-100 bg-[#faf9f7] px-3 py-2.5">
            <p className="text-[13px] font-semibold text-stone-900">Select demo PDFs</p>
            <p className="mt-0.5 text-[11px] text-stone-500">
              Choose one, some, or all files to add to the upload queue.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "All"],
                  ["company_formatted", "Company-formatted"],
                  ["icready_template", "ICReady template"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    filter === id
                      ? "bg-[#63202e] text-white"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-3 py-2">
            <p className="text-[11px] text-stone-500">
              {selected.size} selected · {visible.length} shown
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-[11px] font-semibold text-[#7a3344] hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] font-semibold text-stone-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <ul className="max-h-[min(320px,45vh)] overflow-auto">
            {visible.map((entry) => (
              <DemoPdfRow
                key={entry.id}
                entry={entry}
                checked={selected.has(entry.id)}
                onToggle={() => toggle(entry.id)}
              />
            ))}
          </ul>

          <div className="flex items-center justify-between gap-2 border-t border-stone-100 bg-[#faf9f7] px-3 py-2.5">
            {error ? <p className="min-w-0 flex-1 text-[11px] text-amber-800">{error}</p> : <span />}
            <button
              type="button"
              disabled={loading || selected.size === 0}
              onClick={() => void addSelected()}
              className="inline-flex h-8 shrink-0 items-center rounded-lg bg-[#63202e] px-3 text-[12px] font-semibold text-white hover:bg-[#521a26] disabled:opacity-40"
            >
              {loading ? "Adding…" : `Add selected (${selected.size})`}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DemoPdfRow({
  entry,
  checked,
  onToggle,
}: {
  entry: DemoPdfLibraryItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="border-b border-stone-50 last:border-0">
      <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 hover:bg-stone-50">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-stone-300 text-[#63202e] focus:ring-[#63202e]"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-medium text-stone-800" title={entry.fileName}>
            {entry.fileName}
          </span>
          <span className="mt-0.5 block text-[10px] text-stone-400">
            {entry.companyName} · {entry.reportPeriod} ·{" "}
            {entry.group === "icready_template" ? "ICReady Template" : "Original"}
          </span>
        </span>
      </label>
    </li>
  );
}
