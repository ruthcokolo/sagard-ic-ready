type CoverageItem = { company: string; companyId: string; coverage: number };

export function CoverageByCompany({ items }: { items: CoverageItem[] }) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">Coverage by company</h2>

      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.companyId} className="min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-stone-700" title={item.company}>
                {item.company}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-stone-900">
                {item.coverage}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${item.coverage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
