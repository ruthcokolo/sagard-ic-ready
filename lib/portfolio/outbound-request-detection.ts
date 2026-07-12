import type { CompanyCommunication } from "./monitoring-phase-types";

/**
 * Detect open outbound requests that overlap with the metrics being requested.
 */
export function findOpenMissingMetricRequests(
  communications: CompanyCommunication[],
  input: {
    companyId: string;
    metricNames: string[];
    withinDays?: number;
  }
): CompanyCommunication[] {
  const withinMs = (input.withinDays ?? 14) * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const wanted = new Set(input.metricNames.map((n) => n.toLowerCase()));

  return communications.filter((c) => {
    if (c.companyId !== input.companyId) return false;
    if (c.type !== "missing_metrics_request") return false;
    if (c.status === "cancelled" || c.status === "closed") return false;
    if (c.status === "draft") return false;
    const when = new Date(c.sentAt ?? c.createdAt).getTime();
    if (Number.isFinite(when) && now - when > withinMs) return false;
    const requested = (c.requestedMetricNames ?? []).map((n) => n.toLowerCase());
    return requested.some((n) => wanted.has(n));
  });
}

export function describeDuplicateRequest(existing: CompanyCommunication[]): string {
  if (existing.length === 0) return "";
  const latest = existing[0];
  const metrics = (latest.requestedMetricNames ?? []).join(" and ");
  const when = latest.sentAt ?? latest.createdAt;
  const day = new Date(when).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `A request for ${metrics || "metrics"} was already sent to this company on ${day}.`;
}
