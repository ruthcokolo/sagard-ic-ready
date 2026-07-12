"use client";

import type { EffectiveRequirementRow } from "@/lib/portfolio/reporting-requirements";

export function RequirementSourceDisplay({ row }: { row: EffectiveRequirementRow }) {
  const primaryClass =
    row.ruleSourceKind === "company_override" ? "font-semibold text-[#7a3344]" : "font-medium text-stone-800";

  return (
    <div>
      <p className={`text-[13px] ${primaryClass}`}>{row.ruleSourcePrimary}</p>
      <p className="mt-0.5 text-[11px] text-stone-500">{row.ruleSourceSecondary}</p>
    </div>
  );
}
