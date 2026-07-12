"use client";

import type { WorkflowHealthSegment } from "@/lib/portfolio/overview-selectors";

export function PortfolioWorkflowHealthCard({
  total,
  segments,
}: {
  total: number;
  segments: WorkflowHealthSegment[];
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const slices = segments
    .filter((s) => s.count > 0)
    .map((seg) => {
      const length = total > 0 ? (seg.count / total) * c : 0;
      const dash = `${length} ${c - length}`;
      const dashOffset = -offset;
      offset += length;
      return { ...seg, dash, dashOffset };
    });

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h2 className="text-sm font-semibold text-stone-900">Portfolio health</h2>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width={100} height={100} viewBox="0 0 112 112" role="img" aria-label="Portfolio workflow health">
            <g transform="translate(56, 56) rotate(-90)">
              <circle r={r} fill="none" stroke="#f5f5f4" strokeWidth={12} />
              {slices.map((s) => (
                <circle
                  key={s.key}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={12}
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.dashOffset}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-semibold tabular-nums text-stone-900">{total}</p>
            <p className="text-[10px] text-stone-500">Companies</p>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate text-stone-600">{s.label}</span>
              </div>
              <span className="shrink-0 tabular-nums text-stone-800">
                {s.count}{" "}
                <span className="text-stone-400">({s.percent}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
