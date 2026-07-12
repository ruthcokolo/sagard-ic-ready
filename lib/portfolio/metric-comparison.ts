import type { ExtractedMetric, MetricName } from "./types";

export type MetricChangeDirection = "up" | "down" | "flat";

export type MetricChange = {
  metricName: MetricName;
  label: string;
  direction: MetricChangeDirection;
  /** Display string, e.g. "↑ 12%" or "+28" */
  display: string;
};

type ParsedPeriod =
  | { kind: "quarter"; quarter: number; year: number; raw: string }
  | { kind: "fy"; year: number; raw: string };

function parsePeriod(period: string): ParsedPeriod | null {
  const q = period.match(/^Q([1-4])\s*(20\d{2})$/i);
  if (q) {
    return {
      kind: "quarter",
      quarter: Number(q[1]),
      year: Number(q[2]),
      raw: period,
    };
  }
  const fy = period.match(/^FY\s*(20\d{2})$/i);
  if (fy) {
    return { kind: "fy", year: Number(fy[1]), raw: period };
  }
  return null;
}

function periodSortKey(period: string): number {
  const parsed = parsePeriod(period);
  if (!parsed) return 0;
  if (parsed.kind === "fy") return parsed.year * 10 + 5;
  return parsed.year * 10 + parsed.quarter;
}

function arePeriodsComparable(current: string, previous: string): boolean {
  const a = parsePeriod(current);
  const b = parsePeriod(previous);
  if (!a || !b) return false;
  if (a.kind !== b.kind) return false;
  return true;
}

function getPreviousPeriod(period: string): string | null {
  const parsed = parsePeriod(period);
  if (!parsed) return null;
  if (parsed.kind === "fy") {
    return `FY ${parsed.year - 1}`;
  }
  if (parsed.quarter === 1) {
    return `Q4 ${parsed.year - 1}`;
  }
  return `Q${parsed.quarter - 1} ${parsed.year}`;
}

function unitsCompatible(a: string, b: string): boolean {
  const norm = (u: string) => u.trim().toLowerCase().replace(/\s+/g, "");
  const ua = norm(a);
  const ub = norm(b);
  if (ua === ub) return true;
  const currency = ["usd", "$", "usdm", "million", "millions", "m"];
  const count = ["count", "employees", "people", "fte", "headcount", ""];
  const pct = ["%", "percent", "percentage"];
  const inGroup = (u: string, group: string[]) => group.some((g) => u.includes(g) || g === u);
  if (inGroup(ua, currency) && inGroup(ub, currency)) return true;
  if (inGroup(ua, count) && inGroup(ub, count)) return true;
  if (inGroup(ua, pct) && inGroup(ub, pct)) return true;
  return false;
}

function formatCurrencyDelta(delta: number): string {
  const abs = Math.abs(delta);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(1)}K`;
  return `$${abs.toFixed(0)}`;
}

function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) return "—";
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(pct);
  if (rounded === 0) return "flat";
  return `${Math.abs(rounded)}%`;
}

function buildChangeLabel(
  metricName: MetricName,
  current: ExtractedMetric,
  previous: ExtractedMetric
): MetricChange | null {
  const cur = current.normalizedValue;
  const prev = previous.normalizedValue;
  if (cur == null || prev == null) return null;
  if (!unitsCompatible(current.unit, previous.unit)) return null;

  const unitLower = current.unit.toLowerCase();
  const isPercent = unitLower.includes("%") || metricName === "Churn";
  const isCount = metricName === "Headcount" || unitLower.includes("count");

  if (isPercent) {
    const delta = cur - prev;
    const direction: MetricChangeDirection =
      delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat";
    if (direction === "flat") return null;
    const arrow = direction === "up" ? "↑" : "↓";
    return {
      metricName,
      label: metricName,
      direction,
      display: `${arrow} ${Math.abs(Math.round(delta * 10) / 10)} pts`,
    };
  }

  if (isCount) {
    const delta = Math.round(cur - prev);
    if (delta === 0) return null;
    const direction: MetricChangeDirection = delta > 0 ? "up" : "down";
    const sign = delta > 0 ? "+" : "";
    return {
      metricName,
      label: metricName,
      direction,
      display: `${sign}${delta}`,
    };
  }

  const delta = cur - prev;
  const pctStr = formatPercentChange(cur, prev);
  if (pctStr === "—" || pctStr === "flat") return null;
  const direction: MetricChangeDirection = delta > 0 ? "up" : "down";
  const arrow = direction === "up" ? "↑" : "↓";
  const absDelta = formatCurrencyDelta(delta);
  return {
    metricName,
    label: metricName,
    direction,
    display: `${arrow} ${pctStr}`,
  };
}

/** Approved comparable metrics only — current vs previous sequential period. */
export function getApprovedMetricChanges(
  metrics: ExtractedMetric[],
  companyId: string,
  currentPeriod: string,
  limit = 3
): MetricChange[] {
  const previousPeriod = getPreviousPeriod(currentPeriod);
  if (!previousPeriod || !arePeriodsComparable(currentPeriod, previousPeriod)) {
    return [];
  }

  const approved = metrics.filter(
    (m) =>
      m.companyId === companyId &&
      m.status === "Approved for reporting" &&
      m.normalizedValue != null
  );

  const changes: MetricChange[] = [];

  for (const metricName of ["Revenue", "ARR", "EBITDA", "Cash", "Headcount", "Churn"] as MetricName[]) {
    const current = approved
      .filter((m) => m.metricName === metricName && m.reportPeriod === currentPeriod)
      .sort((a, b) => new Date(b.reviewedAt ?? 0).getTime() - new Date(a.reviewedAt ?? 0).getTime())[0];
    const previous = approved
      .filter((m) => m.metricName === metricName && m.reportPeriod === previousPeriod)
      .sort((a, b) => new Date(b.reviewedAt ?? 0).getTime() - new Date(a.reviewedAt ?? 0).getTime())[0];

    if (!current || !previous) continue;

    const change = buildChangeLabel(metricName, current, previous);
    if (change) changes.push(change);
  }

  return changes.slice(0, limit);
}

export function getAllApprovedMetricChanges(
  metrics: ExtractedMetric[],
  companyId: string,
  currentPeriod: string
): MetricChange[] {
  const previousPeriod = getPreviousPeriod(currentPeriod);
  if (!previousPeriod) return [];
  return getApprovedMetricChanges(metrics, companyId, currentPeriod, 99);
}

export { periodSortKey, getPreviousPeriod, arePeriodsComparable };
