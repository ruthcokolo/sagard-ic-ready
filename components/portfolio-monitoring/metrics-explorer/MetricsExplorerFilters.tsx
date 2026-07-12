"use client";

import type { MetricName } from "@/lib/portfolio/types";
import type { ComparisonSort } from "@/lib/portfolio/metrics-explorer-selectors";
import { SectorFilter } from "./SectorFilter";
import { CompanyMultiSelect } from "./CompanyMultiSelect";
import type { ExplorerCompanyOption } from "@/lib/portfolio/metrics-explorer-selectors";

export function MetricsExplorerFilters({
  metrics,
  selectedMetric,
  onMetricChange,
  periods,
  selectedPeriod,
  onPeriodChange,
  sectors,
  selectedSector,
  onSectorChange,
  companyOptions,
  selectedCompanyIds,
  selectedCompaniesForLabel,
  companySearch,
  onCompanySearchChange,
  onToggleCompany,
  onSelectAllVisible,
  onClearCompanySelection,
  includeNeedsValidation,
  onIncludeNeedsValidationChange,
  openCompanyPickerToken,
}: {
  metrics: string[];
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  periods: string[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  sectors: string[];
  selectedSector: string;
  onSectorChange: (sector: string) => void;
  companyOptions: ExplorerCompanyOption[];
  selectedCompanyIds: string[];
  selectedCompaniesForLabel: { id: string; name: string }[];
  companySearch: string;
  onCompanySearchChange: (value: string) => void;
  onToggleCompany: (companyId: string) => void;
  onSelectAllVisible: (companyIds: string[]) => void;
  onClearCompanySelection: () => void;
  includeNeedsValidation: boolean;
  onIncludeNeedsValidationChange: (value: boolean) => void;
  openCompanyPickerToken?: number;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <label className="flex min-w-[9rem] flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Metric</span>
        <select
          id="explorer-metric-select"
          value={selectedMetric}
          onChange={(e) => onMetricChange(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
        >
          {metrics.map((metric) => (
            <option key={metric} value={metric}>
              {metric}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-[9rem] flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          Reporting period
        </span>
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All periods</option>
          {periods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
      </label>

      <SectorFilter sectors={sectors} value={selectedSector} onChange={onSectorChange} />

      <CompanyMultiSelect
        options={companyOptions}
        selectedIds={selectedCompanyIds}
        selectedCompaniesForLabel={selectedCompaniesForLabel}
        companySearch={companySearch}
        onSearchChange={onCompanySearchChange}
        onToggle={onToggleCompany}
        onSelectAllVisible={onSelectAllVisible}
        onClearSelection={onClearCompanySelection}
        openRequestToken={openCompanyPickerToken}
      />

      <label className="flex min-w-[12rem] items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={includeNeedsValidation}
          onChange={(e) => onIncludeNeedsValidationChange(e.target.checked)}
          className="rounded border-stone-300"
        />
        <span className="text-stone-700">Include needs validation</span>
      </label>
    </div>
  );
}

export function ComparisonSortControl({
  value,
  onChange,
}: {
  value: ComparisonSort;
  onChange: (value: ComparisonSort) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-stone-500">
      <span>Sort by</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ComparisonSort)}
        className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-700"
        aria-label="Sort comparison"
      >
        <option value="highest">Highest to lowest</option>
        <option value="lowest">Lowest to highest</option>
        <option value="name">Company name</option>
        <option value="recent">Most recent period</option>
      </select>
    </label>
  );
}
