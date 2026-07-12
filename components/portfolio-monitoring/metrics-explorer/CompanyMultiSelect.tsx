"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CompanyAvatar } from "@/components/portfolio-monitoring/company-identity";
import type { ExplorerCompanyOption } from "@/lib/portfolio/metrics-explorer-selectors";

function selectionLabel(selectedIds: string[], selectedOptions: ExplorerCompanyOption[]): string {
  if (selectedIds.length === 0) return "All companies";
  if (selectedIds.length === 1) return selectedOptions[0]?.name ?? "1 company selected";
  return `${selectedIds.length} companies selected`;
}

export function CompanyMultiSelect({
  options,
  selectedIds,
  selectedCompaniesForLabel,
  companySearch,
  onSearchChange,
  onToggle,
  onSelectAllVisible,
  onClearSelection,
  openRequestToken,
}: {
  options: ExplorerCompanyOption[];
  selectedIds: string[];
  selectedCompaniesForLabel: { id: string; name: string }[];
  companySearch: string;
  onSearchChange: (value: string) => void;
  onToggle: (companyId: string) => void;
  onSelectAllVisible: (companyIds: string[]) => void;
  onClearSelection: () => void;
  openRequestToken?: number;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selectedOptions = useMemo(
    () =>
      selectedIds
        .map((id) => {
          const fromOptions = options.find((o) => o.id === id);
          if (fromOptions) return fromOptions;
          const fromLabel = selectedCompaniesForLabel.find((c) => c.id === id);
          if (fromLabel) {
            return { id: fromLabel.id, name: fromLabel.name, sector: "" };
          }
          return null;
        })
        .filter((o): o is ExplorerCompanyOption => Boolean(o)),
    [options, selectedIds, selectedCompaniesForLabel]
  );

  const allVisibleSelected =
    options.length > 0 && options.every((option) => selectedIds.includes(option.id));

  const openPicker = useCallback(() => {
    setOpen(true);
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (openRequestToken && openRequestToken > 0) {
      openPicker();
    }
  }, [openRequestToken, openPicker]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }
  }, [open]);

  function handleSelectAllVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(options.map((o) => o.id));
      onSelectAllVisible(selectedIds.filter((id) => !visibleIds.has(id)));
      return;
    }
    const visibleIds = options.map((o) => o.id);
    const toAdd = visibleIds.filter((id) => !selectedIds.includes(id));
    if (toAdd.length === 0) return;
    onSelectAllVisible([...selectedIds, ...toAdd]);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        openPicker();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && options[activeIndex]) {
      event.preventDefault();
      onToggle(options[activeIndex].id);
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-[14rem] flex-1">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Companies</span>
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm text-stone-800"
        >
          <span>{selectionLabel(selectedIds, selectedOptions)}</span>
          <svg className="h-4 w-4 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </label>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg"
          role="presentation"
        >
          <div className="border-b border-stone-100 p-2">
            <input
              ref={searchRef}
              type="search"
              value={companySearch}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search company by name..."
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              aria-label="Search company by name"
            />
          </div>

          <div className="max-h-72 overflow-y-auto p-2" id={listboxId} role="listbox" aria-multiselectable="true">
            {options.length > 0 && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-stone-50">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={handleSelectAllVisible}
                  className="rounded border-stone-300"
                />
                <span className="font-medium text-stone-700">
                  Select all visible ({options.length})
                </span>
              </label>
            )}

            {options.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-stone-500">
                {companySearch.trim()
                  ? `No companies match “${companySearch.trim()}”`
                  : "No companies available for this filter."}
              </p>
            ) : (
              options.map((option, index) => {
                const checked = selectedIds.includes(option.id);
                return (
                  <label
                    key={option.id}
                    role="option"
                    aria-selected={checked}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 hover:bg-stone-50 ${
                      index === activeIndex ? "bg-stone-50 ring-1 ring-stone-200" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(option.id)}
                      className="mt-1 rounded border-stone-300"
                      aria-label={`Select ${option.name}`}
                    />
                    <CompanyAvatar companyId={option.id} companyName={option.name} size="md" className="mt-0.5" />
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="block truncate text-sm font-medium text-stone-900" title={option.name}>
                        {option.name}
                      </span>
                      <span className="block truncate text-xs text-stone-500">{option.sector}</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>

          <div className="border-t border-stone-100 px-3 py-2 text-xs text-stone-500">
            <div className="flex items-center justify-between gap-2">
              <span>{selectedIds.length === 0 ? "All matching companies included" : `${selectedIds.length} selected`}</span>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="shrink-0 font-semibold text-[#7a3344] hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-stone-400">
              No companies selected means all matching companies are included.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
