"use client";

/** Filter bar for the IC review queue (stage, owner, readiness). */
import type { DealFilters, WorkflowStep } from "@/lib/deal-query";
import { categories } from "@/lib/categories";
import { IconSearch } from "@/components/ui/Icons";

type ReadinessBucket = "all" | "low" | "mid" | "high";

function bucketToRange(bucket: ReadinessBucket): { min: number; max: number } {
  switch (bucket) {
    case "low":
      return { min: 1, max: 4 };
    case "mid":
      return { min: 5, max: 7 };
    case "high":
      return { min: 8, max: 10 };
    default:
      return { min: 0, max: 10 };
  }
}

function rangeToBucket(min: number, max: number): ReadinessBucket {
  if (min >= 8) return "high";
  if (min >= 5 && max <= 7) return "mid";
  if (max <= 4) return "low";
  return "all";
}

const WORKFLOW_TABS: { step: WorkflowStep | "all"; label: string }[] = [
  { step: "all", label: "All" },
  { step: "conflicts", label: "Resolve blockers" },
  { step: "draft", label: "Verify analysis" },
  { step: "decision", label: "Record decision" },
];

/** Renders the review queue filter bar UI. */
export function ReviewQueueFilterBar({
  filters,
  onChange,
}: {
  filters: DealFilters;
  onChange: (next: DealFilters) => void;
}) {
  const set = (patch: Partial<DealFilters>) => onChange({ ...filters, ...patch });
  const readinessBucket = rangeToBucket(filters.readinessMin, filters.readinessMax);

  return (
    <div className="border-b border-stone-200/70 bg-white px-8 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-xl">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search company, sector, owner, tag…"
            className="w-full rounded-lg border border-stone-200 bg-[#faf9f7] py-2.5 pl-9 pr-3 text-[13px] focus:border-[#9e4456] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e4456]/10 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        <select
          value={filters.categoryId}
          onChange={(e) => set({ categoryId: e.target.value })}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-stone-700"
        >
          <option value="all">All sectors</option>
          {categories
            .filter((c) => c.id !== "all")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
        </select>

        <select
          value={readinessBucket}
          onChange={(e) => {
            const { min, max } = bucketToRange(e.target.value as ReadinessBucket);
            set({ readinessMin: min, readinessMax: max });
          }}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-stone-700"
        >
          <option value="all">All readiness</option>
          <option value="low">Low (1–4)</option>
          <option value="mid">Mid (5–7)</option>
          <option value="high">High (8–10)</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {WORKFLOW_TABS.map(({ step, label }) => (
          <button
            key={step}
            type="button"
            onClick={() => set({ workflowStep: step })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filters.workflowStep === step
                ? "bg-[#7a3344] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
