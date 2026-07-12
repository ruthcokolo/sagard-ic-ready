"use client";

/**
 * Row of KPI summary cards and loading skeleton for the overview dashboard.
 */
import type { OverviewKpis } from "@/lib/portfolio/overview-selectors";

/** Picks the right small icon for each KPI card type. */
function StatIcon({ kind }: { kind: string }) {
  const shell = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md";
  const iconProps = {
    className: "h-3.5 w-3.5",
    fill: "none" as const,
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.75,
  };

  const icons: Record<string, React.ReactNode> = {
    companies: (
      <div className={`${shell} bg-[#fdf2f4] text-[#9e4456]`}>
        <svg {...iconProps}>
          <path d="M4 19h16M6 16V8l6-4 6 4v8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    reports: (
      <div className={`${shell} bg-sky-50 text-sky-600`}>
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    validation: (
      <div className={`${shell} bg-amber-50 text-amber-600`}>
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    approved: (
      <div className={`${shell} bg-emerald-50 text-emerald-600`}>
        <svg {...iconProps}>
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
    ),
    success: (
      <div className={`${shell} bg-violet-50 text-violet-600`}>
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41" strokeLinecap="round" />
        </svg>
      </div>
    ),
    coverage: (
      <div className={`${shell} bg-indigo-50 text-indigo-600`}>
        <svg {...iconProps}>
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      </div>
    ),
  };

  return icons[kind] ?? icons.companies;
}

/** Formats a KPI number for display (adds commas, percent signs, etc.). */
function formatValue(id: string, kpis: OverviewKpis): string {
  if (id === "success") {
    return kpis.extractionSuccessRate != null ? `${kpis.extractionSuccessRate}%` : "—";
  }
  if (id === "coverage") {
    return kpis.portfolioCoverage != null ? `${kpis.portfolioCoverage}%` : "—";
  }
  const map: Record<string, number> = {
    companies: kpis.portfolioCompanies,
    reports: kpis.reportsReceived,
    validation: kpis.awaitingValidation,
    approved: kpis.approvedMetrics,
  };
  return (map[id] ?? 0).toLocaleString();
}

/** Grid of KPI cards across the top of the overview. */
export function PortfolioKpiSummary({ kpis }: { kpis: OverviewKpis }) {
  const cards = [
    { id: "companies", label: "Portfolio companies", helper: "Across all portfolio companies" },
    { id: "reports", label: "Reports received", helper: "This reporting cycle" },
    {
      id: "validation",
      label: "Awaiting validation",
      helper:
        kpis.reportsReceived > 0
          ? `${kpis.awaitingValidationPct}% of submitted`
          : "No submitted packages",
    },
    { id: "approved", label: "Approved metrics", helper: "This reporting cycle" },
    { id: "success", label: "Extraction success rate", helper: "Packages processed successfully" },
    { id: "coverage", label: "Portfolio coverage", helper: "Expected metrics captured" },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-2 divide-y divide-stone-100 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-y-0">
        {cards.map((card) => (
          <div key={card.id} className="min-w-0 px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-tight text-stone-500">{card.label}</p>
              <StatIcon kind={card.id} />
            </div>
            <p className="mt-2 text-[1.5rem] font-semibold leading-none tabular-nums tracking-tight text-stone-900">
              {formatValue(card.id, kpis)}
            </p>
            <p className="mt-1.5 text-[10px] text-stone-400">{card.helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Loading placeholder skeleton for the overview dashboard. */
export function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-28 rounded-xl bg-stone-200/60" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-xl bg-stone-200/60 lg:col-span-1" />
        <div className="h-80 rounded-xl bg-stone-200/60 lg:col-span-1" />
        <div className="h-80 rounded-xl bg-stone-200/60 lg:col-span-1" />
      </div>
      <div className="h-96 rounded-xl bg-stone-200/60" />
    </div>
  );
}
