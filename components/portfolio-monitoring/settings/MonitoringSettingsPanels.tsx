"use client";

/**
 * Settings panels for portfolio monitoring preferences and expectations.
 */
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import {
  buildSectorDefaultExpectations,
  createCompanyOverride,
  getExpectedMetricsForCompany,
  SECTOR_METRIC_DEFAULTS,
} from "@/lib/portfolio/metric-expectations";
import { requirementLabel } from "@/lib/portfolio/metric-applicability";
import type { MetricRequirement } from "@/lib/portfolio/monitoring-phase-types";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";

/** Settings panel for default metric expectations. */
export function MetricExpectationSettingsPanel() {
  const { user } = useAuth();
  const { state, upsertMetricExpectation } = usePortfolio();
  const canEdit = hasPortfolioPermission(user?.role, "canEditMetricExpectations");
  const [sector, setSector] = useState(Object.keys(SECTOR_METRIC_DEFAULTS)[0]);
  const [companyId, setCompanyId] = useState(state.companies[0]?.id ?? "");

  const company = state.companies.find((c) => c.id === companyId);
  const expectations = state.metricExpectations ?? [];
  const companyRows = company
    ? getExpectedMetricsForCompany(expectations, company.id, company.sector)
    : buildSectorDefaultExpectations(sector);

  return (
    <section className="mt-4 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-900">Metric expectations</h2>
      <p className="mt-1 text-[12px] text-stone-500">
        Company overrides take precedence over sector defaults. AI suggestions never change rules
        automatically.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="text-[12px] text-stone-600">
          Sector view
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="mt-1 block rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
          >
            {Object.keys(SECTOR_METRIC_DEFAULTS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[12px] text-stone-600">
          Company view
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 block min-w-[200px] rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
          >
            <option value="">Sector defaults only</option>
            {state.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-100">
        {companyRows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-stone-800">{row.metricName}</p>
              <p className="text-[11px] text-stone-500">
                {requirementLabel(row.requirement)} ·{" "}
                {row.companyId ? "Company override" : "Sector default"} · {row.reasonSource}
              </p>
            </div>
            {canEdit && company ? (
              <select
                value={row.requirement}
                onChange={(e) =>
                  upsertMetricExpectation(
                    createCompanyOverride({
                      companyId: company.id,
                      metricName: String(row.metricName),
                      requirement: e.target.value as MetricRequirement,
                      reason: "Manual configuration",
                      configuredBy: user?.name ?? "Associate",
                    })
                  )
                }
                className="rounded-lg border border-stone-200 px-2 py-1 text-[12px]"
              >
                <option value="required">Require</option>
                <option value="optional">Optional</option>
                <option value="not_applicable">Not applicable</option>
                <option value="not_configured">Not configured</option>
              </select>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
