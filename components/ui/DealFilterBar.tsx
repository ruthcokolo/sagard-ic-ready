"use client";

/** Reusable filter bar for deal list pages. */
import { categories } from "@/lib/categories";
import type { DealFilters, SortField } from "@/lib/deal-query";
import type { DealStage } from "@/lib/deal-types";
import { pipelineStats } from "@/lib/deals-pipeline";
import { IconFilter, IconSearch } from "@/components/ui/Icons";

const stages: { id: DealStage; label: string }[] = [
  { id: "screening", label: "Screening" },
  { id: "diligence", label: "Diligence" },
  { id: "ic_prep", label: "IC prep" },
  { id: "passed", label: "Passed on" },
];

/** Renders the deal filter bar UI. */
export function DealFilterBar({
  filters,
  onChange,
  sort,
  onSortChange,
  resultCount,
  showStageFilters = true,
  showWorkflowFilter = false,
  showMineToggle = false,
  resultCountLabel = "matches",
}: {
  filters: DealFilters;
  onChange: (next: DealFilters) => void;
  sort: SortField;
  onSortChange: (s: SortField) => void;
  resultCount: number;
  showStageFilters?: boolean;
  showWorkflowFilter?: boolean;
  showMineToggle?: boolean;
  resultCountLabel?: string;
}) {
  const set = (patch: Partial<DealFilters>) => onChange({ ...filters, ...patch });

  const toggleStage = (stage: DealStage) => {
    const stages = filters.stages.includes(stage)
      ? filters.stages.filter((s) => s !== stage)
      : [...filters.stages, stage];
    set({ stages });
  };

  return (
    <div className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/95 px-8 py-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-lg">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search name, sector, owner, tag…"
            className="w-full rounded-lg border border-stone-200 bg-[#faf9f7] py-2 pl-9 pr-3 text-[13px] focus:border-[#9e4456] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e4456]/10 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        <select
          value={filters.categoryId}
          onChange={(e) => set({ categoryId: e.target.value })}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={filters.owner}
          onChange={(e) => set({ owner: e.target.value })}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700"
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
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700"
        >
          <option value="newest">Newest</option>
          <option value="name">Name</option>
          <option value="readiness">Readiness</option>
          <option value="arr">ARR</option>
        </select>

        {showMineToggle && (
          <button
            type="button"
            onClick={() => set({ mineOnly: !filters.mineOnly })}
            className={`rounded-lg px-3 py-2 text-[13px] font-medium ${
              filters.mineOnly
                ? "bg-[#7a3344] text-white"
                : "border border-stone-200 bg-white text-stone-700"
            }`}
          >
            Mine only
          </button>
        )}
      </div>

      {showStageFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            <IconFilter className="mr-1 inline" /> Stage
          </span>
          {stages.map((s) => {
            const active = filters.stages.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStage(s.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-[#7a3344] text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {s.label}
              </button>
            );
          })}
          {filters.stages.length > 0 && (
            <button
              type="button"
              onClick={() => set({ stages: [] })}
              className="text-xs text-[#7a3344] hover:underline"
            >
              Clear
            </button>
          )}
          <span className="text-[11px] text-stone-400">
            Passed on = we chose not to invest
          </span>
        </div>
      )}

      {showWorkflowFilter && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["conflicts", "Resolve blockers"],
              ["draft", "Verify analysis"],
              ["decision", "Record decision"],
            ] as const
          ).map(([step, label]) => (
            <button
              key={step}
              type="button"
              onClick={() => set({ workflowStep: step })}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                filters.workflowStep === step
                  ? "bg-[#7a3344] text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-stone-500">
        <span className="font-semibold tabular-nums text-stone-800">{resultCount.toLocaleString()}</span>{" "}
        {resultCountLabel} · paginated below
      </p>
    </div>
  );
}
