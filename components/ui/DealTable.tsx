"use client";

/** Reusable table of deals with links to company detail pages. */
import Link from "next/link";
import type { PipelineDeal } from "@/lib/deal-types";
import { DEMO_DEAL_ID, stageLabel } from "@/lib/insights";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

/** Type shape used by deal table mode. */
export type DealTableMode = "pipeline" | "ic";

function scoreClass(score: number) {
  if (score >= 7) return "text-emerald-700 bg-emerald-50";
  if (score >= 5) return "text-amber-800 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function stageClass(stage: PipelineDeal["stage"]) {
  const map = {
    screening: "bg-stone-100 text-stone-600",
    diligence: "bg-blue-50 text-blue-700",
    ic_prep: "bg-[#fdf2f4] text-[#7a3344]",
    passed: "bg-stone-100 text-stone-600",
  };
  return map[stage];
}

function blockerLabel(count: number) {
  return `${count} open issue${count > 1 ? "s" : ""}`;
}

/** Renders the deal table UI. */
export function DealTable({
  deals,
  mode,
}: {
  deals: PipelineDeal[];
  mode: DealTableMode;
}) {
  if (deals.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-stone-500">No deals match these filters.</div>
    );
  }

  if (mode === "pipeline") {
    return (
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-stone-100 bg-stone-50/50 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Company</th>
            <th className="hidden px-3 py-2.5 md:table-cell">Stage</th>
            <th className="hidden px-3 py-2.5 lg:table-cell">Sector</th>
            <th className="px-3 py-2.5">ARR</th>
            <th className="px-3 py-2.5">Score</th>
            <th className="hidden px-3 py-2.5 sm:table-cell">Owner</th>
            <th className="hidden px-3 py-2.5 xl:table-cell">Updated</th>
            <th className="px-3 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => {
            const isDemo = deal.id === DEMO_DEAL_ID;
            return (
              <tr
                key={deal.id}
                className={`border-b border-stone-50 hover:bg-[#fdf2f4]/30 ${
                  isDemo ? "border-l-4 border-l-[#7a3344] bg-[#fdf2f4]/25" : ""
                }`}
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/companies/${deal.id}?from=pipeline`}
                    className="flex items-center gap-2.5 group"
                  >
                    <CompanyLogo companyId={deal.id} name={deal.name} size="sm" className="!h-8 !w-8 !rounded-lg !text-xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-stone-900 group-hover:text-[#7a3344]">
                          {deal.name}
                        </p>
                        {isDemo && (
                          <span className="rounded-md bg-[#7a3344] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                            Demo deal
                          </span>
                        )}
                        {deal.conflictCount > 0 && (
                          <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                            {blockerLabel(deal.conflictCount)}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-stone-400 lg:hidden">{deal.sector}</p>
                    </div>
                  </Link>
                </td>
                <td className="hidden px-3 py-2 md:table-cell">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${stageClass(deal.stage)}`}>
                    {stageLabel(deal.stage)}
                  </span>
                </td>
                <td className="hidden px-3 py-2 text-stone-500 lg:table-cell">{deal.sector}</td>
                <td className="px-3 py-2 font-medium tabular-nums text-stone-700">{deal.arr}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${scoreClass(deal.readinessScore)}`}>
                    {deal.readinessScore}
                  </span>
                </td>
                <td className="hidden px-3 py-2 text-stone-500 sm:table-cell">{deal.owner.split(" ")[0]}</td>
                <td className="hidden px-3 py-2 text-stone-400 xl:table-cell">{deal.lastUpdated}</td>
                <td className="px-3 py-2 text-right">
                  {isDemo ? (
                    <Link
                      href={`/dashboard/companies/${deal.id}?from=pipeline`}
                      className="inline-flex rounded-md bg-[#7a3344] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#5a2533]"
                    >
                      Review deal →
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/companies/${deal.id}?from=pipeline`}
                      className="text-stone-400 hover:text-[#7a3344]"
                    >
                      →
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

  return (
    <table className="w-full text-left text-[13px]">
      <thead className="border-b border-stone-100 bg-stone-50/50 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        <tr>
          <th className="px-4 py-2.5">Company</th>
          <th className="px-3 py-2.5">Step</th>
          <th className="px-3 py-2.5">Open issues</th>
          <th className="hidden px-3 py-2.5 sm:table-cell">Open</th>
          <th className="px-3 py-2.5">Score</th>
          <th className="hidden px-3 py-2.5 md:table-cell">Owner</th>
          <th className="px-3 py-2.5 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {deals.map((deal) => {
          const isDemo = deal.id === DEMO_DEAL_ID;
          const step =
            deal.conflictCount > 0 || deal.readinessStatus === "blocked"
              ? "Fix numbers"
              : deal.readinessStatus === "ready"
                ? "Your decision"
                : "Review summary";
          return (
            <tr
              key={deal.id}
              className={`border-b border-stone-50 hover:bg-[#fdf2f4]/30 ${
                isDemo ? "border-l-4 border-l-[#7a3344] bg-[#fdf2f4]/20" : ""
              }`}
            >
              <td className="px-4 py-2">
                <Link
                  href={`/dashboard/companies/${deal.id}?from=ic-readiness`}
                  className="flex items-center gap-2.5 group"
                >
                  <CompanyLogo companyId={deal.id} name={deal.name} size="sm" className="!h-8 !w-8 !rounded-lg !text-xs" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900 group-hover:text-[#7a3344]">
                      {deal.name}
                    </p>
                    <p className="truncate text-[11px] text-stone-400">{deal.tagline}</p>
                  </div>
                </Link>
              </td>
              <td className="px-3 py-2">
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                  {step}
                </span>
              </td>
              <td className={`px-3 py-2 ${deal.conflictCount > 0 ? "font-semibold text-red-600" : "text-stone-400"}`}>
                {deal.conflictCount > 0 ? blockerLabel(deal.conflictCount) : "—"}
              </td>
              <td className="hidden px-3 py-2 tabular-nums text-stone-500 sm:table-cell">{deal.openItems}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${scoreClass(deal.readinessScore)}`}>
                  {deal.readinessScore}
                </span>
              </td>
              <td className="hidden px-3 py-2 text-stone-500 md:table-cell">{deal.owner.split(" ")[0]}</td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/dashboard/companies/${deal.id}?from=ic-readiness`}
                  className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                    isDemo
                      ? "bg-[#7a3344] text-white hover:bg-[#5a2533]"
                      : "border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {isDemo ? "Review deal →" : "Open"}
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
