"use client";

/**
 * Configure how metrics are extracted from reports and view rule audit history.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import type { ExtractionRule, MetricDataType } from "@/lib/portfolio/types";
import {
  METRIC_DATA_TYPE_LABELS,
  displayUnit,
  getMetricUsage,
  type MetricUsageSummary,
} from "@/lib/portfolio/metric-definition-utils";
import { getMetricDescription } from "@/lib/portfolio/metric-definitions";
import { MetricsConfigurationGuide } from "@/components/portfolio-monitoring/reporting-requirements/MetricsConfigurationGuide";
import {
  EditMetricDefinitionDrawer,
  type MetricDefinitionDraft,
} from "@/components/portfolio-monitoring/extraction-rules/EditMetricDefinitionDrawer";
import { ExtractionRulesAuditDrawer } from "@/components/portfolio-monitoring/extraction-rules/ExtractionRulesAuditDrawer";

const PAGE_SIZES = [10, 20, 50] as const;
type SortKey = "metric" | "type" | "status" | "usage";

/** Small icon showing the data type of a metric (money, percent, count, etc.). */
function TypeIcon({ type }: { type: MetricDataType }) {
  const label = METRIC_DATA_TYPE_LABELS[type];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-700">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-600">
        {type === "currency"
          ? "$"
          : type === "percentage"
            ? "%"
            : type === "count"
              ? "#"
              : type === "ratio"
                ? "×"
                : "T"}
      </span>
      {label}
    </span>
  );
}

/** Green or amber pill showing if a metric definition is turned on or off. */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
      }`}
      title="Active definitions are used in future extraction attempts. Inactive definitions remain available in historical records but are not used for new extraction."
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/** Page for viewing and editing metric extraction rules. */
export function ExtractionRulesView() {
  const { user } = useAuth();
  const {
    state,
    upsertMetricDefinition,
    setMetricDefinitionEnabled,
    deleteMetricDefinition,
  } = usePortfolio();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("metric");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [toast, setToast] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editRule, setEditRule] = useState<ExtractionRule | null>(null);
  const [focusAliases, setFocusAliases] = useState(false);
  const [disableTarget, setDisableTarget] = useState<{
    rule: ExtractionRule;
    usage: MetricUsageSummary;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    rule: ExtractionRule;
    usage: MetricUsageSummary;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const actorName = user?.name ?? "Alex Rivera";
  const rules = state.extractionRules;

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, pageSize]);

  const usageByMetric = useMemo(() => {
    const map = new Map<string, MetricUsageSummary>();
    for (const rule of rules) {
      map.set(rule.metricName, getMetricUsage(state, rule.metricName));
    }
    return map;
  }, [rules, state]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...rules];
    if (typeFilter !== "all") {
      rows = rows.filter((r) => (r.type ?? "currency") === typeFilter);
    }
    if (statusFilter === "active") rows = rows.filter((r) => r.enabled);
    if (statusFilter === "inactive") rows = rows.filter((r) => !r.enabled);
    if (q) {
      rows = rows.filter((r) => {
        const desc = getMetricDescription(r.metricName, rules).toLowerCase();
        const typeLabel = METRIC_DATA_TYPE_LABELS[r.type ?? "currency"].toLowerCase();
        return (
          r.metricName.toLowerCase().includes(q) ||
          desc.includes(q) ||
          r.aliases.some((a) => a.toLowerCase().includes(q)) ||
          r.expectedUnit.toLowerCase().includes(q) ||
          typeLabel.includes(q)
        );
      });
    }

    rows.sort((a, b) => {
      const usageA = usageByMetric.get(a.metricName);
      const usageB = usageByMetric.get(b.metricName);
      let cmp = 0;
      if (sortKey === "metric") cmp = a.metricName.localeCompare(b.metricName);
      else if (sortKey === "type") {
        cmp = (a.type ?? "currency").localeCompare(b.type ?? "currency");
      } else if (sortKey === "status") {
        cmp = Number(b.enabled) - Number(a.enabled);
      } else {
        cmp =
          (usageB?.companyCount ?? 0) +
          (usageB?.sectorCount ?? 0) -
          ((usageA?.companyCount ?? 0) + (usageA?.sectorCount ?? 0));
      }
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [rules, search, typeFilter, statusFilter, sortKey, sortAsc, usageByMetric]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  const openCreate = () => {
    setEditRule(null);
    setFocusAliases(false);
    setDrawerMode("create");
  };

  const openEdit = (rule: ExtractionRule, aliases = false) => {
    setEditRule(rule);
    setFocusAliases(aliases);
    setDrawerMode("edit");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleSaveDraft = (draft: MetricDefinitionDraft) => {
    const result = upsertMetricDefinition({
      originalName: drawerMode === "edit" ? editRule?.metricName : undefined,
      metricName: draft.metricName,
      description: draft.description,
      type: draft.type,
      expectedUnit: draft.expectedUnit,
      enabled: draft.enabled,
      aliases: draft.aliases,
      matchingGuidance: draft.matchingGuidance,
      supportedContexts: draft.supportedContexts,
      actorName,
    });
    if (result.success) setToast(result.message);
    return result;
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const pageButtons = useMemo(() => {
    const buttons: number[] = [];
    for (let i = 1; i <= pageCount; i++) {
      if (i <= 4 || i === pageCount || Math.abs(i - safePage) <= 1) buttons.push(i);
    }
    return [...new Set(buttons)].sort((a, b) => a - b);
  }, [pageCount, safePage]);

  return (
    <div className="min-h-screen bg-[#f4f2ef] px-4 py-6 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Extraction rules</h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            Configure how ICReady recognizes metrics in company-provided PDFs.
          </p>
          <p className="mt-0.5 max-w-2xl text-sm text-stone-500">
            Aliases affect future AI-assisted extraction attempts.
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="hidden flex-wrap gap-2 sm:flex">
            <HeaderBtn icon="guide" onClick={() => setGuideOpen(true)}>
              Metrics configuration guide
            </HeaderBtn>
            <HeaderBtn icon="history" onClick={() => setAuditOpen(true)}>
              View audit history
            </HeaderBtn>
          </div>
          <div className="sm:hidden">
            <button
              type="button"
              aria-label="More actions"
              onClick={() => setHeaderMenuOpen((v) => !v)}
              className="rounded-md border border-stone-200 bg-white px-2.5 py-2 text-stone-600"
            >
              ···
            </button>
            {headerMenuOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px]"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setGuideOpen(true);
                  }}
                >
                  Metrics configuration guide
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px]"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    setAuditOpen(true);
                  }}
                >
                  View audit history
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="mt-5 flex flex-col gap-3 rounded-xl border border-stone-200/70 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
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
            className="w-full rounded-md border border-stone-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {(Object.keys(METRIC_DATA_TYPE_LABELS) as MetricDataType[]).map((t) => (
            <option key={t} value={t}>
              {METRIC_DATA_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-stone-200 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[#63202e] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#7a3344]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Add metric
        </button>
      </section>

      {toast ? (
        <p className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800">
          {toast}
        </p>
      ) : null}

      {rules.length === 0 ? (
        <EmptyState
          title="No metric definitions yet"
          copy="Add a metric definition to teach ICReady how to recognize it in portfolio reports."
          actionLabel="Add metric"
          onAction={openCreate}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No metrics match these filters"
          copy="Try a different search or clear the filters."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:block">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-2.5">
                    <button type="button" onClick={() => toggleSort("metric")} className="font-semibold">
                      Metric {sortKey === "metric" ? (sortAsc ? "↑" : "↓") : ""}
                    </button>
                  </th>
                  <th className="px-4 py-2.5">
                    <button type="button" onClick={() => toggleSort("type")} className="font-semibold">
                      Type {sortKey === "type" ? (sortAsc ? "↑" : "↓") : ""}
                    </button>
                  </th>
                  <th className="px-4 py-2.5">Unit</th>
                  <th className="px-4 py-2.5">Aliases</th>
                  <th className="px-4 py-2.5">
                    <button type="button" onClick={() => toggleSort("status")} className="font-semibold">
                      Status {sortKey === "status" ? (sortAsc ? "↑" : "↓") : ""}
                    </button>
                  </th>
                  <th className="px-4 py-2.5">
                    <button type="button" onClick={() => toggleSort("usage")} className="font-semibold">
                      Usage {sortKey === "usage" ? (sortAsc ? "↑" : "↓") : ""}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((rule) => {
                  const usage = usageByMetric.get(rule.metricName)!;
                  const type = rule.type ?? "currency";
                  const desc = getMetricDescription(rule.metricName, rules);
                  const aliasExtra = Math.max(0, rule.aliases.length - 2);
                  return (
                    <tr key={rule.metricName} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3 align-top">
                        <p className="text-[13px] font-medium text-stone-900">{rule.metricName}</p>
                        <p className="mt-0.5 line-clamp-2 max-w-[260px] text-[12px] text-stone-500">
                          {desc}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <TypeIcon type={type} />
                      </td>
                      <td className="px-4 py-3 align-top text-[13px] text-stone-700">
                        {displayUnit(rule.expectedUnit, type)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1" title={rule.aliases.join(", ")}>
                          {rule.aliases.slice(0, 2).map((alias) => (
                            <span
                              key={alias}
                              className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600"
                            >
                              {alias}
                            </span>
                          ))}
                          {aliasExtra > 0 ? (
                            <button
                              type="button"
                              onClick={() => openEdit(rule, true)}
                              className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-200"
                            >
                              +{aliasExtra}
                            </button>
                          ) : null}
                          {rule.aliases.length === 0 ? (
                            <span className="text-[12px] text-stone-400">—</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge active={rule.enabled} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <UsageCell usage={usage} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(rule)}
                            className="rounded-md border border-stone-200 px-2.5 py-1 text-[12px] font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            Edit
                          </button>
                          <RowMenu
                            rule={rule}
                            usage={usage}
                            onManageAliases={() => openEdit(rule, true)}
                            onToggleEnabled={() => {
                              if (rule.enabled) setDisableTarget({ rule, usage });
                              else {
                                const result = setMetricDefinitionEnabled({
                                  metricName: rule.metricName,
                                  enabled: true,
                                  actorName,
                                });
                                if (result.success) setToast(result.message);
                              }
                            }}
                            onDelete={() => setDeleteTarget({ rule, usage })}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {pageRows.map((rule) => {
              const usage = usageByMetric.get(rule.metricName)!;
              return (
                <article
                  key={rule.metricName}
                  className="rounded-xl border border-stone-200/70 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-medium text-stone-900">{rule.metricName}</p>
                      <p className="mt-0.5 text-[12px] text-stone-500">
                        {getMetricDescription(rule.metricName, rules)}
                      </p>
                    </div>
                    <StatusBadge active={rule.enabled} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-stone-600">
                    <TypeIcon type={rule.type ?? "currency"} />
                    <span>{displayUnit(rule.expectedUnit, rule.type)}</span>
                  </div>
                  <div className="mt-2">
                    <UsageCell usage={usage} />
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(rule)}
                      className="rounded-md border border-stone-200 px-2.5 py-1 text-[12px] font-semibold"
                    >
                      Edit
                    </button>
                    <RowMenu
                      rule={rule}
                      usage={usage}
                      onManageAliases={() => openEdit(rule, true)}
                      onToggleEnabled={() => {
                        if (rule.enabled) setDisableTarget({ rule, usage });
                        else {
                          const result = setMetricDefinitionEnabled({
                            metricName: rule.metricName,
                            enabled: true,
                            actorName,
                          });
                          if (result.success) setToast(result.message);
                        }
                      }}
                      onDelete={() => setDeleteTarget({ rule, usage })}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-stone-500">
              Showing {from} to {to} of {total} metrics
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-[12px] text-stone-500">
                Rows per page
                <select
                  value={pageSize}
                  onChange={(e) =>
                    setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])
                  }
                  className="rounded-md border border-stone-200 px-2 py-1.5 text-[12px]"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-stone-200 px-2.5 py-1.5 text-[12px] disabled:opacity-40"
              >
                Previous
              </button>
              {pageButtons.map((n, idx) => {
                const prev = pageButtons[idx - 1];
                const showEllipsis = prev != null && n - prev > 1;
                return (
                  <span key={n} className="inline-flex items-center gap-1">
                    {showEllipsis ? <span className="text-[12px] text-stone-400">…</span> : null}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={`min-w-[28px] rounded-md px-2 py-1.5 text-[12px] font-semibold ${
                        n === safePage
                          ? "bg-[#63202e] text-white"
                          : "border border-stone-200 text-stone-700"
                      }`}
                    >
                      {n}
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="rounded-md border border-stone-200 px-2.5 py-1.5 text-[12px] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <EditMetricDefinitionDrawer
        open={drawerMode != null}
        mode={drawerMode === "create" ? "create" : "edit"}
        rule={editRule}
        allRules={rules}
        focusAliases={focusAliases}
        onClose={() => {
          setDrawerMode(null);
          setEditRule(null);
          setFocusAliases(false);
        }}
        onSave={handleSaveDraft}
      />

      <MetricsConfigurationGuide
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        variant="extraction"
      />

      <ExtractionRulesAuditDrawer
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        events={state.portfolioAuditEvents ?? []}
      />

      {disableTarget ? (
        <ConfirmDialog
          title={`Disable ${disableTarget.rule.metricName}?`}
          onCancel={() => setDisableTarget(null)}
          confirmLabel="Disable metric"
          onConfirm={() => {
            const result = setMetricDefinitionEnabled({
              metricName: disableTarget.rule.metricName,
              enabled: false,
              actorName,
            });
            if (result.success) setToast(result.message);
            setDisableTarget(null);
          }}
        >
          <p>
            ICReady will stop using this definition in future extraction attempts. Existing
            extracted and approved values will remain unchanged.
          </p>
          <p className="mt-2 font-medium text-stone-800">
            Used by {disableTarget.usage.sectorCount} sectors and{" "}
            {disableTarget.usage.companyCount} companies.
          </p>
          {disableTarget.usage.hasActiveRequirements ? (
            <p className="mt-2 text-amber-800">
              This metric is still required by active reporting rules. Those requirements will
              remain configured but new PDF extraction will no longer search for this metric.
            </p>
          ) : null}
        </ConfirmDialog>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title={
            deleteTarget.usage.canDelete
              ? "Delete metric definition?"
              : "This definition cannot be deleted."
          }
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteConfirm("");
          }}
          confirmLabel={deleteTarget.usage.canDelete ? "Delete metric" : "Disable metric"}
          confirmDanger={deleteTarget.usage.canDelete}
          confirmDisabled={
            deleteTarget.usage.canDelete &&
            deleteConfirm.trim() !== deleteTarget.rule.metricName
          }
          onConfirm={() => {
            if (!deleteTarget.usage.canDelete) {
              setDeleteTarget(null);
              setDisableTarget(deleteTarget);
              setDeleteConfirm("");
              return;
            }
            const result = deleteMetricDefinition({
              metricName: deleteTarget.rule.metricName,
              actorName,
            });
            if (result.success) setToast(result.message);
            else setToast(result.message);
            setDeleteTarget(null);
            setDeleteConfirm("");
          }}
        >
          {deleteTarget.usage.canDelete ? (
            <>
              <p>
                This permanently removes the metric definition and its aliases. This action cannot
                be undone.
              </p>
              <label className="mt-3 block text-[12px] font-semibold text-stone-700">
                Type {deleteTarget.rule.metricName} to confirm
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-stone-200 px-3 py-2 text-sm font-normal"
                />
              </label>
            </>
          ) : (
            <>
              <p className="font-medium text-stone-800">{deleteTarget.usage.blockReason}</p>
              <p className="mt-2">Disable the metric instead to stop future extraction.</p>
            </>
          )}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

/** Shows how many packages and companies use a metric definition. */
function UsageCell({ usage }: { usage: MetricUsageSummary }) {
  if (usage.sectorCount === 0 && usage.companyCount === 0) {
    return <p className="text-[12px] text-stone-400">Not currently used</p>;
  }
  return (
    <div className="flex items-start gap-1.5 text-[12px] text-stone-600">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 shrink-0 text-stone-400"
        aria-hidden
      >
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
      <div>
        <p>
          {usage.sectorCount} sector{usage.sectorCount === 1 ? "" : "s"}
        </p>
        <p>
          {usage.companyCount} compan{usage.companyCount === 1 ? "y" : "ies"}
        </p>
      </div>
    </div>
  );
}

/** Dropdown menu for editing, enabling, or deleting one metric row. */
function RowMenu({
  rule,
  onManageAliases,
  onToggleEnabled,
  onDelete,
}: {
  rule: ExtractionRule;
  usage: MetricUsageSummary;
  onManageAliases: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`More actions for ${rule.metricName}`}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-800"
      >
        ···
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] hover:bg-stone-50"
            onClick={() => {
              setOpen(false);
              onManageAliases();
            }}
          >
            Manage aliases
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] hover:bg-stone-50"
            onClick={() => {
              setOpen(false);
              onToggleEnabled();
            }}
          >
            {rule.enabled ? "Disable metric" : "Enable metric"}
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[13px] text-red-700 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete metric
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Clickable column header that toggles table sorting. */
function HeaderBtn({
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
      className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-[12px] font-semibold text-[#7a3344] hover:bg-[#fdf2f4]"
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

/** Centered message when the extraction rules table has no rows to show. */
function EmptyState({
  title,
  copy,
  actionLabel,
  onAction,
}: {
  title: string;
  copy: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-stone-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{copy}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-4 rounded-md bg-[#63202e] px-3.5 py-2 text-[12px] font-semibold text-white"
      >
        {actionLabel}
      </button>
    </div>
  );
}

/** Popup that asks the user to confirm a destructive action. */
function ConfirmDialog({
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel,
  confirmDanger,
  confirmDisabled,
}: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDanger?: boolean;
  confirmDisabled?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/30"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
        <div className="mt-2 text-[13px] leading-relaxed text-stone-600">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-stone-200 px-3 py-2 text-[12px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className={`rounded-md px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-40 ${
              confirmDanger ? "bg-red-700 hover:bg-red-800" : "bg-[#63202e] hover:bg-[#7a3344]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
