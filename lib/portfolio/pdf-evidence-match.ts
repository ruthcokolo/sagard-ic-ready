/**
 * Exact evidence-phrase matching against PDF.js text items.
 * Highlights only the stored excerpt — never approximate paragraph boxes.
 */

export type PhraseMatchQuery = {
  evidenceText: string;
  extractedValue?: string;
  /** Used for flexible locate when the stored excerpt is not contiguous in PDF text. */
  metricName?: string;
};

export type PhraseSpanRole = "phrase" | "value";

export type PhraseMatchedSpan = {
  textItemIndex: number;
  role: PhraseSpanRole;
  /** Character range within the raw PDF text item. */
  charStart: number;
  charEnd: number;
};

export type PhraseLocateResult =
  | {
      status: "located";
      spans: PhraseMatchedSpan[];
      matchedPhrase: string;
    }
  | {
      status: "unavailable";
      spans: [];
      message: string;
    };

const UNAVAILABLE =
  "Exact evidence phrase could not be located on this page.";

const METRIC_ALIASES: Record<string, string[]> = {
  Revenue: ["total revenue", "net revenue", "net sales", "revenue", "sales"],
  ARR: ["annual recurring revenue", "recurring revenue", "run-rate revenue", "arr"],
  EBITDA: ["adjusted ebitda", "ebitda"],
  Cash: ["cash and cash equivalents", "cash balance", "liquidity", "cash"],
  Headcount: ["total employees", "full-time employees", "employees", "headcount", "fte"],
  Churn: ["logo churn", "revenue churn", "gross churn", "net churn", "churn"],
};

function aliasesForMetric(metricName?: string): string[] {
  if (!metricName) return [];
  return METRIC_ALIASES[metricName] ?? [metricName.toLowerCase()];
}

/** Normalize for phrase comparison. */
export function normalizeEvidencePhrase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/,/g, "")
    .replace(/[^\w\s.$%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type StreamPart = {
  index: number;
  raw: string;
  /** Normalized form of this item alone (trimmed). */
  norm: string;
  /** Start/end of this item in the joined normalized stream. */
  joinStart: number;
  joinEnd: number;
};

function normalizeItem(raw: string): { norm: string } {
  let norm = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (/\s/.test(ch) || ch === "\u00a0") {
      if (norm.length > 0 && !norm.endsWith(" ")) norm += " ";
      continue;
    }
    if (ch === ",") continue;
    if (/[a-z0-9.$%]/i.test(ch)) {
      norm += ch.toLowerCase();
    }
  }
  return { norm: norm.trim() };
}

function buildStream(items: Array<{ str?: string } | null | undefined>): {
  joined: string;
  parts: StreamPart[];
} {
  const parts: StreamPart[] = [];
  let joined = "";

  items.forEach((item, index) => {
    if (!item || typeof item.str !== "string" || !item.str) return;
    const { norm } = normalizeItem(item.str);
    if (!norm) return;
    if (joined.length > 0) joined += " ";
    const joinStart = joined.length;
    joined += norm;
    parts.push({
      index,
      raw: item.str,
      norm,
      joinStart,
      joinEnd: joined.length,
    });
  });

  return { joined, parts };
}

function mapJoinRangeToRaw(
  part: StreamPart,
  joinFrom: number,
  joinTo: number
): { charStart: number; charEnd: number } | null {
  const localFrom = Math.max(0, joinFrom - part.joinStart);
  const localTo = Math.min(part.norm.length, joinTo - part.joinStart);
  if (localTo <= localFrom) return null;

  const rawToNorm: number[] = new Array(part.raw.length).fill(-1);
  let n = "";
  for (let i = 0; i < part.raw.length; i++) {
    const ch = part.raw[i];
    if (/\s/.test(ch) || ch === "\u00a0") {
      if (n.length > 0 && !n.endsWith(" ")) {
        rawToNorm[i] = n.length;
        n += " ";
      }
      continue;
    }
    if (ch === ",") continue;
    if (/[a-z0-9.$%]/i.test(ch)) {
      rawToNorm[i] = n.length;
      n += ch.toLowerCase();
    }
  }

  const trimStart = n.indexOf(part.norm);
  const absFrom = (trimStart >= 0 ? trimStart : 0) + localFrom;
  const absTo = (trimStart >= 0 ? trimStart : 0) + localTo;

  let charStart = -1;
  let charEnd = -1;
  for (let i = 0; i < rawToNorm.length; i++) {
    const ni = rawToNorm[i];
    if (ni < 0) continue;
    if (ni >= absFrom && ni < absTo) {
      if (charStart < 0) charStart = i;
      charEnd = i + 1;
    }
  }
  if (charStart < 0 || charEnd <= charStart) {
    return { charStart: 0, charEnd: part.raw.length };
  }
  return { charStart, charEnd };
}

function valueNeedles(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const variants = new Set<string>();
  variants.add(normalizeEvidencePhrase(t));
  const money = t.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*([KMBTkmbt])?\b/);
  if (money) {
    const num = money[1].replace(/,/g, "");
    const suffix = money[2] ? money[2].toLowerCase() : "";
    variants.add(normalizeEvidencePhrase(`$${num}${suffix}`));
    variants.add(normalizeEvidencePhrase(`${num}${suffix}`));
  }
  return [...variants].filter((v) => v.length >= 2).sort((a, b) => b.length - a.length);
}

/**
 * Find the shortest contiguous text-item window whose joined normalized text
 * contains `target`. Returns character offsets into the global joined stream.
 */
function findShortestPhraseWindow(
  joined: string,
  parts: StreamPart[],
  target: string
): { matchStart: number; matchEnd: number } | null {
  if (!target || parts.length === 0) return null;

  let best: { matchStart: number; matchEnd: number; spanCount: number } | null = null;

  for (let i = 0; i < parts.length; i++) {
    for (let j = i; j < parts.length; j++) {
      const window = joined.slice(parts[i].joinStart, parts[j].joinEnd);
      const localIdx = window.indexOf(target);
      if (localIdx < 0) continue;

      const matchStart = parts[i].joinStart + localIdx;
      const matchEnd = matchStart + target.length;
      const spanCount = j - i + 1;

      if (
        !best ||
        spanCount < best.spanCount ||
        (spanCount === best.spanCount && matchStart < best.matchStart)
      ) {
        best = { matchStart, matchEnd, spanCount };
      }

      // Once this start item can form a match, longer end windows for the same
      // start cannot be shorter — advance outer loop.
      break;
    }
  }

  // Fallback: direct substring search (handles rare join-edge cases).
  if (!best) {
    const idx = joined.indexOf(target);
    if (idx < 0) return null;
    return { matchStart: idx, matchEnd: idx + target.length };
  }

  return { matchStart: best.matchStart, matchEnd: best.matchEnd };
}

function spansForJoinRange(
  parts: StreamPart[],
  matchStart: number,
  matchEnd: number,
  role: PhraseSpanRole
): PhraseMatchedSpan[] {
  const spans: PhraseMatchedSpan[] = [];
  for (const part of parts) {
    if (part.joinEnd <= matchStart || part.joinStart >= matchEnd) continue;
    const mapped = mapJoinRangeToRaw(part, matchStart, matchEnd);
    if (!mapped) continue;
    spans.push({
      textItemIndex: part.index,
      role,
      charStart: mapped.charStart,
      charEnd: mapped.charEnd,
    });
  }
  return spans;
}

/**
 * Locate the shortest contiguous PDF text-item window containing the evidence excerpt.
 * Falls back to metric-label + extracted-value proximity when the stored phrase is not
 * contiguous (common for KPI cards / table cells).
 */
export function locateEvidencePhraseOnPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textContent: { items: any[] },
  query: PhraseMatchQuery
): PhraseLocateResult {
  const fullTarget = normalizeEvidencePhrase(query.evidenceText ?? "");
  const { joined, parts } = buildStream(textContent.items);
  if (!joined || parts.length === 0) {
    return { status: "unavailable", spans: [], message: UNAVAILABLE };
  }

  let window =
    fullTarget.length >= 6 ? findShortestPhraseWindow(joined, parts, fullTarget) : null;

  // Truncated excerpts: retry with a shorter prefix of the stored phrase.
  if (!window && fullTarget.length >= 12) {
    const shortened = fullTarget.slice(0, Math.max(12, Math.floor(fullTarget.length * 0.85)));
    window = findShortestPhraseWindow(joined, parts, shortened);
  }

  if (!window) {
    window = findLabelValueWindow(joined, parts, query);
  }

  if (!window) {
    return { status: "unavailable", spans: [], message: UNAVAILABLE };
  }

  const { matchStart, matchEnd } = window;
  const spans = spansForJoinRange(parts, matchStart, matchEnd, "phrase");
  if (spans.length === 0) {
    return { status: "unavailable", spans: [], message: UNAVAILABLE };
  }

  const needles = valueNeedles(query.extractedValue ?? "");
  if (needles.length > 0) {
    const slice = joined.slice(matchStart, matchEnd);
    for (const needle of needles) {
      const local = slice.indexOf(needle);
      if (local < 0) continue;
      const valueStart = matchStart + local;
      const valueEnd = valueStart + needle.length;
      spans.push(...spansForJoinRange(parts, valueStart, valueEnd, "value"));
      break;
    }
  }

  return {
    status: "located",
    spans,
    matchedPhrase: query.evidenceText.trim() || query.extractedValue?.trim() || "",
  };
}

/**
 * Find metric label then a value shortly after it (same reading order as the PDF stream).
 * Skips N/A contexts so debt/cash amounts near an "ARR not applicable" line do not bind.
 */
function findLabelValueWindow(
  joined: string,
  _parts: StreamPart[],
  query: PhraseMatchQuery
): { matchStart: number; matchEnd: number } | null {
  const needles = valueNeedles(query.extractedValue ?? "");
  if (needles.length === 0) return null;

  const aliases = [
    ...aliasesForMetric(query.metricName),
    ...normalizeEvidencePhrase(query.evidenceText)
      .split(" ")
      .filter((w) => w.length >= 3 && !/^[\d.$%]+$/.test(w)),
  ];
  const uniqueAliases = [...new Set(aliases.map((a) => normalizeEvidencePhrase(a)).filter(Boolean))];
  if (uniqueAliases.length === 0) return null;

  let best: { matchStart: number; matchEnd: number; distance: number } | null = null;

  for (const alias of uniqueAliases) {
    let from = 0;
    while (from < joined.length) {
      const aliasIdx = joined.indexOf(alias, from);
      if (aliasIdx < 0) break;
      const aliasEnd = aliasIdx + alias.length;
      const after = joined.slice(aliasEnd, aliasEnd + 72);
      if (
        /\b(not applicable|n\/?a|omitted|not disclosed|not provided|does not apply|not used)\b/i.test(
          after
        )
      ) {
        from = aliasEnd;
        continue;
      }

      for (const needle of needles) {
        const local = after.indexOf(needle);
        if (local < 0) continue;
        const valueStart = aliasEnd + local;
        const valueEnd = valueStart + needle.length;
        const distance = local;
        if (!best || distance < best.distance) {
          best = { matchStart: aliasIdx, matchEnd: valueEnd, distance };
        }
      }
      from = aliasEnd;
    }
  }

  return best ? { matchStart: best.matchStart, matchEnd: best.matchEnd } : null;
}

export function itemViewportGeometry(
  transform: number[],
  viewport: { transform: number[] },
  itemWidth: number
) {
  const [a, b, c, d, e, f] = transform;
  const vt = viewport.transform;
  const tx = [
    vt[0] * a + vt[2] * b,
    vt[1] * a + vt[3] * b,
    vt[0] * c + vt[2] * d,
    vt[1] * c + vt[3] * d,
    vt[0] * e + vt[2] * f + vt[4],
    vt[1] * e + vt[3] * f + vt[5],
  ];
  const fontHeight = Math.max(Math.hypot(tx[2], tx[3]), 1);
  const fontSizeInTextSpace = Math.max(Math.hypot(a, b), Math.hypot(c, d), 1);
  const scaleFactor = fontHeight / fontSizeInTextSpace;
  const runWidth = Math.max(itemWidth * scaleFactor, fontHeight * 0.35);
  return {
    left: tx[4],
    top: tx[5] - fontHeight,
    width: runWidth,
    height: fontHeight * 1.15,
    fontHeight,
  };
}

/** @deprecated Use locateEvidencePhraseOnPage */
export const locateEvidenceOnPage = locateEvidencePhraseOnPage;
