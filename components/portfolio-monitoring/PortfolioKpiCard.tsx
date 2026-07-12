type TrendDirection = "up" | "down" | "flat" | null;

export type SimpleKpi = {
  id: string;
  label: string;
  value: number;
  helper: string;
  trend?: TrendDirection;
};

function trendLabel(trend: TrendDirection) {
  if (trend === "up") return "↑ Trending up";
  if (trend === "down") return "↓ Needs attention";
  return "→ Stable";
}

function trendStyles(direction: TrendDirection, metricId: string) {
  const isBad = metricId === "validation" || metricId === "missing";
  if (isBad) return direction === "up" ? "text-red-500" : "text-emerald-600";
  if (direction === "up") return "text-emerald-600";
  if (direction === "down") return "text-red-500";
  return "text-stone-400";
}

function KpiIcon({ id }: { id: string }) {
  const shell = "flex h-9 w-9 items-center justify-center rounded-lg";
  const iconProps = {
    className: "h-[18px] w-[18px]",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.75,
  };

  const icons: Record<string, React.ReactNode> = {
    companies: (
      <div className={`${shell} bg-[#fdf2f4] text-[#9e4456]`}>
        <svg {...iconProps}>
          <path d="M3 21h18M6 21V7l6-4 6 4v14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    reports: (
      <div className={`${shell} bg-amber-50 text-amber-700`}>
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    extracted: (
      <div className={`${shell} bg-violet-50 text-violet-600`}>
        <svg {...iconProps}>
          <path d="M4 19h16M6 16l3-8 3 5 3-3 3 6" strokeLinecap="round" strokeLinejoin="round" />
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
    validation: (
      <div className={`${shell} bg-amber-50 text-amber-600`}>
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    missing: (
      <div className={`${shell} bg-stone-100 text-stone-500`}>
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
      </div>
    ),
  };

  return icons[id] ?? icons.companies;
}

export function PortfolioKpiCard({ kpi }: { kpi: SimpleKpi }) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-stone-500">{kpi.label}</p>
        <KpiIcon id={kpi.id} />
      </div>
      <p className="mt-3 text-[1.75rem] font-semibold leading-none tabular-nums text-stone-900">
        {kpi.value.toLocaleString()}
      </p>
      <p className="mt-1.5 text-xs text-stone-500">{kpi.helper}</p>
      {kpi.trend && (
        <p className={`mt-2 text-xs font-semibold ${trendStyles(kpi.trend, kpi.id)}`}>
          {trendLabel(kpi.trend)}
        </p>
      )}
    </div>
  );
}
