"use client";

/** Filter controls for the deal pipeline (stage, owner, readiness). */
import { categories } from "@/lib/categories";
import type { DealFilters, SortField } from "@/lib/deal-query";
import type { DealStage } from "@/lib/deal-types";
import { pipelineStats } from "@/lib/deals-pipeline";
import { IconSearch } from "@/components/ui/Icons";

const STAGES: { id: DealStage | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "screening", label: "Screening" },
  { id: "diligence", label: "Diligence" },
  { id: "ic_prep", label: "IC prep" },
  { id: "passed", label: "Passed on" },
];

const SORT_LABELS: Record<SortField, string> = {
  newest: "Newest",
  name: "Name",
  readiness: "Readiness",
  arr: "ARR",
  updated: "Updated",
};

/** Renders the pipeline filter bar UI. */
export function PipelineFilterBar({
  filters,
  onChange,
  sort,
  onSortChange,
  resultCount,
}: {
  filters: DealFilters;
  onChange: (next: DealFilters) => void;
  sort: SortField;
  onSortChange: (s: SortField) => void;
  resultCount: number;
}) {
  const set = (patch: Partial<DealFilters>) => onChange({ ...filters, ...patch });
  const activeStage = filters.stages.length === 1 ? filters.stages[0]! : "all";

  const selectStage = (stage: DealStage | "all") => {
    set({ stages: stage === "all" ? [] : [stage] });
  };

  return (
    <div className="space-y-3 border-b border-stone-200/70 bg-white px-8 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-xl">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search name, sector, owner, tag…"
            className="w-full rounded-lg border border-stone-200 bg-[#faf9f7] py-2.5 pl-9 pr-3 text-[13px] focus:border-[#9e4456] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e4456]/10 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        <select
          value={filters.categoryId}
          onChange={(e) => set({ categoryId: e.target.value })}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-stone-700"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id === "all" ? "All sectors" : c.label}
            </option>
          ))}
        </select>

        <select
          value={filters.owner}
          onChange={(e) => set({ owner: e.target.value })}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-stone-700"
        >
          <option value="all">All owners</option>
          {pipelineStats.owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortField)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-stone-700"
        >
          {(Object.keys(SORT_LABELS) as SortField[]).map((s) => (
            <option key={s} value={s}>
              Sort: {SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-stone-500">Stage:</span>
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectStage(s.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeStage === s.id
                ? "bg-[#7a3344] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-stone-500">
        <span className="font-semibold tabular-nums text-stone-800">
          {resultCount.toLocaleString()}
        </span>{" "}
        matches
      </p>
    </div>
  );
}
