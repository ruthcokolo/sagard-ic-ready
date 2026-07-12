import Link from "next/link";

type ValidationSummary = {
  approved: { count: number; percent: number };
  needsValidation: { count: number; percent: number };
  missing: { count: number; percent: number };
  total: number;
};

const SEGMENTS = [
  { key: "approved" as const, label: "Approved for reporting", color: "#10b981" },
  { key: "needsValidation" as const, label: "Needs validation", color: "#f59e0b" },
  { key: "missing" as const, label: "Missing from report", color: "#cbd5e1" },
];

export function ValidationStatusDonut({ data }: { data: ValidationSummary }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const slices = SEGMENTS.map((seg) => {
    const slice = data[seg.key];
    const length = (slice.percent / 100) * c;
    const dash = `${length} ${c - length}`;
    const dashOffset = -offset;
    offset += length;
    return { ...seg, slice, dash, dashOffset };
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">Metrics by validation status</h2>

      <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          <svg width={128} height={128} viewBox="0 0 128 128" role="img" aria-label="Validation status donut">
            <g transform="translate(64, 64) rotate(-90)">
              <circle r={r} fill="none" stroke="#f5f5f4" strokeWidth={14} />
              {slices.map((s) => (
                <circle
                  key={s.key}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={14}
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.dashOffset}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-base font-semibold tabular-nums text-stone-900">
              {data.total.toLocaleString()}
            </p>
            <p className="text-[10px] text-stone-500">Total</p>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {slices.map((s) => (
            <li key={s.key} className="flex items-start justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-stone-600">{s.label}</span>
              </div>
              <span className="shrink-0 tabular-nums text-stone-800">
                {s.slice.count.toLocaleString()}{" "}
                <span className="text-stone-400">/ {s.slice.percent}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/dashboard/portfolio/metric-review"
        className="mt-4 inline-flex text-sm font-semibold text-[#7a3344] hover:underline"
      >
        Go to metric review →
      </Link>
    </div>
  );
}
