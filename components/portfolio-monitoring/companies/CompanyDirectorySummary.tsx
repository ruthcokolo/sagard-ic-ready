"use client";

export function CompanyDirectorySummary({
  total,
  sectors,
  assignedToYou,
  assignedToYouPct,
  active,
  activePct,
  needsAttention,
  needsAttentionPct,
}: {
  total: number;
  sectors: number;
  assignedToYou: number;
  assignedToYouPct: number;
  active: number;
  activePct: number;
  needsAttention: number;
  needsAttentionPct: number;
}) {
  const cards = [
    {
      id: "total",
      label: "Total companies",
      value: total,
      helper: `Across ${sectors} sector${sectors === 1 ? "" : "s"}`,
      iconBg: "bg-violet-50 text-violet-700",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
        />
      ),
    },
    {
      id: "assigned",
      label: "Assigned to You",
      value: assignedToYou,
      helper:
        assignedToYou === 0
          ? "No companies assigned to you"
          : `${assignedToYouPct}% of portfolio`,
      iconBg: "bg-emerald-50 text-emerald-700",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      ),
    },
    {
      id: "active",
      label: "Active companies",
      value: active,
      helper: `${activePct}% of portfolio`,
      iconBg: "bg-sky-50 text-sky-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      id: "attention",
      label: "Needs attention",
      value: needsAttention,
      helper: `${needsAttentionPct}% of portfolio`,
      iconBg: "bg-amber-50 text-amber-700",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 21h18L12 3 3 21zm9-4h.01M12 10v4"
        />
      ),
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-medium text-stone-500">{card.label}</p>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${card.iconBg}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                {card.icon}
              </svg>
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-stone-900">
            {card.value.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-stone-400">{card.helper}</p>
        </div>
      ))}
    </section>
  );
}
