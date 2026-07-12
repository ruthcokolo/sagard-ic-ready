"use client";

/**
 * Summary stat cards for reporting package counts by status.
 */
import type { ReportingPackageStats } from "@/lib/portfolio/reporting-packages-demo";

function pct(part: number, total: number) {
  if (total <= 0) return "0% of total";
  return `${Math.round((part / total) * 100)}% of total`;
}

function StatIcon({ kind, spin }: { kind: string; spin?: boolean }) {
  const shell = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md";
  const iconProps = {
    className: "h-3.5 w-3.5",
    fill: "none" as const,
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.75,
  };

  const icons: Record<string, React.ReactNode> = {
    total: (
      <div className={`${shell} bg-stone-100 text-stone-500`}>
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    processed: (
      <div className={`${shell} bg-emerald-50 text-emerald-600`}>
        <svg {...iconProps}>
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
    ),
    attention: (
      <div className={`${shell} bg-amber-50 text-amber-600`}>
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
        </svg>
      </div>
    ),
    progress: (
      <div className={`${shell} bg-blue-50 text-blue-600`}>
        <svg
          {...iconProps}
          className={`h-3.5 w-3.5${spin ? " animate-spin" : ""}`}
          style={spin ? { animationDuration: "2s" } : undefined}
        >
          <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
          <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
        </svg>
      </div>
    ),
    failed: (
      <div className={`${shell} bg-red-50 text-red-500`}>
        <svg {...iconProps}>
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
  };

  return icons[kind] ?? icons.total;
}

/** Five operational KPI cards — processing focused, not validation. */
export function ReportingPackagesStatsRow({ stats }: { stats: ReportingPackageStats }) {
  const cards = [
    { id: "total", label: "Total packages", value: stats.total, helper: "Across all companies" },
    {
      id: "processed",
      label: "Processed",
      value: stats.processed,
      helper: pct(stats.processed, stats.total),
    },
    {
      id: "attention",
      label: "Needs attention",
      value: stats.needsAttention,
      helper: pct(stats.needsAttention, stats.total),
    },
    {
      id: "progress",
      label: "In progress",
      value: stats.inProgress,
      helper: pct(stats.inProgress, stats.total),
    },
    { id: "failed", label: "Failed", value: stats.failed, helper: pct(stats.failed, stats.total) },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-2 divide-y divide-stone-100 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        {cards.map((card) => (
          <div key={card.id} className="min-w-0 px-4 py-3.5 sm:px-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-tight text-stone-500">{card.label}</p>
              <StatIcon kind={card.id} spin={card.id === "progress" && card.value > 0} />
            </div>
            <p className="mt-2 text-[1.5rem] font-semibold leading-none tabular-nums tracking-tight text-stone-900">
              {card.value.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[10px] text-stone-400">{card.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
