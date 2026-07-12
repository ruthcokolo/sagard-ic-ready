/**
 * Turns raw text snippets from PDFs into numbers with units. Handles
 * currency, percentages, headcount, and filters out values that look wrong.
 */

export type ParsedValue = {
  raw: string;
  normalized: number | null;
  unit: string;
};

const ALL_METRICS_SET = new Set(["Revenue", "ARR", "EBITDA", "Cash", "Headcount", "Churn"]);

const CURRENCY_VALUE =
  /\$\s*([\d,]+(?:\.\d+)?)\s*(million|millions|m\b|billion|billions|\bb\b(?!o)|k\b|thousand)?|\$([\d,]+(?:\.\d+)?)([mMbBkK])\b|([\d,]+(?:\.\d+)?)\s*(million|millions|billion|billions)\b/i;
const PERCENT_VALUE = /([\d,]+(?:\.\d+)?)\s*%/;
const COUNT_VALUE = /([\d,]+(?:\.\d+)?)\s*(?:FTE|fte|employees|employee|people|headcount)?/i;

/** Convert a dollar string (with M/B/K suffix) into a number and unit. */
export function normalizeCurrency(raw: string, multiplier?: string): { value: number; unit: string } | null {
  const cleaned = raw.replace(/,/g, "");
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return null;

  const m = multiplier?.toLowerCase();
  if (m === "million" || m === "millions" || m === "m") {
    return { value: num * 1_000_000, unit: "USD" };
  }
  if (m === "billion" || m === "billions" || m === "b") {
    return { value: num * 1_000_000_000, unit: "USD" };
  }
  if (m === "k" || m === "thousand") {
    return { value: num * 1_000, unit: "USD" };
  }
  if (num >= 1_000_000) return { value: num, unit: "USD" };
  if (num < 10_000 && raw.includes(".")) {
    return { value: num * 1_000_000, unit: "USD millions" };
  }
  return { value: num, unit: "USD" };
}

/** True when a parsed number looks like a year or other false match, not a real metric. */
export function isInvalidNumericValue(
  raw: string,
  normalized: number | null,
  metricName: string
): boolean {
  if (normalized == null) return false;
  if (metricName === "Churn" || metricName === "Headcount") {
    if (normalized >= 1900 && normalized <= 2100 && !raw.includes("%")) return true;
    return false;
  }
  if (normalized != null && normalized < 1000) {
    if (!raw.includes("$") && !/\b(million|millions|m|billion|billions|b|k|thousand)\b/i.test(raw)) {
      return true;
    }
  }
  if (!raw.includes("$") && !/\b(million|millions|m|billion|b|k)\b/i.test(raw)) {
    if (normalized >= 1900 && normalized <= 2100) return true;
  }
  if (/^Q[1-4]\s*$/i.test(raw.trim())) return true;
  return false;
}

/** Parse one text chunk into a raw value, normalized number, and unit for a metric. */
export function parseValueFromSegment(segment: string, metricName: string): ParsedValue | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;

  // Dashes and blank cells are not zero.
  if (/^(—|–|-|n\/?a|nm|nil|null|\.)$/i.test(trimmed)) {
    return null;
  }

  // Bracketed negatives: (2.7) → treat as negative when currency-like
  const bracket = trimmed.match(/^\(\s*\$?\s*([\d,]+(?:\.\d+)?)\s*([mMbBkK])?\s*\)$/);
  if (
    bracket &&
    (metricName === "Revenue" ||
      metricName === "EBITDA" ||
      metricName === "Cash" ||
      metricName === "ARR" ||
      !["Churn", "Headcount"].includes(metricName))
  ) {
    const mult = bracket[2] ? bracket[2] : undefined;
    const norm = normalizeCurrency(
      bracket[1],
      mult === "m" || mult === "M"
        ? "m"
        : mult === "b" || mult === "B"
          ? "b"
          : mult === "k" || mult === "K"
            ? "k"
            : undefined
    );
    if (norm) {
      return {
        raw: trimmed,
        normalized: -Math.abs(norm.value),
        unit: norm.unit,
      };
    }
  }

  if (metricName === "Churn") {
    const match = trimmed.match(PERCENT_VALUE);
    if (match) {
      const normalized = parseFloat(match[1].replace(/,/g, ""));
      const raw = match[0].trim();
      if (isInvalidNumericValue(raw, normalized, metricName)) return null;
      return {
        raw,
        normalized: Number.isNaN(normalized) ? null : normalized,
        unit: "percent",
      };
    }
    return null;
  }

  if (metricName === "Headcount") {
    const match = trimmed.match(COUNT_VALUE);
    if (match) {
      const normalized = parseFloat(match[1].replace(/,/g, ""));
      const raw = match[0].trim();
      if (isInvalidNumericValue(raw, normalized, metricName)) return null;
      return {
        raw,
        normalized: Number.isNaN(normalized) ? null : normalized,
        unit: "count",
      };
    }
    return null;
  }

  // Percent-style custom metrics
  const percentMatch = trimmed.match(PERCENT_VALUE);
  if (percentMatch && (metricName.toLowerCase().includes("rate") || metricName.toLowerCase().includes("%"))) {
    const normalized = parseFloat(percentMatch[1].replace(/,/g, ""));
    return {
      raw: percentMatch[0].trim(),
      normalized: Number.isNaN(normalized) ? null : normalized,
      unit: "%",
    };
  }

  // Count-style custom metrics
  const countMatch = trimmed.match(COUNT_VALUE);
  if (
    countMatch &&
    (metricName.toLowerCase().includes("count") ||
      metricName.toLowerCase().includes("occupancy") ||
      metricName.toLowerCase().includes("fte"))
  ) {
    const normalized = parseFloat(countMatch[1].replace(/,/g, ""));
    return {
      raw: countMatch[0].trim(),
      normalized: Number.isNaN(normalized) ? null : normalized,
      unit: "count",
    };
  }

  const currencyMatch = trimmed.match(CURRENCY_VALUE);
  if (currencyMatch) {
    // Never treat percentage deltas (+24.8% YoY) as currency.
    const matched = currencyMatch[0];
    const after = trimmed.slice(
      (currencyMatch.index ?? 0) + matched.length,
      (currencyMatch.index ?? 0) + matched.length + 3
    );
    if (/%/.test(matched) || /^\s*%/.test(after)) {
      return null;
    }

    const amount = currencyMatch[1] ?? currencyMatch[3] ?? currencyMatch[5];
    const multiplier = currencyMatch[2] ?? currencyMatch[4] ?? currencyMatch[6];
    const normalized = normalizeCurrency(amount, multiplier);
    if (normalized) {
      const raw = matched.trim();
      if (isInvalidNumericValue(raw, normalized.value, metricName)) return null;
      return {
        raw,
        normalized: normalized.value,
        unit: normalized.unit,
      };
    }
  }

  // Generic numeric fallback for custom metrics
  if (!ALL_METRICS_SET.has(metricName)) {
    const generic = trimmed.match(/([\d,]+(?:\.\d+)?)\s*%?/);
    if (generic) {
      const normalized = parseFloat(generic[1].replace(/,/g, ""));
      return {
        raw: generic[0].trim(),
        normalized: Number.isNaN(normalized) ? null : normalized,
        unit: trimmed.includes("%") ? "%" : "value",
      };
    }
  }

  return null;
}
