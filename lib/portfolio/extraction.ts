import type {
  ConfidenceLevel,
  ExtractionCandidate,
  ExtractionRule,
  PageText,
} from "./types";
import { parseValueFromSegment } from "./extraction-parse";
import { extractMetricEvidenceSentence } from "./pdf-text";
import {
  extractMetricsFromTemplatePages,
  isIcReadyTemplateDocument,
} from "./template-extraction";

type ParsedValue = {
  raw: string;
  normalized: number | null;
  unit: string;
};

type RawMatch = {
  metricName: string;
  matchedLabel: string;
  alias: string;
  line: string;
  value: ParsedValue;
  sourcePage: number;
  afterLabel: boolean;
  immediate: boolean;
};

const LINE_SEP = /\r?\n+/;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isDeprioritizedContext(text: string): boolean {
  return /\b(prior period|prior quarter|prior year|previous|forecast|projection|outlook|raised the|fy\s*20\d{2}\s+(?:revenue\s+)?outlook|for reference|for comparison|historical|not actual|approximately|management expects|projected|budget(?:ed)?|plan(?:ned)?)\b/i.test(
    text
  );
}

/** Lines that declare a metric absent / N/A must not yield a numeric extraction. */
function isNotApplicableMetricLine(text: string): boolean {
  return /\b(not applicable|n\/?a|not a (?:primary )?kpi|intentionally omitted|omitted from|does not apply|not used for|not disclosed|not provided|pending)\b/i.test(
    text
  );
}

/** Neighbor value lines that belong to a different metric must not bind. */
function neighborHasForeignMetricLabel(neighbor: string, rule: ExtractionRule): boolean {
  const foreign = [
    "revenue",
    "arr",
    "annual recurring",
    "ebitda",
    "cash",
    "headcount",
    "employee",
    "churn",
    "debt",
    "noi",
    "occupancy",
    "aum",
  ];
  const lower = neighbor.toLowerCase();
  const own = rule.aliases.map((a) => a.toLowerCase());
  return foreign.some((label) => {
    if (!new RegExp(`\\b${escapeRegex(label)}\\b`, "i").test(lower)) return false;
    return !own.some((a) => a.includes(label) || label.includes(a.split(/\s+/)[0] ?? ""));
  });
}

function matchContextWindow(line: string, aliasIndex: number, aliasLength: number): string {
  const windowStart = Math.max(0, aliasIndex - 35);
  const windowEnd = Math.min(line.length, aliasIndex + aliasLength + 45);
  return line.slice(windowStart, windowEnd);
}

/** Strip filler words between label and value, e.g. "reached", "of", "was". */
function valueSegmentAfterLabel(line: string, aliasEndIndex: number): string {
  let segment = line.slice(aliasEndIndex);
  segment = segment.replace(/^[\s:—–\-]+/, "");
  segment = segment.replace(/^(?:was|is|of|at|reached|totaled|totalling|approximately|about)\s+/i, "");
  return segment;
}

function findAliasInLine(line: string, alias: string): { index: number; length: number } | null {
  const pattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
  const match = pattern.exec(line);
  if (!match) return null;
  return { index: match.index, length: match[0].length };
}

function formatEvidence(
  matchedLabel: string,
  value: ParsedValue,
  line: string,
  alias?: string
): string {
  const normalized = line.trim().replace(/\s+/g, " ");
  const anchorText = alias ?? matchedLabel.split(/\s+/).slice(-2).join(" ");
  const anchorIndex = normalized.toLowerCase().indexOf(anchorText.toLowerCase());
  const source = anchorIndex >= 0 ? normalized.slice(anchorIndex) : normalized;
  return extractMetricEvidenceSentence(source, matchedLabel, value.raw);
}

function scoreMatch(match: RawMatch, reportPeriod?: string): number {
  const aliasIdx = match.line.toLowerCase().indexOf(match.alias.toLowerCase());
  const context = matchContextWindow(
    match.line,
    aliasIdx >= 0 ? aliasIdx : 0,
    match.alias.length
  );
  if (isDeprioritizedContext(context) || isDeprioritizedContext(match.line)) return -40;

  let score = 0;
  if (match.immediate) score += 4;
  if (match.afterLabel) score += 3;
  if (/\bQ[1-4]\s*20\d{2}\s+actual\b/i.test(match.line)) score += 8;
  if (/\bQ[1-4]\s*REVENUE\b/i.test(match.line) && match.metricName === "Revenue") score += 10;
  if (/\b(actual|reported)\b/i.test(match.line) && !/\b(forecast|outlook|budget)\b/i.test(match.line)) {
    score += 4;
  }
  if (/\b(fy\s*20\d{2}\s+forecast|forecast|outlook|management expects|projected|budget)\b/i.test(match.line)) {
    score -= 12;
  }
  if (
    /:/.test(
      match.line.slice(0, (aliasIdx >= 0 ? aliasIdx : 0) + match.alias.length + 3)
    )
  ) {
    score += 2;
  }
  if (match.value.raw.startsWith("$")) score += 1;
  if (reportPeriod && new RegExp(escapeRegex(reportPeriod), "i").test(match.line)) {
    score += 5;
  }
  if (/\b(actual|Q[1-4]\s*2026)\b/i.test(match.line)) score += 2;
  // Prefer short KPI-card style lines over long narrative sentences.
  if (match.line.length < 60) score += 3;
  if (match.line.length > 140) score -= 4;
  return score;
}

function confidenceForMatches(matches: RawMatch[], reportPeriod?: string): ConfidenceLevel {
  if (matches.length === 0) return "Low";
  if (matches.length === 1) {
    const m = matches[0];
    if (m.immediate && m.afterLabel) return "High";
    if (m.afterLabel) return "Medium";
    return "Low";
  }
  const scores = matches.map((m) => scoreMatch(m, reportPeriod));
  const max = Math.max(...scores);
  const tied = scores.filter((s) => s === max).length;
  if (tied > 1) return "Low";
  return max >= 8 ? "Medium" : "Low";
}

function pickBestMatch(matches: RawMatch[], reportPeriod?: string): RawMatch {
  return matches.reduce((best, current) =>
    scoreMatch(current, reportPeriod) > scoreMatch(best, reportPeriod) ? current : best
  );
}

function extractFromLine(
  line: string,
  rule: ExtractionRule,
  page: number
): RawMatch[] {
  const results: RawMatch[] = [];
  const sortedAliases = [...rule.aliases].sort((a, b) => b.length - a.length);
  const usedSpans: Array<{ start: number; end: number }> = [];

  for (const alias of sortedAliases) {
    const found = findAliasInLine(line, alias);
    if (!found) continue;

    const overlaps = usedSpans.some(
      (span) => !(found.index + found.length <= span.start || found.index >= span.end)
    );
    if (overlaps) continue;

    const segment = valueSegmentAfterLabel(line, found.index + found.length);
    if (isDeprioritizedContext(matchContextWindow(line, found.index, found.length))) continue;
    if (isDeprioritizedContext(line)) continue;
    if (isNotApplicableMetricLine(line)) continue;
    const value = parseValueFromSegment(segment, rule.metricName);
    if (!value) continue;
    // "ARR: Not applicable" / dashed cells must never become a dollar amount.
    if (isNotApplicableMetricLine(segment)) continue;

    const labelStart = Math.max(0, found.index - 30);
    const matchedLabel = line.slice(labelStart, found.index + found.length).trim();
    const colonBeforeValue = /^[\s]*:/.test(line.slice(found.index + found.length));
    const valueDistance = segment.indexOf(value.raw);
    const immediate = colonBeforeValue || (valueDistance >= 0 && valueDistance <= 12);

    results.push({
      metricName: rule.metricName,
      matchedLabel: matchedLabel || alias,
      alias,
      line,
      value,
      sourcePage: page,
      afterLabel: true,
      immediate,
    });

    usedSpans.push({ start: found.index, end: found.index + found.length });
  }

  return results;
}

/**
 * KPI cards often place the label on one line and the currency value on the next.
 * Bind aliases without an on-line value to nearby value-only lines.
 */
function extractAdjacentLineMatches(
  lines: string[],
  index: number,
  rule: ExtractionRule,
  page: number
): RawMatch[] {
  const line = lines[index];
  const results: RawMatch[] = [];
  const sortedAliases = [...rule.aliases].sort((a, b) => b.length - a.length);

  for (const alias of sortedAliases) {
    const found = findAliasInLine(line, alias);
    if (!found) continue;
    if (isDeprioritizedContext(line)) continue;
    if (isNotApplicableMetricLine(line)) continue;

    const sameLineSegment = valueSegmentAfterLabel(line, found.index + found.length);
    if (parseValueFromSegment(sameLineSegment, rule.metricName)) continue;
    if (isNotApplicableMetricLine(sameLineSegment)) continue;

    const neighbors = [lines[index + 1], lines[index - 1], lines[index + 2]].filter(
      (n): n is string => Boolean(n?.trim())
    );

    for (const neighbor of neighbors) {
      if (isDeprioritizedContext(neighbor)) continue;
      if (isNotApplicableMetricLine(neighbor)) continue;
      if (neighborHasForeignMetricLabel(neighbor, rule)) continue;
      // Prefer compact value lines like "$18.6M"
      if (neighbor.length > 40) continue;
      const value = parseValueFromSegment(neighbor.trim(), rule.metricName);
      if (!value) continue;
      const combined = `${line} ${neighbor}`.trim();
      if (isDeprioritizedContext(combined)) continue;
      if (isNotApplicableMetricLine(combined)) continue;

      const labelStart = Math.max(0, found.index - 30);
      const matchedLabel = line.slice(labelStart, found.index + found.length).trim();
      // Keep real PDF text so evidence can be highlighted in the source document.
      results.push({
        metricName: rule.metricName,
        matchedLabel: matchedLabel || alias,
        alias,
        line: combined,
        value,
        sourcePage: page,
        afterLabel: true,
        immediate: neighbor.trim().length <= value.raw.length + 6,
      });
      break;
    }
  }

  return results;
}

function resolveLineConflicts(matches: RawMatch[]): RawMatch[] {
  const byLine = new Map<string, RawMatch[]>();
  for (const m of matches) {
    const key = `${m.sourcePage}::${m.line}`;
    const list = byLine.get(key) ?? [];
    list.push(m);
    byLine.set(key, list);
  }

  const kept: RawMatch[] = [];

  for (const lineMatches of byLine.values()) {
    lineMatches.sort((a, b) => b.alias.length - a.alias.length);
    const used: Array<{ start: number; end: number }> = [];

    for (const match of lineMatches) {
      const idx = match.line.toLowerCase().indexOf(match.alias.toLowerCase());
      if (idx < 0) continue;
      const span = { start: idx, end: idx + match.alias.length };
      const overlaps = used.some(
        (u) => !(span.end <= u.start || span.start >= u.end)
      );
      if (overlaps) continue;
      used.push(span);
      kept.push(match);
    }
  }

  return kept;
}

function extractMetricsFlexible(
  pages: PageText[],
  rules: ExtractionRule[],
  reportPeriod?: string
): ExtractionCandidate[] {
  const enabledRules = rules.filter((r) => r.enabled);
  const allMatches: RawMatch[] = [];

  for (const page of pages) {
    const lines = page.text.split(LINE_SEP).map((l) => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      for (const rule of enabledRules) {
        allMatches.push(...extractFromLine(lines[i], rule, page.page));
        allMatches.push(...extractAdjacentLineMatches(lines, i, rule, page.page));
      }
    }
  }

  const resolved = resolveLineConflicts(allMatches);
  const matchesByMetric = new Map<string, RawMatch[]>();

  for (const m of resolved) {
    const list = matchesByMetric.get(m.metricName) ?? [];
    list.push(m);
    matchesByMetric.set(m.metricName, list);
  }

  const results: ExtractionCandidate[] = [];

  for (const rule of enabledRules) {
    const matches = (matchesByMetric.get(rule.metricName) ?? []).filter(
      (m) => scoreMatch(m, reportPeriod) > -20
    );
    if (matches.length === 0) continue;

    const confidence = confidenceForMatches(matches, reportPeriod);
    const best = pickBestMatch(matches, reportPeriod);

    const valueType: ExtractionCandidate["valueType"] = /\b(forecast|outlook|projected|budget)\b/i.test(
      best.line
    )
      ? "forecast"
      : /\b(prior|previous)\b/i.test(best.line)
        ? "prior_period"
        : "actual";

    const tableContext =
      /\bQ[1-4]\s*REVENUE\b/i.test(best.line) || best.line.length < 80
        ? {
            rowLabel: best.matchedLabel,
            columnLabel: reportPeriod,
            period: reportPeriod,
            valueType,
          }
        : undefined;

    results.push({
      metricName: rule.metricName,
      extractedValue: best.value.raw,
      normalizedValue: best.value.normalized,
      unit: best.value.unit || rule.expectedUnit,
      sourcePage: best.sourcePage,
      evidenceText: formatEvidence(best.matchedLabel, best.value, best.line, best.alias),
      confidence,
      matchedLabel: best.matchedLabel,
      valueType,
      tableContext,
    });
  }

  return results;
}

/** Route to template or flexible extraction based on document marker. */
export function extractMetricsFromPages(
  pages: PageText[],
  rules: ExtractionRule[],
  reportPeriod?: string
): ExtractionCandidate[] {
  if (isIcReadyTemplateDocument(pages)) {
    return extractMetricsFromTemplatePages(pages);
  }
  return extractMetricsFlexible(pages, rules, reportPeriod);
}

export function buildMissingCandidates(
  extracted: ExtractionCandidate[],
  rules: ExtractionRule[]
): string[] {
  const found = new Set(extracted.map((e) => e.metricName));
  return rules.filter((r) => r.enabled && !found.has(r.metricName)).map((r) => r.metricName);
}

export { isIcReadyTemplateDocument } from "./template-extraction";
