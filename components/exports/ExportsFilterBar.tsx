"use client";

import type { ExportDecision } from "@/lib/exports-mock";
import { categories } from "@/lib/categories";

type FilterValue = "all" | ExportDecision;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All exports" },
  { value: "Proceed", label: "Recommend to committee" },
  { value: "Need more research", label: "Need more research" },
  { value: "Don't invest", label: "Don't invest" },
];

export function ExportsFilterBar({
  filter,
  sectorId,
  onChange,
  onSectorChange,
}: {
  filter: FilterValue;
  sectorId: string;
  onChange: (next: FilterValue) => void;
  onSectorChange: (sectorId: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 bg-white px-8 py-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === value
                ? "bg-[#7a3344] text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <select
        value={sectorId}
        onChange={(e) => onSectorChange(e.target.value)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] text-stone-700"
        aria-label="Filter by sector"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id === "all" ? "All sectors" : c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
