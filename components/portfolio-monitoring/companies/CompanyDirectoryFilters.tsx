"use client";

import type {
  CompanyDirectoryFilters,
  CompanyDirectorySort,
  DirectoryReportingHealth,
} from "@/lib/portfolio/companies-directory-selectors";

const HEALTH_OPTIONS: DirectoryReportingHealth[] = [
  "On track",
  "Needs validation",
  "Processing issue",
  "Report overdue",
  "Awaiting report",
  "No reports yet",
];

const SORT_OPTIONS: { value: CompanyDirectorySort; label: string }[] = [
  { value: "az", label: "Sort by: A–Z" },
  { value: "za", label: "Sort by: Z–A" },
  { value: "latest_report", label: "Sort by: Latest report" },
  { value: "most_reports", label: "Sort by: Most reports received" },
  { value: "highest_coverage", label: "Sort by: Highest coverage" },
  { value: "most_validation", label: "Sort by: Most validation work" },
  { value: "reporting_health", label: "Sort by: Reporting health" },
];

export function CompanyDirectoryFiltersBar({
  filters,
  sectors,
  statuses,
  onChange,
}: {
  filters: CompanyDirectoryFilters;
  sectors: string[];
  statuses: string[];
  onChange: (next: CompanyDirectoryFilters) => void;
}) {
  const selectClass =
    "h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-[13px] text-stone-700";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search companies..."
          className="h-9 w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-3 text-[13px] text-stone-800 placeholder:text-stone-400"
        />
      </div>
      <select
        value={filters.sector}
        onChange={(e) => onChange({ ...filters, sector: e.target.value })}
        className={selectClass}
      >
        <option value="all">All sectors</option>
        {sectors.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className={selectClass}
      >
        <option value="all">All status</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={filters.reportingHealth}
        onChange={(e) => onChange({ ...filters, reportingHealth: e.target.value })}
        className={selectClass}
      >
        <option value="all">All reporting health</option>
        {HEALTH_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <select
        value={filters.sort}
        onChange={(e) =>
          onChange({ ...filters, sort: e.target.value as CompanyDirectorySort })
        }
        className={selectClass}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
