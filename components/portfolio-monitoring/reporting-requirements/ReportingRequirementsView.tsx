"use client";

/**
 * Page for configuring which metrics each company must report.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";
import { createCompanyOverride, createSectorRequirement, mapPortfolioSectorToExpectationKey } from "@/lib/portfolio/metric-expectations";
import {
  buildCompanyRequirementRows,
  buildSectorRequirementRows,
  type EffectiveRequirementRow,
} from "@/lib/portfolio/reporting-requirements";
import { SECTOR_METRIC_DEFAULTS } from "@/lib/portfolio/metric-expectations";
import { requirementLabel } from "@/lib/portfolio/metric-applicability";
import type { MetricRequirement } from "@/lib/portfolio/monitoring-phase-types";
import { RequirementBadge } from "./RequirementBadge";
import { RequirementSourceDisplay } from "./RequirementSourceDisplay";
import { RequirementActionsMenu } from "./RequirementActionsMenu";
import { EditRequirementDrawer, type EditRequirementDraft } from "./EditRequirementDrawer";
import { MetricsConfigurationGuide } from "./MetricsConfigurationGuide";
import {
  MetricRequirementHistoryDrawer,
  MetricsAuditHistoryDrawer,
} from "./MetricsAuditHistoryDrawer";
import { CompanySearchSelect } from "./CompanySearchSelect";

type ViewMode = "company" | "sector";

const PAGE_SIZES = [10, 20, 50] as const;

/** Page for managing per-company metric reporting requirements. */
export function ReportingRequirementsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const {
    state,
    upsertMetricExpectation,
    removeCompanyMetricOverride,
  } = usePortfolio();

  const canView = hasPortfolioPermission(user?.role, "canViewMetricRequirements");
  const canEditCompany = hasPortfolioPermission(user?.role, "canEditCompanyOverrides");
  const canEditSector = hasPortfolioPermission(user?.role, "canEditMetricExpectations");
  const canReset = hasPortfolioPermission(user?.role, "canResetCompanyOverrides");
  const canAudit = hasPortfolioPermission(user?.role, "canViewMetricAuditHistory");

  const view = (searchParams.get("view") === "sector" ? "sector" : "company") as ViewMode;
  const canEditCurrent = view === "sector" ? canEditSector : canEditCompany;
  const companyIdParam = searchParams.get("companyId") ?? "";
  const sectorParam = searchParams.get("sector") ?? "";

  const companies = state.companies;
  const selectedCompany =
    companies.find((c) => c.id === companyIdParam) ?? companies[0] ?? null;
  const selectedSector =
    sectorParam ||
    selectedCompany?.sector ||
    Object.keys(SECTOR_METRIC_DEFAULTS)[0] ||
    "Enterprise Software";

  const [overridesOnly, setOverridesOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [toast, setToast] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [editRow, setEditRow] = useState<EffectiveRequirementRow | null>(null);
  const [historyRow, setHistoryRow] = useState<EffectiveRequirementRow | null>(null);
  const [resetRow, setResetRow] = useState<EffectiveRequirementRow | null>(null);

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (view === "company" && selectedCompany && companyIdParam !== selectedCompany.id) {
      setParams({ view: "company", companyId: selectedCompany.id });
    }
  }, [view, selectedCompany, companyIdParam, setParams]);

  useEffect(() => {
    setPage(1);
  }, [search, overridesOnly, selectedCompany?.id, selectedSector, view, pageSize]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const expectations = state.metricExpectations ?? [];
  const metricNames = useMemo(
    () =>
      state.extractionRules.length
        ? state.extractionRules.map((r) => r.metricName)
        : undefined,
    [state.extractionRules]
  );

  const rows = useMemo(() => {
    if (view === "sector") {
      return buildSectorRequirementRows(
        expectations,
        selectedSector,
        metricNames,
        state.extractionRules
      );
    }
    if (!selectedCompany) return [];
    return buildCompanyRequirementRows({
      expectations,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      sector: selectedCompany.sector,
      metricNames,
      extractionRules: state.extractionRules,
    });
  }, [view, expectations, selectedCompany, selectedSector, metricNames, state.extractionRules]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (overridesOnly && !row.isOverride) return false;
      if (!q) return true;
      return (
        row.metricName.toLowerCase().includes(q) ||
        row.metricDescription.toLowerCase().includes(q) ||
        row.rationale.toLowerCase().includes(q) ||
        row.ruleSourcePrimary.toLowerCase().includes(q) ||
        row.ruleSourceSecondary.toLowerCase().includes(q)
      );
    });
  }, [rows, search, overridesOnly]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  const companyNameById = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c.name])),
    [companies]
  );

  const selectedSectorKey = mapPortfolioSectorToExpectationKey(selectedSector);

  const historyMetricKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const event of state.portfolioAuditEvents ?? []) {
      if (event.entityType !== "expectation") continue;
      const metric = String(event.metadata?.metricName ?? "");
      if (!metric) continue;
      const cid = String(event.metadata?.companyId ?? "");
      if (cid) {
        keys.add(`${cid}::${metric.toLowerCase()}`);
        continue;
      }
      const sector = String(event.metadata?.sector ?? "");
      if (sector) keys.add(`sector::${sector.toLowerCase()}::${metric.toLowerCase()}`);
    }
    return keys;
  }, [state.portfolioAuditEvents]);

  const inheritedSectorLabel = selectedCompany
    ? mapPortfolioSectorToExpectationKey(selectedCompany.sector)
    : "—";

  const showToast = (message: string) => setToast(message);

  const openEdit = (row: EffectiveRequirementRow) => {
    if (!canEditCurrent) return;
    setEditRow(row);
  };

  const handleSaveEdit = (draft: EditRequirementDraft) => {
    if (!editRow || !user) return;

    if (view === "sector") {
      if (draft.mode === "inherit") {
        setEditRow(null);
        return;
      }
      const reason = draft.reason.trim();
      upsertMetricExpectation(
        createSectorRequirement({
          sector: selectedSectorKey,
          metricName: editRow.metricName,
          requirement: draft.mode as MetricRequirement,
          reason,
          configuredBy: user.name,
        }),
        { previousRequirement: editRow.requirement }
      );
      showToast(
        `${editRow.metricName} updated to ${requirementLabel(draft.mode)} for ${selectedSectorKey}.`
      );
      setEditRow(null);
      return;
    }

    if (!selectedCompany) return;

    if (draft.mode === "inherit") {
      if (editRow.isOverride) {
        removeCompanyMetricOverride({
          companyId: selectedCompany.id,
          metricName: editRow.metricName,
          actorName: user.name,
          previousRequirement: editRow.requirement,
          previousRationale: editRow.rationale,
          sectorDefaultRequirement: editRow.sectorRequirement,
        });
        showToast(
          `${editRow.metricName} now inherits the ${editRow.sectorKey} sector default.`
        );
      }
      setEditRow(null);
      return;
    }

    if (draft.mode === editRow.sectorRequirement && !editRow.isOverride && !draft.reason.trim()) {
      setEditRow(null);
      return;
    }

    const reason =
      draft.reasonSource === "other" && draft.otherSourceDetail.trim()
        ? `${draft.reason.trim()} (${draft.otherSourceDetail.trim()})`
        : draft.reason.trim();

    upsertMetricExpectation(
      createCompanyOverride({
        companyId: selectedCompany.id,
        metricName: editRow.metricName,
        requirement: draft.mode,
        reason,
        configuredBy: user.name,
        reasonSource: draft.reasonSource,
      }),
      { previousRequirement: editRow.requirement }
    );
    showToast(
      `${editRow.metricName} updated to ${requirementLabel(draft.mode)} for ${selectedCompany.name}.`
    );
    setEditRow(null);
  };

  const confirmReset = () => {
    if (!selectedCompany || !resetRow || !user) return;
    removeCompanyMetricOverride({
      companyId: selectedCompany.id,
      metricName: resetRow.metricName,
      actorName: user.name,
      previousRequirement: resetRow.requirement,
      previousRationale: resetRow.rationale,
      sectorDefaultRequirement: resetRow.sectorRequirement,
    });
    showToast(
      `${resetRow.metricName} now inherits the ${resetRow.sectorKey} sector default.`
    );
    setResetRow(null);
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-[#f4f2ef] px-8 py-6">
        <h1 className="font-display text-3xl text-stone-900">Reporting requirements</h1>
        <p className="mt-2 text-sm text-stone-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ef] px-4 py-6 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Reporting requirements</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Define which metrics are required, optional, not applicable, or not configured for each
            sector or company.
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="hidden flex-wrap gap-2 sm:flex">
            <HeaderActionButton onClick={() => setGuideOpen(true)} icon="guide">
              Metrics configuration guide
            </HeaderActionButton>
            {canAudit ? (
              <HeaderActionButton onClick={() => setAuditOpen(true)} icon="history">
                View audit history
              </HeaderActionButton>
            ) : null}
          </div>
          <div className="sm:hidden">
            <button
              type="button"
              aria-label="More actions"
              onClick={() => setHeaderMenuOpen((v) => !v)}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-stone-600"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <circle cx="8" cy="3" r="1.25" />
                <circle cx="8" cy="8" r="1.25" />
                <circle cx="8" cy="13" r="1.25" />
              </svg>
            </button>
            {headerMenuOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] text-stone-800 hover:bg-stone-50"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setGuideOpen(true);
                  }}
                >
                  Metrics configuration guide
                </button>
                {canAudit ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-[13px] text-stone-800 hover:bg-stone-50"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setAuditOpen(true);
                    }}
                  >
                    View audit history
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-6 border-b border-stone-200">
        {(
          [
            ["sector", "By sector"],
            ["company", "By company"],
          ] as const
        ).map(([id, label]) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setParams({ view: id })}
              className={`relative pb-2.5 text-[13px] font-semibold transition ${
                active ? "text-[#7a3344]" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#7a3344]" />
              ) : null}
            </button>
          );
        })}
      </div>

      <section className="mt-4 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          {view === "company" ? (
            <>
              <label className="min-w-[220px] flex-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Company
                <CompanySearchSelect
                  companies={companies.map((c) => ({ id: c.id, name: c.name }))}
                  value={selectedCompany?.id ?? ""}
                  onChange={(id) => setParams({ companyId: id, view: "company" })}
                />
              </label>
              <div className="min-w-[140px]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Inherited sector
                </p>
                <p
                  className="mt-1.5 inline-flex rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700"
                  title={
                    selectedCompany
                      ? `This company inherits its default metric requirements from the ${inheritedSectorLabel} sector.`
                      : undefined
                  }
                >
                  {inheritedSectorLabel}
                </p>
              </div>
              <div className="flex items-center gap-2 pb-2 text-[13px] font-medium text-stone-700">
                <span>Show overrides only</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={overridesOnly}
                  onClick={() => setOverridesOnly((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    overridesOnly ? "bg-[#7a3344]" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      overridesOnly ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </>
          ) : (
            <label className="min-w-[200px] flex-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              Sector
              <select
                value={selectedSector}
                onChange={(e) => setParams({ sector: e.target.value, view: "sector" })}
                className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium normal-case tracking-normal text-stone-800"
              >
                {Object.keys(SECTOR_METRIC_DEFAULTS).map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="min-w-[220px] flex-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            Search metrics
            <div className="relative mt-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search metrics..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm font-normal normal-case tracking-normal text-stone-800"
              />
            </div>
          </label>
        </div>
      </section>

      {view === "company" ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-2.5 text-[12px] text-sky-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <span
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-200/80 text-[10px] font-bold text-sky-900"
              aria-hidden
            >
              i
            </span>
            <div>
              <p>Company overrides take precedence over sector defaults.</p>
              <p className="text-sky-800/90">
                AI suggestions do not change requirements until confirmed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#7a3344] hover:underline"
          >
            Learn more in the guide
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
          </button>
        </div>
      ) : null}

      {toast ? (
        <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800">
          {toast}
        </p>
      ) : null}

      {view === "company" && !selectedCompany ? (
        <EmptyState
          title="Choose a company"
          copy="Select a portfolio company to review inherited requirements and company-specific overrides."
        />
      ) : view === "company" && !selectedCompany?.sector ? (
        <EmptyState
          title="No inherited sector"
          copy="Assign a sector to this company before configuring inherited reporting requirements."
        />
      ) : filtered.length === 0 && search ? (
        <EmptyState
          title="No metrics match your search"
          copy="Try a different term or clear the search."
          actionLabel="Clear search"
          onAction={() => setSearch("")}
        />
      ) : filtered.length === 0 && overridesOnly ? (
        <EmptyState
          title="No company overrides"
          copy="This company currently inherits all reporting requirements from its sector."
          actionLabel="View all requirements"
          onAction={() => setOverridesOnly(false)}
        />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:block">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-3 font-semibold">Metric</th>
                  <th className="px-4 py-3 font-semibold">Requirement</th>
                  <th className="px-4 py-3 font-semibold">Rule source</th>
                  <th className="px-4 py-3 font-semibold">Rationale</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const hasHistory =
                    view === "company" && selectedCompany
                      ? historyMetricKeys.has(
                          `${selectedCompany.id}::${row.metricName.toLowerCase()}`
                        )
                      : view === "sector"
                        ? historyMetricKeys.has(
                            `sector::${selectedSectorKey.toLowerCase()}::${row.metricName.toLowerCase()}`
                          )
                        : false;
                  return (
                    <tr key={row.metricName} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3.5 align-top">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          disabled={!canEditCurrent}
                          className={`text-left ${
                            canEditCurrent
                              ? "group cursor-pointer"
                              : "cursor-default"
                          }`}
                        >
                          <p
                            className={`text-[13px] font-semibold text-stone-900 ${
                              canEditCurrent ? "group-hover:text-[#7a3344] group-hover:underline" : ""
                            }`}
                          >
                            {row.metricName}
                          </p>
                          <p className="mt-0.5 text-[12px] text-stone-500">{row.metricDescription}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <RequirementBadge requirement={row.requirement} />
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <RequirementSourceDisplay row={row} />
                      </td>
                      <td className="max-w-[280px] px-4 py-3.5 align-top">
                        <p className="line-clamp-2 text-[13px] text-stone-800" title={row.rationale}>
                          {row.rationale}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-500">
                          Source: {row.rationaleSourceLabel}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <RequirementActionsMenu
                          row={row}
                          canEdit={canEditCurrent}
                          canReset={canReset}
                          canViewHistory={canAudit}
                          hasHistory={hasHistory}
                          showReset={view === "company"}
                          onEdit={() => openEdit(row)}
                          onReset={() => setResetRow(row)}
                          onHistory={() => setHistoryRow(row)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {pageRows.map((row) => {
              const hasHistory =
                view === "company" && selectedCompany
                  ? historyMetricKeys.has(`${selectedCompany.id}::${row.metricName.toLowerCase()}`)
                  : view === "sector"
                    ? historyMetricKeys.has(
                        `sector::${selectedSectorKey.toLowerCase()}::${row.metricName.toLowerCase()}`
                      )
                    : false;
              return (
                <article
                  key={row.metricName}
                  className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      disabled={!canEditCurrent}
                      className={`flex-1 text-left ${canEditCurrent ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <p
                        className={`text-[14px] font-semibold text-stone-900 ${
                          canEditCurrent ? "hover:text-[#7a3344] hover:underline" : ""
                        }`}
                      >
                        {row.metricName}
                      </p>
                      <p className="mt-0.5 text-[12px] text-stone-500">{row.metricDescription}</p>
                    </button>
                    <RequirementActionsMenu
                      row={row}
                      canEdit={canEditCurrent}
                      canReset={canReset}
                      canViewHistory={canAudit}
                      hasHistory={hasHistory}
                      showReset={view === "company"}
                      onEdit={() => openEdit(row)}
                      onReset={() => setResetRow(row)}
                      onHistory={() => setHistoryRow(row)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RequirementBadge requirement={row.requirement} />
                    <RequirementSourceDisplay row={row} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-[13px] text-stone-800" title={row.rationale}>
                    {row.rationale}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500">Source: {row.rationaleSourceLabel}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-stone-500">
              Showing {from} to {to} of {total} metrics
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])}
                className="rounded-lg border border-stone-200 px-2 py-1.5 text-[12px]"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[12px] tabular-nums text-stone-600">
                {safePage} / {pageCount}
              </span>
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <EditRequirementDrawer
        open={Boolean(editRow)}
        row={editRow}
        scope={view}
        companyName={selectedCompany?.name ?? ""}
        sectorName={selectedSectorKey}
        onClose={() => setEditRow(null)}
        onSave={handleSaveEdit}
        onOpenAudit={() => {
          setEditRow(null);
          setAuditOpen(true);
        }}
      />

      <MetricsConfigurationGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

      <MetricsAuditHistoryDrawer
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        events={state.portfolioAuditEvents ?? []}
        companyNameById={companyNameById}
      />

      {historyRow ? (
        <MetricRequirementHistoryDrawer
          open
          onClose={() => setHistoryRow(null)}
          metricName={historyRow.metricName}
          companyId={view === "company" ? selectedCompany?.id : undefined}
          companyName={view === "company" ? selectedCompany?.name : undefined}
          sectorKey={view === "sector" ? selectedSectorKey : undefined}
          events={state.portfolioAuditEvents ?? []}
        />
      ) : null}

      {resetRow ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-stone-900/30"
            aria-label="Cancel reset"
            onClick={() => setResetRow(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-stone-900">
              Reset {resetRow.metricName} to sector default?
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-stone-600">
              The company override will be removed. {resetRow.metricName} will return to{" "}
              {resetRow.sectorRequirementLabel}, inherited from {resetRow.sectorKey}.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetRow(null)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-[12px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="rounded-lg bg-[#63202e] px-3 py-2 text-[12px] font-semibold text-white"
              >
                Reset requirement
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function HeaderActionButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: "guide" | "history";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[12px] font-semibold text-[#7a3344] hover:bg-[#fdf2f4]"
    >
      {icon === "guide" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )}
      {children}
    </button>
  );
}

function EmptyState({
  title,
  copy,
  actionLabel,
  onAction,
}: {
  title: string;
  copy: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-stone-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{copy}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg border border-stone-200 px-3 py-2 text-[12px] font-semibold text-[#7a3344]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
