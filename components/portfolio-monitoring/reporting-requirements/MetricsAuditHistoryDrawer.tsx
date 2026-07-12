"use client";

import { useMemo, useState } from "react";
import type { PortfolioAuditEvent } from "@/lib/portfolio/monitoring-phase-types";
import { requirementLabel } from "@/lib/portfolio/metric-applicability";
import type { MetricRequirement } from "@/lib/portfolio/monitoring-phase-types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function eventTitle(eventType: string) {
  switch (eventType) {
    case "company_override_created":
      return "Company override created";
    case "company_override_updated":
      return "Company override changed";
    case "company_override_removed":
      return "Company override removed";
    case "sector_requirement_updated":
      return "Sector requirement updated";
    case "ai_suggestion_confirmed":
      return "AI suggestion confirmed";
    case "ai_suggestion_dismissed":
      return "AI suggestion dismissed";
    case "metric_expectation_changed":
      return "Requirement changed";
    default:
      return eventType.replace(/_/g, " ");
  }
}

function reqLabel(value: unknown) {
  if (typeof value !== "string") return "—";
  try {
    return requirementLabel(value as MetricRequirement);
  } catch {
    return value;
  }
}

export function MetricsAuditHistoryDrawer({
  open,
  onClose,
  events,
  companyNameById,
}: {
  open: boolean;
  onClose: () => void;
  events: PortfolioAuditEvent[];
  companyNameById: Record<string, string>;
}) {
  const [changeType, setChangeType] = useState("all");
  const [metricFilter, setMetricFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");

  const expectationEvents = useMemo(
    () => events.filter((e) => e.entityType === "expectation"),
    [events]
  );

  const filtered = useMemo(() => {
    return expectationEvents.filter((e) => {
      if (changeType !== "all" && e.eventType !== changeType) return false;
      const metric = String(e.metadata?.metricName ?? "");
      if (metricFilter && !metric.toLowerCase().includes(metricFilter.toLowerCase())) {
        return false;
      }
      const companyId = e.metadata?.companyId ? String(e.metadata.companyId) : "";
      const companyName = companyId ? companyNameById[companyId] ?? "" : "";
      if (
        companyFilter &&
        !companyName.toLowerCase().includes(companyFilter.toLowerCase()) &&
        !companyId.toLowerCase().includes(companyFilter.toLowerCase())
      ) {
        return false;
      }
      const sector = String(e.metadata?.sector ?? "");
      if (sectorFilter && !sector.toLowerCase().includes(sectorFilter.toLowerCase())) {
        return false;
      }
      const actor = String(e.actorName ?? "");
      if (actorFilter && !actor.toLowerCase().includes(actorFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [
    expectationEvents,
    changeType,
    metricFilter,
    companyFilter,
    sectorFilter,
    actorFilter,
    companyNameById,
  ]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/20"
        aria-label="Close audit history"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(480px,100vw)] flex-col border-l border-stone-200 bg-white shadow-2xl">
        <header className="border-b border-stone-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold text-stone-900">
                Metrics configuration audit history
              </h2>
              <p className="mt-1 text-[12px] text-stone-500">
                Immutable log of requirement changes.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="all">All changes</option>
              <option value="company_override_created">Company override created</option>
              <option value="company_override_updated">Company override changed</option>
              <option value="company_override_removed">Company override removed</option>
              <option value="sector_requirement_updated">Sector requirement updated</option>
              <option value="ai_suggestion_confirmed">AI suggestion confirmed</option>
              <option value="ai_suggestion_dismissed">AI suggestion dismissed</option>
              <option value="metric_expectation_changed">Legacy expectation change</option>
            </select>
            <input
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              placeholder="Metric"
              className="min-w-[100px] flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
            />
            <input
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              placeholder="Company"
              className="min-w-[100px] flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
            />
            <input
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              placeholder="Sector"
              className="min-w-[100px] flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
            />
            <input
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Changed by"
              className="min-w-[100px] flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
            />
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-500">No audit events match these filters.</p>
          ) : (
            filtered.map((event) => {
              const metric = String(event.metadata?.metricName ?? "—");
              const companyId = event.metadata?.companyId
                ? String(event.metadata.companyId)
                : undefined;
              const company = companyId ? companyNameById[companyId] : undefined;
              const sector = event.metadata?.sector
                ? String(event.metadata.sector)
                : undefined;
              const prev = reqLabel(event.metadata?.previousRequirement);
              const next = reqLabel(
                event.metadata?.requirement ?? event.metadata?.newRequirement
              );
              const reason = event.metadata?.rationale
                ? String(event.metadata.rationale)
                : event.metadata?.previousRationale
                  ? String(event.metadata.previousRationale)
                  : null;

              return (
                <article
                  key={event.id}
                  className="rounded-xl border border-stone-150 border-stone-200 bg-[#faf9f7] p-3.5"
                >
                  <p className="text-[13px] font-semibold text-stone-900">
                    {eventTitle(event.eventType)}
                  </p>
                  <p className="mt-1 text-[12px] text-stone-600">
                    {[company, sector, metric].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1.5 text-[12px] text-stone-800">
                    {prev} → {next}
                  </p>
                  <p className="mt-2 text-[11px] text-stone-500">
                    Changed by {event.actorName ?? "Unknown"} · {formatWhen(event.timestamp)}
                  </p>
                  {reason ? (
                    <p className="mt-2 text-[12px] text-stone-700">
                      <span className="font-medium">Reason:</span> {reason}
                    </p>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}

export function MetricRequirementHistoryDrawer({
  open,
  onClose,
  metricName,
  companyId,
  companyName,
  sectorKey,
  events,
}: {
  open: boolean;
  onClose: () => void;
  metricName: string;
  companyId?: string;
  companyName?: string;
  sectorKey?: string;
  events: PortfolioAuditEvent[];
}) {
  const rows = useMemo(
    () =>
      events.filter((e) => {
        if (e.entityType !== "expectation") return false;
        if (String(e.metadata?.metricName ?? "").toLowerCase() !== metricName.toLowerCase()) {
          return false;
        }
        if (companyId) {
          return String(e.metadata?.companyId ?? "") === companyId;
        }
        if (sectorKey) {
          return (
            !e.metadata?.companyId &&
            String(e.metadata?.sector ?? "").toLowerCase() === sectorKey.toLowerCase()
          );
        }
        return false;
      }),
    [events, metricName, companyId, sectorKey]
  );

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/20"
        aria-label="Close history"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(400px,100vw)] flex-col border-l border-stone-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-stone-900">{metricName} change history</h2>
            <p className="mt-1 text-[12px] text-stone-500">{companyName ?? sectorKey}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100"
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {rows.length === 0 ? (
            <p className="text-sm text-stone-500">No change history for this metric yet.</p>
          ) : (
            rows.map((event) => (
              <article key={event.id} className="rounded-xl border border-stone-200 bg-[#faf9f7] p-3.5">
                <p className="text-[13px] font-semibold text-stone-900">
                  {eventTitle(event.eventType)}
                </p>
                <p className="mt-1 text-[12px] text-stone-800">
                  {reqLabel(event.metadata?.previousRequirement)} →{" "}
                  {reqLabel(event.metadata?.requirement ?? event.metadata?.newRequirement)}
                </p>
                <p className="mt-2 text-[11px] text-stone-500">
                  Changed by {event.actorName ?? "Unknown"} · {formatWhen(event.timestamp)}
                </p>
                {event.metadata?.rationale ? (
                  <p className="mt-2 text-[12px] text-stone-700">
                    Reason: {String(event.metadata.rationale)}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
