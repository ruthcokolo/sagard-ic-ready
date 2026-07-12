"use client";

import Link from "next/link";
import type { PipelineDeal } from "@/lib/deal-types";
import { DEMO_DEAL_ID } from "@/lib/insights";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

function scoreClass(score: number) {
  if (score >= 8) return "bg-emerald-50 text-emerald-700";
  if (score >= 6) return "bg-amber-50 text-amber-800";
  if (score >= 5) return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-700";
}

function stageBadgeClass(stage: PipelineDeal["stage"]) {
  const map = {
    screening: "bg-amber-50 text-amber-800 ring-amber-100",
    diligence: "bg-sky-50 text-sky-700 ring-sky-100",
    ic_prep: "bg-[#fdf2f4] text-[#7a3344] ring-[#7a3344]/10",
    passed: "bg-stone-100 text-stone-600 ring-stone-200",
  };
  return map[stage];
}

function stageBadgeLabel(stage: PipelineDeal["stage"]) {
  const map = {
    screening: "Early review",
    diligence: "Research",
    ic_prep: "Committee prep",
    passed: "Passed on",
  };
  return map[stage].toUpperCase();
}

export function PipelineTable({ deals }: { deals: PipelineDeal[] }) {
  if (deals.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-stone-500">No deals match these filters.</div>
    );
  }

  return (
    <table className="w-full text-left text-[13px]">
      <thead className="border-b border-stone-100 bg-stone-50/80 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        <tr>
          <th className="px-4 py-3">Company</th>
          <th className="px-3 py-3">Stage</th>
          <th className="hidden px-3 py-3 md:table-cell">Sector</th>
          <th className="px-3 py-3">ARR</th>
          <th className="px-3 py-3">Score</th>
          <th className="hidden px-3 py-3 sm:table-cell">Owner</th>
          <th className="hidden px-3 py-3 lg:table-cell">Updated</th>
          <th className="px-3 py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {deals.map((deal) => {
          const isDemo = deal.id === DEMO_DEAL_ID;
          return (
            <tr
              key={deal.id}
              className={`border-b border-stone-50 hover:bg-[#fdf2f4]/20 ${
                isDemo ? "border-l-4 border-l-[#7a3344] bg-[#fdf2f4]/10" : ""
              }`}
            >
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/companies/${deal.id}?from=pipeline`}
                  className="group flex items-center gap-3"
                >
                  <CompanyLogo
                    companyId={deal.id}
                    name={deal.name}
                    size="sm"
                    className="!h-9 !w-9 !rounded-lg !text-xs"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-stone-900 group-hover:text-[#7a3344]">
                        {deal.name}
                      </span>
                      {isDemo && (
                        <span className="rounded bg-[#7a3344] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          Demo deal
                        </span>
                      )}
                      {deal.conflictCount > 0 && (
                        <span className="rounded bg-[#fdf2f4] px-1.5 py-0.5 text-[9px] font-semibold text-[#7a3344] ring-1 ring-[#7a3344]/15">
                          {deal.conflictCount} open issue{deal.conflictCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${stageBadgeClass(deal.stage)}`}
                >
                  {stageBadgeLabel(deal.stage)}
                </span>
              </td>
              <td className="hidden px-3 py-3 text-stone-600 md:table-cell">{deal.sector}</td>
              <td className="px-3 py-3 font-semibold tabular-nums text-stone-900">{deal.arr}</td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex min-w-[1.75rem] justify-center rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${scoreClass(deal.readinessScore)}`}
                >
                  {deal.readinessScore}
                </span>
              </td>
              <td className="hidden px-3 py-3 text-stone-600 sm:table-cell">
                {deal.owner.split(" ")[0]}
              </td>
              <td className="hidden px-3 py-3 text-stone-400 lg:table-cell">{deal.lastUpdated}</td>
              <td className="px-3 py-3 text-right">
                {isDemo ? (
                  <Link
                    href={`/dashboard/companies/${deal.id}?from=pipeline`}
                    className="inline-flex rounded-lg bg-[#7a3344] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5a2533]"
                  >
                    Review deal &gt;
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/companies/${deal.id}?from=pipeline`}
                    className="inline-flex rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-700 hover:border-[#7a3344]/30 hover:bg-stone-50"
                  >
                    Open &gt;
                  </Link>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
