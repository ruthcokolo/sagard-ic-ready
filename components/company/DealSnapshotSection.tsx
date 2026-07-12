import type { PipelineDeal } from "@/lib/deal-types";
import { getDealSnapshotMetrics, type SnapshotMetric } from "@/lib/company-sources";

export function DealSnapshotSection({
  deal,
  analysisPending,
}: {
  deal: PipelineDeal;
  analysisPending: boolean;
}) {
  const metrics = getDealSnapshotMetrics(deal, analysisPending);

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">Deal snapshot</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <SnapshotCard key={m.label} metric={m} />
        ))}
      </div>
    </section>
  );
}

function SnapshotCard({ metric }: { metric: SnapshotMetric }) {
  const badge =
    metric.confidence === "solid"
      ? { label: "Looks solid", cls: "bg-emerald-50 text-emerald-700" }
      : metric.confidence === "needs_verification"
        ? { label: "Needs verification", cls: "bg-amber-50 text-amber-800" }
        : { label: "Verified", cls: "bg-emerald-50 text-emerald-700" };

  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/40 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        {metric.label}
      </p>
      <p className="mt-1 text-lg font-semibold text-stone-900">{metric.value}</p>
      <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
        {badge.label}
      </span>
      <p className="mt-2 text-[11px] font-medium text-[#7a3344]">{metric.sublabel}</p>
    </div>
  );
}
