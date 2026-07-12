"use client";

import type { LandingScopeTab } from "@/lib/portfolio/metric-review-landing-selectors";

const TABS: { id: LandingScopeTab; label: string }[] = [
  { id: "assigned", label: "Assigned to me" },
  { id: "all", label: "All companies" },
  { id: "needsAttention", label: "Needs attention" },
  { id: "completed", label: "Completed" },
];

export function ReviewScopeTabs({
  active,
  counts,
  onChange,
}: {
  active: LandingScopeTab;
  counts: Record<LandingScopeTab, number>;
  onChange: (tab: LandingScopeTab) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-stone-200">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? "border-[#7a3344] font-semibold text-[#7a3344]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {tab.label}{" "}
            <span className={isActive ? "text-[#7a3344]" : "text-stone-400"}>
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
