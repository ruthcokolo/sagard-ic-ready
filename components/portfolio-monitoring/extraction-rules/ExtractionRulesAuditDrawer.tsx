"use client";

import { useMemo, useState } from "react";
import type { PortfolioAuditEvent } from "@/lib/portfolio/monitoring-phase-types";

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
    case "metric_created":
      return "Metric created";
    case "metric_edited":
      return "Metric edited";
    case "alias_added":
      return "Alias added";
    case "alias_removed":
      return "Alias removed";
    case "metric_enabled":
      return "Metric enabled";
    case "metric_disabled":
      return "Metric disabled";
    case "metric_deleted":
      return "Metric deleted";
    default:
      return eventType.replace(/_/g, " ");
  }
}

export function ExtractionRulesAuditDrawer({
  open,
  onClose,
  events,
}: {
  open: boolean;
  onClose: () => void;
  events: PortfolioAuditEvent[];
}) {
  const [changeType, setChangeType] = useState("all");
  const [metricFilter, setMetricFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");

  const ruleEvents = useMemo(
    () => events.filter((e) => e.entityType === "extraction_rule"),
    [events]
  );

  const filtered = useMemo(() => {
    return ruleEvents.filter((e) => {
      if (changeType !== "all" && e.eventType !== changeType) return false;
      const metric = String(e.metadata?.metricName ?? "");
      if (metricFilter && !metric.toLowerCase().includes(metricFilter.toLowerCase())) {
        return false;
      }
      const actor = String(e.actorName ?? "");
      if (actorFilter && !actor.toLowerCase().includes(actorFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [ruleEvents, changeType, metricFilter, actorFilter]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/20"
        aria-label="Close audit history"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-stone-200 bg-white shadow-2xl sm:w-[min(480px,100vw)]">
        <header className="border-b border-stone-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold text-stone-900">
                Extraction rules audit history
              </h2>
              <p className="mt-1 text-[12px] text-stone-500">
                Immutable log of metric definition changes.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="rounded-md border border-stone-200 px-2.5 py-1.5 text-[12px]"
            >
              <option value="all">All changes</option>
              <option value="metric_created">Metric created</option>
              <option value="metric_edited">Metric edited</option>
              <option value="alias_added">Alias added</option>
              <option value="alias_removed">Alias removed</option>
              <option value="metric_enabled">Metric enabled</option>
              <option value="metric_disabled">Metric disabled</option>
              <option value="metric_deleted">Metric deleted</option>
            </select>
            <input
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              placeholder="Metric"
              className="min-w-[100px] flex-1 rounded-md border border-stone-200 px-2.5 py-1.5 text-[12px]"
            />
            <input
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Changed by"
              className="min-w-[100px] flex-1 rounded-md border border-stone-200 px-2.5 py-1.5 text-[12px]"
            />
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-500">No audit events match these filters.</p>
          ) : (
            filtered.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-stone-200 bg-[#faf9f7] p-3.5"
              >
                <p className="text-[13px] font-semibold text-stone-900">
                  {eventTitle(event.eventType)}
                </p>
                <p className="mt-1 text-[12px] text-stone-600">
                  {String(event.metadata?.metricName ?? "—")}
                  {event.metadata?.alias ? ` · ${String(event.metadata.alias)}` : ""}
                </p>
                {event.metadata?.previousName ? (
                  <p className="mt-1.5 text-[12px] text-stone-800">
                    {String(event.metadata.previousName)} →{" "}
                    {String(event.metadata.metricName)}
                  </p>
                ) : null}
                <p className="mt-2 text-[11px] text-stone-500">
                  Changed by {event.actorName ?? "Unknown"} · {formatWhen(event.timestamp)}
                </p>
              </article>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
