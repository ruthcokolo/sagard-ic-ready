"use client";

import type { CompanyProfileTab } from "@/lib/portfolio/company-profile-selectors";

const TABS: { id: CompanyProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "reports", label: "Reports" },
  { id: "risks", label: "Risks & Follow-ups" },
  { id: "activity", label: "Activity" },
  { id: "notes", label: "Notes" },
];

export function CompanyProfileTabs({
  active,
  onChange,
}: {
  active: CompanyProfileTab;
  onChange: (tab: CompanyProfileTab) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div role="tablist" className="flex min-w-max gap-0.5 border-b border-stone-200">
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={`h-11 whitespace-nowrap px-3 text-[13px] font-medium transition ${
                selected
                  ? "border-b-2 border-[#7a3344] text-[#7a3344]"
                  : "border-b-2 border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
