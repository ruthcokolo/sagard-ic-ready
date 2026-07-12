"use client";

import Link from "next/link";
import { categories } from "@/lib/categories";
import type { PipelineDeal } from "@/lib/deals-pipeline";
import { pipelineDeals } from "@/lib/deals-pipeline";
import { IconChevronRight } from "@/components/ui/Icons";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

export function SectorSidebar({
  activeCategory,
  onCategoryChange,
}: {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}) {
  return (
    <aside className="w-[200px] shrink-0">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
        Sectors
      </p>
      <ul className="space-y-0.5">
        {categories.map((cat) => {
          const count =
            cat.id === "all" ? pipelineDeals.length : pipelineDeals.filter((d) => d.categoryId === cat.id).length;
          const active = activeCategory === cat.id;
          return (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                  active
                    ? "bg-[#fdf2f4] font-semibold text-[#7a3344]"
                    : "font-medium text-stone-600 hover:bg-white"
                }`}
              >
                <span className="truncate">{cat.label}</span>
                <span className={`tabular-nums ${active ? "text-[#7a3344]/70" : "text-stone-400"}`}>
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function CompanyPipelineList({
  deals,
  search = "",
  title = "Pipeline",
}: {
  deals: PipelineDeal[];
  search?: string;
  title?: string;
}) {
  return (
    <section className="min-w-0 flex-1">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">
        {title}
      </h2>
      <div className="space-y-2">
        {deals.map((deal) => (
          <CompanyPipelineRow key={deal.id} deal={deal} search={search} />
        ))}
      </div>
    </section>
  );
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-100/80 px-0.5">{text.slice(i, i + q.trim().length)}</mark>
      {text.slice(i + q.trim().length)}
    </>
  );
}

function CompanyPipelineRow({ deal, search }: { deal: PipelineDeal; search: string }) {
  const scoreColor =
    deal.readinessScore >= 7
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : deal.readinessScore >= 5
        ? "bg-amber-50 text-amber-800 ring-amber-100"
        : "bg-red-50 text-red-700 ring-red-100";

  return (
    <Link
      href={`/dashboard/companies/${deal.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-stone-200/70 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-stone-300 hover:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)]"
    >
      <CompanyLogo companyId={deal.id} name={deal.name} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-stone-900 group-hover:text-[#7a3344]">
            {highlight(deal.name, search)}
          </span>
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-500">
            {deal.sector}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-stone-500">{deal.tagline}</p>
        <p className="mt-2 text-[12px] text-stone-400">
          <span className="font-semibold text-stone-600">{deal.arr}</span> ARR · {deal.askAmount} ·{" "}
          {deal.owner} · {deal.lastUpdated}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ring-1 ${scoreColor}`}>
            {deal.readinessScore}/10
          </span>
          <p className={`mt-1 text-[11px] font-medium ${deal.conflictCount > 0 ? "text-red-600" : "text-stone-400"}`}>
            {deal.conflictCount > 0
              ? `${deal.conflictCount} conflict${deal.conflictCount > 1 ? "s" : ""}`
              : `${deal.openItems} open items`}
          </p>
        </div>
        <IconChevronRight className="h-5 w-5 text-stone-300 transition group-hover:text-[#7a3344]" />
      </div>
    </Link>
  );
}
