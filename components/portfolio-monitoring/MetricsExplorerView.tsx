"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import type { ExtractedMetric, MetricName } from "@/lib/portfolio/types";
import {
  getApprovedExportRows,
  getAvailableMetrics,
  getAvailablePeriods,
  getAvailableSectors,
  getComparisonResults,
  getEligibleCompanies,
  hasProcessedPortfolioData,
  getProcessedCompanies,
  pruneIneligibleSelections,
  type ComparisonSort,
  type EligibilityFilters,
} from "@/lib/portfolio/metrics-explorer-selectors";
import { MetricsExplorerFilters } from "./metrics-explorer/MetricsExplorerFilters";
import { SelectedCompanyChips } from "./metrics-explorer/SelectedCompanyChips";
import { MetricsComparisonChart } from "./metrics-explorer/MetricsComparisonChart";
import { MetricsComparisonTable } from "./metrics-explorer/MetricsComparisonTable";
import { ComparisonNotice } from "./metrics-explorer/ComparisonNotice";
import { MetricsExplorerEmptyState } from "./metrics-explorer/MetricsExplorerEmptyState";
import { MetricEvidenceDrawer } from "./metrics-explorer/MetricEvidenceDrawer";
import { ExplorerToast } from "./metrics-explorer/ExplorerToast";

function filterReasonMessage(
  filters: EligibilityFilters,
  removedCount: number,
  trigger: "period" | "sector" | "metric" | "validation"
): string {
  const noun = removedCount === 1 ? "company was" : "companies were";
  if (trigger === "sector" && filters.sector !== "all") {
    return `${removedCount} selected ${noun} removed because they do not match the ${filters.sector} sector.`;
  }
  if (trigger === "period" && filters.period !== "all") {
    return `${removedCount} selected ${noun} removed because they do not have ${filters.metric} data for ${filters.period}.`;
  }
  if (trigger === "metric") {
    return `${removedCount} selected ${noun} removed because they do not have ${filters.metric} data for the current filters.`;
  }
  return `${removedCount} selected ${noun} removed because they no longer match the current filters.`;
}

export function MetricsExplorerView() {
  const { state, exportCsv } = usePortfolio();

  const availableMetrics = useMemo(() => getAvailableMetrics(state), [state]);
  const availablePeriods = useMemo(() => getAvailablePeriods(state), [state]);
  const sectors = useMemo(() => getAvailableSectors(state), [state]);
  const processedCompanies = useMemo(() => getProcessedCompanies(state), [state]);
  const hasData = useMemo(() => hasProcessedPortfolioData(state), [state]);

  const [selectedMetric, setSelectedMetric] = useState<string>("Revenue");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [includeNeedsValidation, setIncludeNeedsValidation] = useState(false);
  const [comparisonSort, setComparisonSort] = useState<ComparisonSort>("highest");
  const [toast, setToast] = useState<string | null>(null);
  const [evidenceMetric, setEvidenceMetric] = useState<ExtractedMetric | null>(null);

  const eligibilityFilters: EligibilityFilters = useMemo(
    () => ({
      metric: selectedMetric,
      period: selectedPeriod,
      sector: selectedSector,
      includeNeedsValidation,
    }),
    [selectedMetric, selectedPeriod, selectedSector, includeNeedsValidation]
  );

  useEffect(() => {
    if (availableMetrics.length > 0 && !availableMetrics.includes(selectedMetric)) {
      setSelectedMetric(availableMetrics[0]);
    }
  }, [availableMetrics, selectedMetric]);

  useEffect(() => {
    const validIds = new Set(processedCompanies.map((c) => c.id));
    setSelectedCompanyIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [processedCompanies]);

  const pruneSelections = useCallback(
    (filters: EligibilityFilters, trigger: "period" | "sector" | "metric" | "validation") => {
      setSelectedCompanyIds((prev) => {
        const { nextIds, removed } = pruneIneligibleSelections(state, prev, filters);
        if (removed.length > 0) {
          setToast(filterReasonMessage(filters, removed.length, trigger));
        }
        return nextIds;
      });
    },
    [state]
  );

  const handlePeriodChange = useCallback(
    (period: string) => {
      setSelectedPeriod(period);
      pruneSelections({ ...eligibilityFilters, period }, "period");
    },
    [eligibilityFilters, pruneSelections]
  );

  const handleSectorChange = useCallback(
    (sector: string) => {
      setSelectedSector(sector);
      pruneSelections({ ...eligibilityFilters, sector }, "sector");
    },
    [eligibilityFilters, pruneSelections]
  );

  const handleMetricChange = useCallback(
    (metric: string) => {
      setSelectedMetric(metric);
      pruneSelections({ ...eligibilityFilters, metric }, "metric");
    },
    [eligibilityFilters, pruneSelections]
  );

  const handleIncludeNeedsValidationChange = useCallback(
    (value: boolean) => {
      setIncludeNeedsValidation(value);
      pruneSelections({ ...eligibilityFilters, includeNeedsValidation: value }, "validation");
    },
    [eligibilityFilters, pruneSelections]
  );

  const clearFilters = useCallback(() => {
    setSelectedPeriod("all");
    setSelectedSector("all");
    setSelectedCompanyIds([]);
    setCompanySearch("");
    setIncludeNeedsValidation(false);
    if (availableMetrics.length > 0) {
      setSelectedMetric(availableMetrics[0]);
    }
  }, [availableMetrics]);

  const companyOptions = useMemo(
    () =>
      getEligibleCompanies(state, {
        ...eligibilityFilters,
        companySearch,
      }),
    [state, eligibilityFilters, companySearch]
  );

  const selectedCompanies = useMemo(
    () =>
      selectedCompanyIds
        .map((id) => state.companies.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [selectedCompanyIds, state.companies]
  );

  const comparison = useMemo(
    () =>
      getComparisonResults(state, {
        ...eligibilityFilters,
        selectedCompanyIds,
        comparisonSort,
      }),
    [state, eligibilityFilters, selectedCompanyIds, comparisonSort]
  );

  const approvedExportRows = useMemo(
    () => getApprovedExportRows(comparison.tableRows),
    [comparison.tableRows]
  );

  const periodLabel = selectedPeriod === "all" ? "All periods" : selectedPeriod;

  const excludedNotice =
    comparison.excludedCompanies.length > 0 && selectedCompanyIds.length > 0
      ? `${comparison.excludedCompanies.length} selected ${
          comparison.excludedCompanies.length === 1 ? "company was" : "companies were"
        } excluded because they do not have ${
          includeNeedsValidation ? "" : "approved "
        }${selectedMetric} data for ${selectedPeriod === "all" ? "the selected filters" : selectedPeriod}.`
      : "";

  function toggleCompany(companyId: string) {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  }

  function handleExport() {
    exportCsv({
      metricIds: approvedExportRows.map((row) => row.id),
      includeNeedsValidation: false,
    });
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-[#f4f2ef] px-8 py-6">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Metrics explorer</h1>
          <p className="mt-1 text-sm text-stone-500">
            Compare approved metrics across companies and periods. Human validation required before
            export.
          </p>
        </div>
        <div className="mt-6">
          <MetricsExplorerEmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ef] px-8 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Metrics explorer</h1>
          <p className="mt-1 text-sm text-stone-500">
            Compare approved metrics across companies and periods. Human validation required before
            export.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={approvedExportRows.length === 0}
          title={
            approvedExportRows.length === 0
              ? "No approved records match the current filters."
              : undefined
          }
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          Export approved CSV
        </button>
      </div>

      <MetricsExplorerFilters
        metrics={availableMetrics}
        selectedMetric={selectedMetric}
        onMetricChange={handleMetricChange}
        periods={availablePeriods}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        sectors={sectors}
        selectedSector={selectedSector}
        onSectorChange={handleSectorChange}
        companyOptions={companyOptions}
        selectedCompanyIds={selectedCompanyIds}
        selectedCompaniesForLabel={selectedCompanies.map((c) => ({ id: c.id, name: c.name }))}
        companySearch={companySearch}
        onCompanySearchChange={setCompanySearch}
        onToggleCompany={toggleCompany}
        onSelectAllVisible={setSelectedCompanyIds}
        onClearCompanySelection={() => setSelectedCompanyIds([])}
        includeNeedsValidation={includeNeedsValidation}
        onIncludeNeedsValidationChange={handleIncludeNeedsValidationChange}
      />

      <SelectedCompanyChips
        companies={selectedCompanies}
        onRemove={toggleCompany}
        onClearAll={() => setSelectedCompanyIds([])}
      />

      {excludedNotice && selectedCompanyIds.length > 0 && (
        <div className="mt-4">
          <ComparisonNotice
            message={excludedNotice}
            excludedCompanies={comparison.excludedCompanies}
          />
        </div>
      )}

      <div className="mt-6">
        <MetricsComparisonChart
          metricName={selectedMetric}
          periodLabel={periodLabel}
          rows={comparison.comparableRows}
          sort={comparisonSort}
          onSortChange={setComparisonSort}
          includeNeedsValidation={includeNeedsValidation}
          hasMixedCurrencies={comparison.hasMixedCurrencies}
          showPeriodInLabels={selectedPeriod === "all"}
          showIncludeNeedsValidationAction={!includeNeedsValidation}
          onClearFilters={clearFilters}
          onIncludeNeedsValidation={() => handleIncludeNeedsValidationChange(true)}
        />
      </div>

      <MetricsComparisonTable
        rows={comparison.tableRows}
        onViewEvidence={setEvidenceMetric}
        onClearFilters={clearFilters}
        onIncludeNeedsValidation={() => handleIncludeNeedsValidationChange(true)}
        showIncludeNeedsValidationAction={!includeNeedsValidation}
      />

      {evidenceMetric && (
        <MetricEvidenceDrawer metric={evidenceMetric} onClose={() => setEvidenceMetric(null)} />
      )}

      {toast && <ExplorerToast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
