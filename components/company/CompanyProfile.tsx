import type { Category } from "@/lib/categories";
import type { PipelineDeal } from "@/lib/deals-pipeline";
import type { AnalysisResult } from "@/lib/types";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

export function CompanyProfile({
  deal,
  category,
  analysis,
}: {
  deal: PipelineDeal;
  category?: Category;
  analysis: AnalysisResult | null;
}) {
  const readyForIC =
    analysis &&
    analysis.readinessScore >= 7 &&
    analysis.blockingConflictCount === 0;

  return (
    <section className="relative overflow-hidden border-b border-stone-200/60 bg-white">
      <div
        className={`absolute inset-0 opacity-[0.07] bg-gradient-to-br ${category?.accent ?? "from-stone-500 to-stone-700"}`}
      />
      <div className="relative px-8 py-10">
        <div className="flex flex-wrap items-start gap-6">
          <CompanyLogo companyId={deal.id} name={deal.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                {category?.label ?? deal.sector}
              </span>
              {deal.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="font-display mt-3 text-4xl text-stone-900">{deal.name}</h1>
            <p className="mt-2 max-w-3xl text-lg text-stone-600">{deal.tagline}</p>
          </div>
          {analysis && (
            <div
              className={`rounded-2xl px-5 py-4 ring-1 ${
                readyForIC
                  ? "bg-emerald-50 ring-emerald-200"
                  : "bg-amber-50 ring-amber-200"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                IC verdict
              </p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                {readyForIC ? "Ready for IC" : "Not ready yet"}
              </p>
              <p className="mt-0.5 text-sm text-stone-600">{analysis.readinessScore}/10 readiness</p>
            </div>
          )}
        </div>

        <p className="mt-8 max-w-3xl text-base leading-relaxed text-stone-600">{deal.description}</p>

        {/* Scannable metrics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Metric label="ARR" value={deal.arr} sub={deal.growth} />
          <Metric label="Raising" value={deal.askAmount} />
          <Metric label="Stage" value={deal.stage.replace("_", " ")} capitalize />
          <Metric label="Location" value={deal.location} />
          <Metric label="Founded" value={deal.founded} sub={`${deal.employees} employees`} />
          <Metric label="Deal owner" value={deal.owner} sub={`Updated ${deal.lastUpdated}`} />
        </div>

        {/* Highlights */}
        <div className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Investment highlights
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {deal.highlights.map((h) => (
              <li
                key={h}
                className="flex gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700"
              >
                <span className="text-[#7a3344]">→</span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        {analysis && (
          <div className="mt-6 flex flex-wrap gap-4 border-t border-stone-100 pt-6 text-sm text-stone-500">
            <span>
              <strong className="text-stone-800">{analysis.documentsReviewed}</strong> documents
            </span>
            <span>
              <strong className="text-red-600">{analysis.blockingConflictCount}</strong> blocking
              conflicts
            </span>
            <span>
              <strong className="text-stone-800">{deal.openItems}</strong> open checklist items
            </span>
            <span>Synced from Google Sheets · Claude API</span>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  capitalize: cap,
}: {
  label: string;
  value: string;
  sub?: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-stone-50/80 px-4 py-3 ring-1 ring-stone-100">
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-stone-900 ${cap ? "capitalize" : ""}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}
