"use client";

import Link from "next/link";
import { useDecisions } from "@/components/decisions/DecisionProvider";
import { getExportSummary as getBaseExportSummary } from "@/lib/exports-mock";

const cards = [
  {
    key: "total" as const,
    label: "Total exports",
    hint: "All past exports",
    icon: "↓",
    iconBg: "bg-[#fdf2f4] text-[#7a3344]",
    href: "/exports",
  },
  {
    key: "proceed" as const,
    label: "Recommend to committee",
    hint: "Exports with recommendation",
    icon: "✓",
    iconBg: "bg-emerald-50 text-emerald-700",
    href: "/exports?filter=Proceed",
  },
  {
    key: "diligence" as const,
    label: "Need more research",
    hint: "Exports requesting more work",
    icon: "↻",
    iconBg: "bg-amber-50 text-amber-700",
    href: "/exports?filter=Need%20more%20research",
  },
  {
    key: "pass" as const,
    label: "Don't invest",
    hint: "Exports to stop pursuing",
    icon: "×",
    iconBg: "bg-red-50 text-red-700",
    href: "/exports?filter=Don%27t%20invest",
  },
];

export function ExportsSummaryCards() {
  const { getExportSummary, hydrated } = useDecisions();
  const m = hydrated ? getExportSummary() : getBaseExportSummary();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, hint, icon, iconBg, href }) => (
        <Link
          key={key}
          href={href}
          className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-[#7a3344]/20"
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${iconBg}`}
          >
            {icon}
          </span>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-stone-900">
              {m[key].toLocaleString()}
            </p>
            <p className="text-xs font-medium text-stone-800">{label}</p>
            <p className="text-[11px] text-stone-500">{hint}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
