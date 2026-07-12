"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { getOverviewSnapshot } from "@/lib/portfolio/overview-selectors";
import { getActivePortfolioSectors } from "@/lib/portfolio/sector-classification";
import {
  PortfolioOverviewEmptyState,
  PortfolioOverviewHeader,
} from "@/components/portfolio-monitoring/overview/PortfolioOverviewHeader";
import {
  OverviewSkeleton,
  PortfolioKpiSummary,
} from "@/components/portfolio-monitoring/overview/PortfolioKpiSummary";
import { NeedsAttentionPanel } from "@/components/portfolio-monitoring/overview/NeedsAttentionPanel";
import { RecentActivityPanel } from "@/components/portfolio-monitoring/overview/RecentActivityPanel";
import { ReportingProgressCard } from "@/components/portfolio-monitoring/overview/ReportingProgressCard";
import { PortfolioWorkflowHealthCard } from "@/components/portfolio-monitoring/overview/PortfolioWorkflowHealthCard";
import { ExpectedMetricsCoverageCard } from "@/components/portfolio-monitoring/overview/ExpectedMetricsCoverageCard";
import { ExtractionPerformanceCard } from "@/components/portfolio-monitoring/overview/ExtractionPerformanceCard";
import { CompanySubmissionTable } from "@/components/portfolio-monitoring/overview/CompanySubmissionTable";

export function PortfolioOverviewDashboard() {
  const { state, hydrated } = usePortfolio();

  const snapshot = useMemo(() => getOverviewSnapshot(state), [state]);
  const sectors = useMemo(
    () => getActivePortfolioSectors(state.companies),
    [state.companies]
  );

  const hasActivity = state.packages.length > 0 || state.companies.length > 0;

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <PortfolioOverviewHeader />

      {!hydrated ? (
        <OverviewSkeleton />
      ) : !hasActivity ? (
        <PortfolioOverviewEmptyState />
      ) : (
        <div className="space-y-5 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <PortfolioKpiSummary kpis={snapshot.kpis} />

          {/* Three-column primary dashboard — left/middle stretch to right stack bottom */}
          <div className="grid gap-5 xl:grid-cols-12 xl:items-stretch">
            <div className="flex min-h-0 xl:col-span-4">
              <NeedsAttentionPanel
                items={snapshot.needsAttention}
                totalCount={snapshot.needsAttention.length}
              />
            </div>
            <div className="flex min-h-0 xl:col-span-4">
              <RecentActivityPanel events={snapshot.recentActivity} />
            </div>
            <div className="flex flex-col gap-5 xl:col-span-4">
              <ReportingProgressCard progress={snapshot.reportingProgress} />
              <PortfolioWorkflowHealthCard
                total={snapshot.workflowHealth.total}
                segments={snapshot.workflowHealth.segments}
              />
            </div>
          </div>

          {/* Submission table + supporting cards — right column sets row height; left scrolls */}
          <div className="grid gap-5 xl:grid-cols-12 xl:items-stretch">
            <div className="flex min-h-0 xl:col-span-8 xl:h-0 xl:min-h-full xl:overflow-hidden">
              <CompanySubmissionTable
                rows={snapshot.submissionRows}
                sectors={sectors}
                className="w-full"
                compact
              />
            </div>
            <div className="flex flex-col gap-5 xl:col-span-4">
              <ExpectedMetricsCoverageCard rows={snapshot.expectedCoverage} />
              <ExtractionPerformanceCard stats={snapshot.extractionPerformance} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
