"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { suggestMetricApplicability } from "@/lib/portfolio/metric-applicability";
import { createCompanyOverride } from "@/lib/portfolio/metric-expectations";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";
import {
  CompanyMessageComposer,
  MissingMetricCard,
} from "@/components/portfolio-monitoring/communications/MissingMetricFollowUp";

export function MetricApplicabilitySuggestionCard({
  companyId,
  companyName,
  sector,
  metricName,
  onDismiss,
}: {
  companyId: string;
  companyName: string;
  sector: string;
  metricName: string;
  onDismiss?: () => void;
}) {
  const { user } = useAuth();
  const { state, upsertMetricExpectation } = usePortfolio();
  const canConfirm = hasPortfolioPermission(user?.role, "canConfirmMetricApplicability");
  const suggestion = suggestMetricApplicability({
    companyId,
    companyName,
    sector,
    metricName,
    found: false,
    expectations: state.metricExpectations ?? [],
  });

  if (!suggestion || suggestion.suggestion === "missing_required") return null;
  if (suggestion.suggestion !== "possibly_not_applicable" && suggestion.suggestion !== "not_configured") {
    return null;
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-stone-900">
        {metricName} may not be applicable to {companyName}
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-stone-600">{suggestion.rationale}</p>
      <p className="mt-2 text-[11px] text-stone-500">
        AI suggestion · {suggestion.confidence} confidence
      </p>
      <p className="mt-1 text-[11px] italic text-stone-400">
        AI suggestion only. Confirm before updating reporting expectations.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => {
            upsertMetricExpectation(
              createCompanyOverride({
                companyId,
                metricName,
                requirement: "not_applicable",
                reason: suggestion.rationale,
                configuredBy: user?.name ?? "Associate",
              })
            );
            onDismiss?.();
          }}
          className="rounded-lg bg-[#63202e] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
        >
          Confirm not applicable
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => {
            upsertMetricExpectation(
              createCompanyOverride({
                companyId,
                metricName,
                requirement: "required",
                reason: "Associate required metric despite AI suggestion",
                configuredBy: user?.name ?? "Associate",
              })
            );
            onDismiss?.();
          }}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700 disabled:opacity-40"
        >
          Require this metric
        </button>
        <button
          type="button"
          onClick={() => onDismiss?.()}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700"
        >
          Dismiss suggestion
        </button>
      </div>
    </div>
  );
}

export function MissingMetricFollowUpSection({
  companyId,
  companyName,
  sector,
  metricName,
  reportPeriod,
  packageId,
  reportName,
  status,
  reason,
}: {
  companyId: string;
  companyName: string;
  sector: string;
  metricName: string;
  reportPeriod: string;
  packageId?: string;
  reportName?: string;
  status: string;
  reason: string;
}) {
  const { user } = useAuth();
  const { upsertMetricExpectation } = usePortfolio();
  const [composerOpen, setComposerOpen] = useState(false);
  const [dismissedAi, setDismissedAi] = useState(false);
  const canSend = hasPortfolioPermission(user?.role, "canSendCompanyMessages");
  const showMissingCard = status === "Missing from report";
  const showAi =
    !dismissedAi &&
    (status === "Missing from report" ||
      status === "Not configured" ||
      status === "Optional metric not reported");

  return (
    <div className="space-y-3">
      {showMissingCard ? (
        <MissingMetricCard
          companyId={companyId}
          companyName={companyName}
          metricName={metricName}
          reportPeriod={reportPeriod}
          packageId={packageId}
          reportName={reportName}
          reason={reason}
          onRequest={() => {
            if (!canSend) return;
            setComposerOpen(true);
          }}
          onMarkNotApplicable={() => {
            upsertMetricExpectation(
              createCompanyOverride({
                companyId,
                metricName,
                requirement: "not_applicable",
                reason: "Marked not applicable from Metric Review",
                configuredBy: user?.name ?? "Associate",
              })
            );
          }}
        />
      ) : null}
      {showAi ? (
        <MetricApplicabilitySuggestionCard
          companyId={companyId}
          companyName={companyName}
          sector={sector}
          metricName={metricName}
          onDismiss={() => setDismissedAi(true)}
        />
      ) : null}
      <CompanyMessageComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        companyId={companyId}
        companyName={companyName}
        packageId={packageId}
        reportPeriod={reportPeriod}
        reportName={reportName}
        missingMetrics={[metricName]}
      />
    </div>
  );
}
