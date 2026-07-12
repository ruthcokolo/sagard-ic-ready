/** Quick snapshot of company facts and deal context at the top of the detail page. */

import type { ReactNode } from "react";
import type { PipelineDeal } from "@/lib/deal-types";
import type { AnalysisResult } from "@/lib/types";
import { formatAnalyzedAgo, formatStageLabel } from "@/lib/enrich-analysis";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

/** Renders the company snapshot UI. */
export function CompanySnapshot({
  deal,
  analysis,
}: {
  deal: PipelineDeal;
  analysis: AnalysisResult;
}) {
  const stage = formatStageLabel(deal);
  const analyzedAgo = formatAnalyzedAgo(analysis.analyzedAt, deal.lastUpdated);

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start gap-5">
        <CompanyLogo companyId={deal.id} name={deal.name} size="md" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl text-stone-900">{deal.name}</h1>
          <p className="mt-2 max-w-2xl text-base text-stone-600">{deal.tagline}</p>
          <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-sm text-stone-500">
            <MetaChip>{stage}</MetaChip>
            <span className="text-stone-300">·</span>
            <MetaChip>{deal.sector}</MetaChip>
            <span className="text-stone-300">·</span>
            <MetaChip>{deal.arr} annual revenue (claimed)</MetaChip>
            <span className="text-stone-300">·</span>
            <MetaChip>{deal.growth} claimed</MetaChip>
            <span className="text-stone-300">·</span>
            <MetaChip>{deal.employees} employees</MetaChip>
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 border-t border-stone-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <SnapshotField label="Owner" value={deal.owner} />
        <SnapshotField label="Location" value={deal.location} />
        <SnapshotField label="Fundraising" value={deal.askAmount} />
        <SnapshotField label="Last reviewed" value={analyzedAgo} />
      </dl>

      <div className="mt-5 rounded-xl bg-stone-50 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          Documents reviewed
        </p>
        <p className="mt-1 text-sm text-stone-700">
          {analysis.sourcesReviewed.join(" · ")}
        </p>
      </div>

      {analysis.keyFacts.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {analysis.keyFacts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-stone-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                {fact.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">{fact.value}</p>
              <ConfidenceBadge level={fact.confidence} />
              <p className="mt-1 text-[11px] text-stone-500">{fact.sources}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return <span className="font-medium text-stone-700">{children}</span>;
}

function SnapshotField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-stone-800">{value}</dd>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-800",
    low: "bg-red-50 text-red-700",
  };
  const labels = { high: "Looks solid", medium: "Check this", low: "Don't trust yet" };
  return (
    <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}
