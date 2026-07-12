"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type CompanyReportingStatus,
  type CompanySubmissionRow,
} from "@/lib/portfolio/overview-selectors";
import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity";
import { MetricChangeBadge, OverviewCoverageBar } from "./MetricChangeBadge";

const STATUS_STYLES: Record<CompanyReportingStatus, string> = {
  "Reporting complete": "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Needs validation": "bg-amber-50 text-amber-800 ring-amber-100",
  Processing: "bg-blue-50 text-blue-700 ring-blue-100",
  Failed: "bg-red-50 text-red-700 ring-red-100",
  "Report missing": "bg-stone-100 text-stone-600 ring-stone-200",
  Overdue: "bg-stone-100 text-stone-600 ring-stone-200",
};

function formatLastUpdated(iso: string | null) {
  if (!iso) return { date: "—", by: "" };
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return {
    date: isToday
      ? `Today, ${time}`
      : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    by: "",
  };
}

type Filters = {
  search: string;
  period: string;
  reportingStatus: string;
  validationStatus: string;
  coverageMin: string;
  sector: string;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  period: "all",
  reportingStatus: "all",
  validationStatus: "all",
  coverageMin: "all",
  sector: "all",
};

function filterRows(rows: CompanySubmissionRow[], filters: Filters) {
  return rows.filter((row) => {
    if (filters.search && !row.companyName.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.period !== "all" && row.reportPeriod !== filters.period) return false;
    if (filters.reportingStatus !== "all" && row.reportingStatus !== filters.reportingStatus) {
      return false;
    }
    if (filters.validationStatus !== "all") {
      if (filters.validationStatus === "Needs validation" && row.reportingStatus !== "Needs validation") {
        return false;
      }
      if (filters.validationStatus === "Complete" && row.reportingStatus !== "Reporting complete") {
        return false;
      }
    }
    if (filters.coverageMin !== "all") {
      const min = Number(filters.coverageMin);
      if (row.coverage < min) return false;
    }
    if (filters.sector !== "all" && row.sector !== filters.sector) return false;
    return true;
  });
}

export function CompanySubmissionTable({
  rows,
  sectors,
  className = "",
  compact = false,
  viewAllHref = "/dashboard/portfolio/companies",
}: {
  rows: CompanySubmissionRow[];
  sectors: string[];
  className?: string;
  /** Overview preview: hide filters, keep fixed card height, scroll all companies inside. */
  compact?: boolean;
  viewAllHref?: string;
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const periods = useMemo(
    () => Array.from(new Set(rows.map((r) => r.reportPeriod))).sort(),
    [rows]
  );

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = compact
    ? filtered
    : filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
        compact
          ? "h-full min-h-0 max-h-[36rem] xl:max-h-none"
          : "h-full min-h-[28rem]"
      } ${className}`}
    >
      <div className="shrink-0 border-b border-stone-100 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-stone-900">Submission status by company</h2>
          {compact && filtered.length > 0 ? (
            <Link
              href={viewAllHref}
              className="shrink-0 text-xs font-semibold text-[#7a3344] hover:underline"
            >
              View all
            </Link>
          ) : null}
        </div>

        {!compact ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Search company…"
              value={filters.search}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
              className="min-w-[10rem] flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
            />
            <select
              value={filters.period}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, period: e.target.value }));
              }}
              className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            >
              <option value="all">All report periods</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={filters.reportingStatus}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, reportingStatus: e.target.value }));
              }}
              className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            >
              <option value="all">All reporting status</option>
              {Object.keys(STATUS_STYLES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filters.validationStatus}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, validationStatus: e.target.value }));
              }}
              className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            >
              <option value="all">All validation status</option>
              <option value="Needs validation">Needs validation</option>
              <option value="Complete">Reporting complete</option>
            </select>
            <select
              value={filters.coverageMin}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, coverageMin: e.target.value }));
              }}
              className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            >
              <option value="all">Coverage: All</option>
              <option value="90">≥ 90%</option>
              <option value="70">≥ 70%</option>
              <option value="50">≥ 50%</option>
            </select>
            {sectors.length > 0 ? (
              <select
                value={filters.sector}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, sector: e.target.value }));
                }}
                className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
              >
                <option value="all">All sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Desktop table — scrolls inside fixed card height */}
      <div className="hidden min-h-0 flex-1 overflow-x-auto overflow-y-auto lg:block">
        <table className="w-full min-w-[960px] table-fixed text-left text-sm">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-stone-100 bg-stone-50/95 text-xs font-medium text-stone-500 backdrop-blur-sm">
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Report period</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Reporting status</th>
              <th className="px-3 py-2.5 font-medium">Coverage</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">Last updated</th>
              <th className="px-3 py-2.5 font-medium">Changes since last report</th>
              <th className="px-3 py-2.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-500">
                  {rows.length === 0
                    ? "No company submissions yet. Upload a reporting package to begin."
                    : "No companies match the current filters."}
                </td>
              </tr>
            ) : (
              paged.map((row) => {
                const updated = formatLastUpdated(row.lastUpdatedAt);
                return (
                  <tr key={row.companyId} className="hover:bg-stone-50/50">
                    <td className="max-w-0 overflow-hidden px-4 py-3 align-middle">
                      <CompanyIdentity
                        companyId={row.companyId}
                        companyName={row.companyName}
                        size="md"
                        href={`/dashboard/portfolio/companies/${row.companyId}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-middle text-stone-600">
                      {row.reportPeriod}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLES[row.reportingStatus]}`}
                      >
                        {row.reportingStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <OverviewCoverageBar value={row.coverage} />
                    </td>
                    <td className="max-w-0 overflow-hidden px-3 py-3 align-middle">
                      <p className="truncate text-stone-800" title={updated.date}>
                        {updated.date}
                      </p>
                      <p className="truncate text-[11px] text-stone-400">{row.lastUpdatedBy}</p>
                    </td>
                    <td className="max-w-0 overflow-hidden px-3 py-3 align-middle">
                      {row.changes.length === 0 ? (
                        <span className="text-xs text-stone-400">Not available</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.changes.map((c) => (
                            <MetricChangeBadge key={c.metricName} change={c} />
                          ))}
                          {row.totalChanges > row.changes.length ? (
                            <span className="text-[10px] text-stone-400">
                              +{row.totalChanges - row.changes.length} more
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-middle">
                      <Link
                        href={row.actionHref}
                        className="text-sm font-semibold text-[#7a3344] hover:underline"
                      >
                        {row.actionLabel} →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="min-h-0 flex-1 divide-y divide-stone-100 overflow-y-auto lg:hidden">
        {paged.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm text-stone-500">
            {rows.length === 0
              ? "No company submissions yet. Upload a reporting package to begin."
              : "No companies match the current filters."}
          </p>
        ) : (
          paged.map((row) => {
            const updated = formatLastUpdated(row.lastUpdatedAt);
            return (
              <article key={row.companyId} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <CompanyIdentity
                          companyId={row.companyId}
                          companyName={row.companyName}
                          size="lg"
                          href={`/dashboard/portfolio/companies/${row.companyId}`}
                        />
                      </div>
                      <span
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_STYLES[row.reportingStatus]}`}
                      >
                        {row.reportingStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{row.reportPeriod}</p>
                    <div className="mt-2">
                      <OverviewCoverageBar value={row.coverage} />
                    </div>
                    <p className="mt-2 text-[11px] text-stone-400">
                      {updated.date} · {row.lastUpdatedBy}
                    </p>
                    {row.changes.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {row.changes.map((c) => (
                          <MetricChangeBadge key={c.metricName} change={c} />
                        ))}
                      </div>
                    ) : null}
                    <Link
                      href={row.actionHref}
                      className="mt-3 inline-flex text-sm font-semibold text-[#7a3344] hover:underline"
                    >
                      {row.actionLabel} →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {filtered.length > 0 && !compact ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-xs text-stone-500">
          <p>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of{" "}
            {filtered.length} companies
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-stone-200 px-2 py-1 disabled:opacity-40"
            >
              ‹
            </button>
            <span className="px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-stone-200 px-2 py-1 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
