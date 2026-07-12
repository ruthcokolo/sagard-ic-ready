"use client";

import type { ExtractionPerformance } from "@/lib/portfolio/overview-selectors";

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function ExtractionPerformanceCard({ stats }: { stats: ExtractionPerformance }) {
  const rows = [
    { label: "Packages processed", value: stats.packagesProcessed.toLocaleString() },
    { label: "Metrics extracted", value: stats.metricsExtracted.toLocaleString() },
    {
      label: "Processing success rate",
      value: stats.processingSuccessRate != null ? `${stats.processingSuccessRate}%` : "—",
    },
    {
      label: "Average processing time",
      value: formatDuration(stats.averageProcessingTimeMs),
    },
    { label: "Manual corrections", value: stats.manualCorrections.toLocaleString() },
    { label: "Needs validation", value: stats.needsValidation.toLocaleString() },
  ];

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h2 className="text-sm font-semibold text-stone-900">Extraction performance</h2>
      <p className="mt-0.5 text-[10px] text-stone-400">This reporting cycle · operational metrics only</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[10px] text-stone-500">{row.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-stone-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
