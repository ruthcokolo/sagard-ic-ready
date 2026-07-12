/**
 * Line chart showing extraction success trends over recent periods.
 */
import { DateRangeFilter } from "@/components/portfolio-monitoring/PortfolioModeHeader";

type TrendPoint = {
  month: string;
  extracted: number;
  approved: number;
  needsValidation: number;
  missing: number;
};

const SERIES = [
  { key: "extracted" as const, label: "Extracted", color: "#7a3344" },
  { key: "approved" as const, label: "Approved", color: "#10b981" },
  { key: "needsValidation" as const, label: "Needs validation", color: "#f59e0b" },
  { key: "missing" as const, label: "Missing", color: "#94a3b8" },
];

const W = 480;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };

function scaleY(value: number, max: number) {
  const innerH = H - PAD.top - PAD.bottom;
  return PAD.top + innerH - (value / max) * innerH;
}

function scaleX(index: number, count: number) {
  const innerW = W - PAD.left - PAD.right;
  return PAD.left + (index / Math.max(count - 1, 1)) * innerW;
}

/** Line chart of extraction results over time. */
export function ExtractionTrendChart({ data }: { data: TrendPoint[] }) {
  const maxY = Math.max(
    ...data.flatMap((d) => [d.extracted, d.approved, d.needsValidation, d.missing]),
    1
  );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">Extraction trend</h2>
        <DateRangeFilter />
      </div>

      <div className="mt-4 min-h-0 flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" role="img" aria-label="Extraction trend chart">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = PAD.top + (H - PAD.top - PAD.bottom) * tick;
            return (
              <line key={tick} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f5f5f4" strokeWidth={1} />
            );
          })}

          {SERIES.map((series) => {
            const points = data
              .map((d, i) => `${scaleX(i, data.length)},${scaleY(d[series.key], maxY)}`)
              .join(" ");
            return (
              <polyline
                key={series.key}
                fill="none"
                stroke={series.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
            );
          })}

          {data.map((d, i) => (
            <text
              key={d.month}
              x={scaleX(i, data.length)}
              y={H - 6}
              textAnchor="middle"
              className="fill-stone-400 text-[8px]"
            >
              {d.month}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-[11px] text-stone-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
