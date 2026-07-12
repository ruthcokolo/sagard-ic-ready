/**
 * Read and write Metric Review page URL parameters (filters, scope, selected company).
 * Keeps bookmarkable links in sync with the review landing and workspace views.
 */

import type { LandingFilters, LandingScopeTab, LandingSort } from "./metric-review-landing-selectors";
import { DEFAULT_LANDING_FILTERS } from "./metric-review-landing-selectors";
import type { ReviewQueueFilters } from "./metric-review-selectors";
import { DEFAULT_REVIEW_FILTERS } from "./metric-review-selectors";

export const METRIC_REVIEW_PATH = "/dashboard/portfolio/metric-review";

export type MetricReviewUrlState = {
  scope: LandingScopeTab;
  landingFilters: LandingFilters;
  landingSort: LandingSort;
  page: number;
  companyId: string | null;
  packageId: string | null;
  metricId: string | null;
};

const SCOPE_MAP: Record<string, LandingScopeTab> = {
  assigned: "assigned",
  "assigned-to-me": "assigned",
  all: "all",
  "all-companies": "all",
  needsAttention: "needsAttention",
  "needs-attention": "needsAttention",
  completed: "completed",
};

const SCOPE_TO_PARAM: Record<LandingScopeTab, string> = {
  assigned: "assigned-to-me",
  all: "all-companies",
  needsAttention: "needs-attention",
  completed: "completed",
};

function opt(value: string | null | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

/** Parse the browser URL into Metric Review filter and selection state. */
export function parseMetricReviewSearchParams(
  search: string | URLSearchParams
): MetricReviewUrlState {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;

  const scopeKey = params.get("scope") ?? "assigned-to-me";
  const scope = SCOPE_MAP[scopeKey] ?? "assigned";

  const landingFilters: LandingFilters = {
    ...DEFAULT_LANDING_FILTERS,
    search: params.get("q") ?? params.get("search") ?? "",
    sector: opt(params.get("sector"), "all"),
    period: opt(params.get("period"), "all"),
    status: opt(params.get("status"), "all"),
    confidence: (() => {
      const raw = (params.get("confidence") ?? "all").toLowerCase();
      if (raw === "low") return "Low";
      if (raw === "medium") return "Medium";
      if (raw === "high") return "High";
      return "all";
    })(),
    myQueueOnly: params.get("myQueue") === "1",
    priority: opt(params.get("priority"), "all"),
    reviewer: opt(params.get("reviewer"), "all"),
    overdueOnly: params.get("overdue") === "1",
    extractionFailuresOnly: params.get("extractionFailed") === "1",
    missingReportOnly: params.get("missingReport") === "1",
    unassignedOnly: params.get("unassigned") === "1",
    waitlistedOnly: params.get("waitlisted") === "1",
    hasRejectedMetrics: params.get("rejected") === "1",
    hasEditedMetrics: params.get("edited") === "1",
  };

  const sortParam = params.get("sort") ?? "priority";
  const landingSort = (
    [
      "priority",
      "dueDate",
      "companyName",
      "mostProgress",
      "leastProgress",
      "recentlyProcessed",
    ] as LandingSort[]
  ).includes(sortParam as LandingSort)
    ? (sortParam as LandingSort)
    : "priority";

  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  return {
    scope,
    landingFilters,
    landingSort,
    page,
    companyId: params.get("companyId") ?? params.get("company"),
    packageId: params.get("packageId") ?? params.get("package"),
    metricId: params.get("metricId") ?? params.get("metric"),
  };
}

/** Build URL search params from the current Metric Review UI state. */
export function buildMetricReviewSearchParams(input: {
  scope: LandingScopeTab;
  landingFilters: LandingFilters;
  landingSort: LandingSort;
  page: number;
  companyId?: string | null;
  packageId?: string | null;
  metricId?: string | null;
}): URLSearchParams {
  const params = new URLSearchParams();
  const { landingFilters: f } = input;

  params.set("scope", SCOPE_TO_PARAM[input.scope]);
  if (f.search.trim()) params.set("q", f.search.trim());
  if (f.sector !== "all") params.set("sector", f.sector);
  if (f.period !== "all") params.set("period", f.period);
  if (f.status !== "all") params.set("status", f.status);
  if (f.confidence !== "all") params.set("confidence", f.confidence.toLowerCase());
  if (f.myQueueOnly) params.set("myQueue", "1");
  if (f.priority !== "all") params.set("priority", f.priority);
  if (f.reviewer !== "all") params.set("reviewer", f.reviewer);
  if (f.overdueOnly) params.set("overdue", "1");
  if (f.extractionFailuresOnly) params.set("extractionFailed", "1");
  if (f.missingReportOnly) params.set("missingReport", "1");
  if (f.unassignedOnly) params.set("unassigned", "1");
  if (f.waitlistedOnly) params.set("waitlisted", "1");
  if (f.hasRejectedMetrics) params.set("rejected", "1");
  if (f.hasEditedMetrics) params.set("edited", "1");
  if (input.landingSort !== "priority") params.set("sort", input.landingSort);
  if (input.page > 1) params.set("page", String(input.page));
  if (input.companyId) params.set("companyId", input.companyId);
  if (input.packageId) params.set("packageId", input.packageId);
  if (input.metricId) params.set("metricId", input.metricId);

  return params;
}

/** Build a full path + query string link to Metric Review with the given state. */
export function metricReviewHref(input: {
  scope: LandingScopeTab;
  landingFilters: LandingFilters;
  landingSort: LandingSort;
  page: number;
  companyId?: string | null;
  packageId?: string | null;
  metricId?: string | null;
}): string {
  const params = buildMetricReviewSearchParams(input);
  const qs = params.toString();
  return qs ? `${METRIC_REVIEW_PATH}?${qs}` : METRIC_REVIEW_PATH;
}

/** Map landing filters into the workspace queue filter shape.
 *  Only user-selected landing filters (and Assigned → current assignee) carry over —
 *  never a hardcoded scope chip like "Assigned to me" / "All companies".
 */
export function landingToQueueFilters(
  scope: LandingScopeTab,
  landing: LandingFilters,
  currentReviewerName?: string
): ReviewQueueFilters {
  let status = "all";
  let reviewer = landing.reviewer;
  let extractionFailuresOnly = landing.extractionFailuresOnly;

  if (landing.status !== "all") {
    if (landing.status === "Completed") {
      status = "Completed";
    } else if (landing.status === "Extraction failed") {
      extractionFailuresOnly = true;
      status = "Failed";
    } else if (
      landing.status === "Needs attention" ||
      landing.status === "In review" ||
      landing.status === "Awaiting assignment"
    ) {
      status = "Needs validation";
    }
  } else if (scope === "completed") {
    status = "Completed";
  } else if (scope === "needsAttention") {
    status = "Needs validation";
  }

  if (
    (scope === "assigned" || landing.myQueueOnly) &&
    reviewer === "all" &&
    currentReviewerName
  ) {
    reviewer = currentReviewerName;
  }

  return {
    ...DEFAULT_REVIEW_FILTERS,
    search: landing.search,
    sector: landing.sector,
    period: landing.period,
    status,
    confidence: landing.confidence === "all" ? "all" : landing.confidence,
    reviewer,
    overdueOnly: landing.overdueOnly,
    extractionFailuresOnly,
    quickView: "all",
  };
}

/** Count how many non-default filters are active in the review workspace. */
export function countActiveQueueFilters(filters: ReviewQueueFilters): number {
  let n = 0;
  if (filters.search.trim()) n += 1;
  if (filters.sector !== "all") n += 1;
  if (filters.period !== "all") n += 1;
  if (filters.status !== "all") n += 1;
  if (filters.confidence !== "all") n += 1;
  if (filters.reviewer !== "all") n += 1;
  if (filters.overdueOnly) n += 1;
  if (filters.extractionFailuresOnly) n += 1;
  if (filters.quickView && filters.quickView !== "all") n += 1;
  return n;
}

/** Build short text chips summarizing active workspace filters for the UI. */
export function queueFilterSummaryChips(filters: ReviewQueueFilters): string[] {
  const chips: string[] = [];
  if (filters.search.trim()) chips.push(`“${filters.search.trim()}”`);
  if (filters.period !== "all") chips.push(filters.period);
  if (filters.confidence !== "all") chips.push(`${filters.confidence} confidence`);
  if (filters.reviewer !== "all") {
    chips.push(filters.reviewer === "unassigned" ? "Unassigned" : filters.reviewer);
  }
  if (filters.overdueOnly) chips.push("Overdue only");
  if (filters.extractionFailuresOnly) chips.push("Extraction failures");
  if (filters.sector !== "all") chips.push(filters.sector);
  if (filters.status !== "all") chips.push(filters.status);
  if (filters.quickView === "remaining") chips.push("Remaining");
  if (filters.quickView === "in-review") chips.push("In review");
  if (filters.quickView === "blocked") chips.push("Blocked");
  if (filters.quickView === "completed") chips.push("Completed");
  return chips;
}
