"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { getActivePortfolioSectors } from "@/lib/portfolio/sector-classification";
import {
  buildCompanyDirectoryCsv,
  DEFAULT_COMPANY_DIRECTORY_FILTERS,
  getCompanyDirectorySummary,
  getFilteredCompanyDirectoryRows,
  getInvestmentStatusesInUse,
  type CompanyDirectoryFilters,
} from "@/lib/portfolio/companies-directory-selectors";
import { CompaniesHeader } from "./companies/CompaniesHeader";
import { CompanyDirectorySummary } from "./companies/CompanyDirectorySummary";
import { CompanyDirectoryBanner } from "./companies/CompanyDirectoryBanner";
import { CompanyDirectoryFiltersBar } from "./companies/CompanyDirectoryFilters";
import { CompanyDirectoryTable } from "./companies/CompanyDirectoryTable";
import { CompanyDirectoryEmptyState } from "./companies/CompanyDirectoryEmptyState";
import { CompanyGuideDialog } from "./companies/CompanyGuideDialog";
import { AddCompanyDrawer } from "./companies/AddCompanyDrawer";
import {
  AssignOwnerDialog,
  ManageSectorsDialog,
} from "./companies/CompanyDirectoryDialogs";

const BANNER_KEY = "icready-companies-banner-dismissed";

export function CompaniesView() {
  const { user } = useAuth();
  const { state, hydrated, addCompany } = usePortfolio();
  const [filters, setFilters] = useState<CompanyDirectoryFilters>(
    DEFAULT_COMPANY_DIRECTORY_FILTERS
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [sectorsOpen, setSectorsOpen] = useState(false);
  const [assignCompanyId, setAssignCompanyId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setBannerDismissed(localStorage.getItem(BANNER_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const summary = useMemo(
    () =>
      getCompanyDirectorySummary(state, {
        currentUserId: user?.id,
        currentUserName: user?.name,
      }),
    [state, user?.id, user?.name]
  );
  const sectors = useMemo(
    () => getActivePortfolioSectors(state.companies),
    [state.companies]
  );
  const statuses = useMemo(
    () => getInvestmentStatusesInUse(state.companies),
    [state.companies]
  );

  const rows = useMemo(
    () => getFilteredCompanyDirectoryRows(state, filters),
    [state, filters]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, rows.length);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  function exportList() {
    const csv = buildCompanyDirectoryCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companies-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasAnyCompanies = state.companies.length > 0;

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col bg-[#f4f2ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="shrink-0 space-y-5">
        <CompaniesHeader
          onOpenGuide={() => setGuideOpen(true)}
          onAddCompany={() => setAddOpen(true)}
          onExport={exportList}
          onManageSectors={() => setSectorsOpen(true)}
        />

        {!hydrated ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[96px] animate-pulse rounded-xl border border-stone-200 bg-white"
              />
            ))}
          </div>
        ) : (
          <CompanyDirectorySummary {...summary} />
        )}

        {!bannerDismissed ? (
          <CompanyDirectoryBanner
            onLearnMore={() => setGuideOpen(true)}
            onDismiss={() => {
              setBannerDismissed(true);
              try {
                localStorage.setItem(BANNER_KEY, "1");
              } catch {
                /* ignore */
              }
            }}
          />
        ) : null}

        <CompanyDirectoryFiltersBar
          filters={filters}
          sectors={sectors}
          statuses={statuses}
          onChange={setFilters}
        />
      </div>

      <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="min-h-0 flex-1 overflow-auto">
          {!hydrated ? (
            <div className="px-6 py-16 text-center text-sm text-stone-500">Loading companies…</div>
          ) : !hasAnyCompanies ? (
            <CompanyDirectoryEmptyState
              variant="none"
              onAddCompany={() => setAddOpen(true)}
              onClearFilters={() => setFilters({ ...DEFAULT_COMPANY_DIRECTORY_FILTERS })}
            />
          ) : pageRows.length === 0 ? (
            <CompanyDirectoryEmptyState
              variant="filtered"
              onAddCompany={() => setAddOpen(true)}
              onClearFilters={() => setFilters({ ...DEFAULT_COMPANY_DIRECTORY_FILTERS })}
            />
          ) : (
            <CompanyDirectoryTable
              rows={pageRows}
              onAssignOwner={(id) => setAssignCompanyId(id)}
            />
          )}
        </div>

        {hasAnyCompanies ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-[12px] text-stone-500">
            <p>
              Showing {from} to {to} of {rows.length} compan
              {rows.length === 1 ? "y" : "ies"}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-stone-200 bg-white px-2 py-1 disabled:opacity-40"
              >
                ‹
              </button>
              <span className="min-w-[1.5rem] text-center font-semibold text-[#63202e]">
                {safePage}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-stone-200 bg-white px-2 py-1 disabled:opacity-40"
              >
                ›
              </button>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-stone-200 bg-white px-2 py-1"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        ) : null}
      </section>

      <CompanyGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
      <AddCompanyDrawer open={addOpen} onClose={() => setAddOpen(false)} onSubmit={addCompany} />
      <ManageSectorsDialog open={sectorsOpen} onClose={() => setSectorsOpen(false)} />
      <AssignOwnerDialog
        open={Boolean(assignCompanyId)}
        companyId={assignCompanyId}
        onClose={() => setAssignCompanyId(null)}
      />
    </div>
  );
}
