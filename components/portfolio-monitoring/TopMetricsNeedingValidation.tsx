import Link from "next/link";

type MetricCount = { metric: string; count: number };

export function TopMetricsNeedingValidation({ metrics }: { metrics: MetricCount[] }) {
  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">Top metrics needing validation</h2>

      {metrics.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">All metrics are approved for reporting.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {metrics.map((item) => (
            <li key={item.metric} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-stone-700">{item.metric}</span>
              <span className="text-sm font-semibold tabular-nums text-red-500">
                {item.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/dashboard/portfolio/metric-review"
        className="mt-4 inline-flex text-sm font-semibold text-[#7a3344] hover:underline"
      >
        View all →
      </Link>
    </div>
  );
}
