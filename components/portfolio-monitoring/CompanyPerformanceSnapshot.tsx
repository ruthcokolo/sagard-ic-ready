"use client";

import Link from "next/link";
import { useState } from "react";
import type { CompanyPerformanceRow } from "@/lib/portfolio/selectors";
import { MetricStatusBadge, CoverageBar } from "@/components/portfolio-monitoring/PortfolioShared";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";

function companyInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CompanyPerformanceSnapshot({ rows }: { rows: CompanyPerformanceRow[] }) {
  const { exportCsv } = usePortfolio();
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) =>
    r.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-900">Company performance snapshot</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Search company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#7a3344] focus:outline-none focus:ring-1 focus:ring-[#7a3344]/20"
          />
          <button
            type="button"
            onClick={() => exportCsv()}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/80 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-2.5">Company</th>
              <th className="px-3 py-2.5">Latest report</th>
              <th className="px-3 py-2.5">Revenue</th>
              <th className="px-3 py-2.5">ARR</th>
              <th className="px-3 py-2.5">EBITDA</th>
              <th className="px-3 py-2.5">Cash</th>
              <th className="px-3 py-2.5">Headcount</th>
              <th className="px-3 py-2.5">Validation status</th>
              <th className="px-4 py-2.5">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.companyId} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/40">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/portfolio/companies/${row.companyId}`} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-stone-600 to-stone-800 text-[9px] font-bold text-white">
                      {companyInitials(row.company)}
                    </div>
                    <span className="font-medium text-stone-900 hover:text-[#7a3344]">{row.company}</span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-stone-700">{row.latestReport}</td>
                <td className="px-3 py-3 tabular-nums text-stone-900">{row.revenue}</td>
                <td className="px-3 py-3 tabular-nums text-stone-900">{row.arr}</td>
                <td className="px-3 py-3 tabular-nums text-stone-900">{row.ebitda}</td>
                <td className="px-3 py-3 tabular-nums text-stone-900">{row.cash}</td>
                <td className="px-3 py-3 tabular-nums text-stone-900">{row.headcount}</td>
                <td className="px-3 py-3">
                  <MetricStatusBadge
                    status={
                      row.validationStatus as
                        | "Approved for reporting"
                        | "Needs validation"
                        | "Missing from report"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <CoverageBar value={row.coverage} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-stone-100 px-4 py-2.5">
        <Link href="/dashboard/portfolio/companies" className="text-sm font-semibold text-[#7a3344] hover:underline">
          View all companies →
        </Link>
      </div>
    </div>
  );
}
