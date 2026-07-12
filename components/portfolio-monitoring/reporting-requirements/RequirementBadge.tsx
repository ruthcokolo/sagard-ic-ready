"use client";

import type { MetricRequirement } from "@/lib/portfolio/monitoring-phase-types";
import { requirementLabel } from "@/lib/portfolio/metric-applicability";

const BADGE: Record<MetricRequirement, string> = {
  required: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  optional: "bg-sky-50 text-sky-800 ring-sky-100",
  not_applicable: "bg-violet-50 text-violet-800 ring-violet-100",
  not_configured: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function RequirementBadge({
  requirement,
  className = "",
}: {
  requirement: MetricRequirement;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${BADGE[requirement]} ${className}`}
    >
      {requirementLabel(requirement)}
    </span>
  );
}
